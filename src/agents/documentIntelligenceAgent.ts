// ============================================================
// DOCUMENT INTELLIGENCE AGENT
// Classifies documents and triggers deterministic validation
// ============================================================

import { classifyDocument } from '../ai/anthropicAdapter'
import { documentClassificationPrompt } from '../ai/promptTemplates'
import { validateDocument, CONFIDENCE_THRESHOLD } from '../domain/rules/documentValidationRules'
import { DocumentType, EscalationCategory, EscalationSeverity, UploadedDocumentState } from '../domain/enums'
import { createServiceRoleClient } from '../db/supabase'
import { WorkflowEngine } from '../workflow/workflowEngine'
import { logger } from '../lib/logger'
import type { DocumentIntelligenceOutput } from '../ai/schemas'
import type { ExtractedFields } from '../domain/rules/documentValidationRules'

export interface ProcessDocumentResult {
  success: boolean
  document_id: string
  classification: DocumentType
  confidence_score: number
  issues: string[]
  needs_human_review: boolean
  validation_passed: boolean
  error?: string
}

export class DocumentIntelligenceAgent {
  private engine: WorkflowEngine

  constructor() {
    this.engine = new WorkflowEngine()
  }

  async processDocument(params: {
    documentId: string
    loanId: string
    requirementId: string
    fileName: string
    mimeType: string
    fileDescription?: string
  }): Promise<ProcessDocumentResult> {
    const db = createServiceRoleClient()

    try {
      // Mark document as processing
      await db.from('uploaded_documents').update({
        document_state: UploadedDocumentState.Processing,
        updated_at: new Date().toISOString(),
      }).eq('id', params.documentId)

      // Build prompt
      const prompt = documentClassificationPrompt({
        fileName: params.fileName,
        mimeType: params.mimeType,
        fileDescription: params.fileDescription ?? `File: ${params.fileName}`,
      })

      // Call AI
      let aiResult: DocumentIntelligenceOutput
      try {
        aiResult = await classifyDocument(prompt)
      } catch (aiError) {
        logger.error('AI classification failed', { documentId: params.documentId, error: aiError })
        await this.handleSystemFailure(params.documentId, params.loanId, db)
        return {
          success: false,
          document_id: params.documentId,
          classification: DocumentType.UnknownDocument,
          confidence_score: 0,
          issues: ['AI classification system error — document sent for human review.'],
          needs_human_review: true,
          validation_passed: false,
          error: 'AI system error',
        }
      }

      // Mark as classified
      await db.from('uploaded_documents').update({
        document_state: UploadedDocumentState.Classified,
        classification: aiResult.doc_type,
        confidence_score: aiResult.confidence_score,
        ai_rationale: aiResult.rationale_summary,
        updated_at: new Date().toISOString(),
      }).eq('id', params.documentId)

      // Check if confidence is too low → escalate to human
      if (aiResult.confidence_score < CONFIDENCE_THRESHOLD) {
        logger.warn('Low confidence classification', {
          documentId: params.documentId,
          score: aiResult.confidence_score,
          doc_type: aiResult.doc_type,
        })

        await db.from('uploaded_documents').update({
          document_state: UploadedDocumentState.NeedsHumanReview,
          issues: JSON.stringify([
            ...aiResult.issues,
            `Classification confidence (${(aiResult.confidence_score * 100).toFixed(0)}%) below threshold — human review required.`,
          ]),
          updated_at: new Date().toISOString(),
        }).eq('id', params.documentId)

        await this.engine.createEscalation(params.loanId, {
          category: EscalationCategory.LowConfidenceClassification,
          severity: EscalationSeverity.High,
        })

        return {
          success: true,
          document_id: params.documentId,
          classification: aiResult.doc_type as DocumentType,
          confidence_score: aiResult.confidence_score,
          issues: aiResult.issues,
          needs_human_review: true,
          validation_passed: false,
        }
      }

      // Unknown document type
      if (aiResult.doc_type === 'unknown_document') {
        const issues = [
          ...aiResult.issues,
          'Document type could not be identified. Please upload the correct document.',
        ]

        await db.from('uploaded_documents').update({
          document_state: UploadedDocumentState.Rejected,
          issues: JSON.stringify(issues),
          updated_at: new Date().toISOString(),
        }).eq('id', params.documentId)

        await this.engine.onDocumentValidated(
          params.loanId,
          params.requirementId,
          params.documentId,
          false,
          false,
          issues
        )

        return {
          success: true,
          document_id: params.documentId,
          classification: DocumentType.UnknownDocument,
          confidence_score: aiResult.confidence_score,
          issues,
          needs_human_review: false,
          validation_passed: false,
        }
      }

      // Run deterministic validation rules
      const validation = validateDocument(
        aiResult.doc_type as DocumentType,
        aiResult.extracted_fields as ExtractedFields
      )

      const allIssues = [...new Set([...aiResult.issues, ...validation.issues])]

      // Check for suspicious document indicators
      const isSuspicious = this.detectSuspiciousIndicators(aiResult)
      if (isSuspicious) {
        await db.from('uploaded_documents').update({
          document_state: UploadedDocumentState.NeedsHumanReview,
          issues: JSON.stringify([...allIssues, 'Document flagged for potential authenticity concerns — human review required.']),
          updated_at: new Date().toISOString(),
        }).eq('id', params.documentId)

        await this.engine.createEscalation(params.loanId, {
          category: EscalationCategory.SuspiciousDocument,
          severity: EscalationSeverity.Critical,
        })

        return {
          success: true,
          document_id: params.documentId,
          classification: aiResult.doc_type as DocumentType,
          confidence_score: aiResult.confidence_score,
          issues: allIssues,
          needs_human_review: true,
          validation_passed: false,
        }
      }

      // Update document with final validation result
      const finalState = validation.valid
        ? UploadedDocumentState.ValidatedOk
        : UploadedDocumentState.ValidatedIssuFound

      await db.from('uploaded_documents').update({
        document_state: finalState,
        issues: JSON.stringify(allIssues),
        updated_at: new Date().toISOString(),
      }).eq('id', params.documentId)

      // Trigger workflow update
      await this.engine.onDocumentValidated(
        params.loanId,
        params.requirementId,
        params.documentId,
        validation.valid,
        false,
        allIssues
      )

      return {
        success: true,
        document_id: params.documentId,
        classification: aiResult.doc_type as DocumentType,
        confidence_score: aiResult.confidence_score,
        issues: allIssues,
        needs_human_review: false,
        validation_passed: validation.valid,
      }
    } catch (error) {
      logger.error('Document processing failed', { documentId: params.documentId, error })
      await this.handleSystemFailure(params.documentId, params.loanId, db)
      return {
        success: false,
        document_id: params.documentId,
        classification: DocumentType.UnknownDocument,
        confidence_score: 0,
        issues: ['System error during document processing.'],
        needs_human_review: true,
        validation_passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private detectSuspiciousIndicators(result: DocumentIntelligenceOutput): boolean {
    const suspiciousKeywords = [
      'altered',
      'modified',
      'inconsistent font',
      'suspicious',
      'potentially fraudulent',
      'editing artifacts',
      'metadata mismatch',
    ]
    const combinedText = [
      result.rationale_summary,
      ...result.issues,
    ].join(' ').toLowerCase()

    return suspiciousKeywords.some((kw) => combinedText.includes(kw))
  }

  private async handleSystemFailure(
    documentId: string,
    loanId: string,
    db: ReturnType<typeof createServiceRoleClient>
  ): Promise<void> {
    await db.from('uploaded_documents').update({
      document_state: UploadedDocumentState.NeedsHumanReview,
      issues: JSON.stringify(['System processing error — document sent for human review.']),
      updated_at: new Date().toISOString(),
    }).eq('id', documentId)

    await this.engine.createEscalation(loanId, {
      category: EscalationCategory.SystemProcessingFailure,
      severity: EscalationSeverity.High,
    })
  }
}
