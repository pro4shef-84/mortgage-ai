// ============================================================
// DOCUMENT PIPELINE
// File precheck → Storage upload → AI classify → Validate → Match
// ============================================================

import { createServiceRoleClient } from '../db/supabase'
import { DocumentRepository } from '../db/repositories/documentRepository'
import { DocumentIntelligenceAgent } from '../agents/documentIntelligenceAgent'
import { WorkflowEngine } from '../workflow/workflowEngine'
import { isAllowedMimeType } from '../lib/utils'
import { config } from '../lib/config'
import { logger } from '../lib/logger'
import {
  UploadedDocumentState,
  DocumentRequirementState,
} from '../domain/enums'

export interface PipelineResult {
  success: boolean
  document_id?: string
  storage_path?: string
  error?: string
  validation_issues?: string[]
  needs_human_review?: boolean
}

const MAX_FILE_SIZE = config.documents.maxFileSizeMB * 1024 * 1024

export class DocumentPipeline {
  private docRepo: DocumentRepository
  private agent: DocumentIntelligenceAgent
  private engine: WorkflowEngine

  constructor() {
    this.docRepo = new DocumentRepository()
    this.agent = new DocumentIntelligenceAgent()
    this.engine = new WorkflowEngine()
  }

  async process(params: {
    loanId: string
    requirementId: string
    fileBuffer: Buffer
    fileName: string
    fileSize: number
    mimeType: string
    uploadedBy?: string
  }): Promise<PipelineResult> {
    // ── Step 1: Precheck ────────────────────────────────────
    const precheckResult = this.precheck(params)
    if (!precheckResult.valid) {
      return { success: false, error: precheckResult.error }
    }

    const db = createServiceRoleClient()

    // ── Step 2: Create document record ──────────────────────
    const doc = await this.docRepo.createUploadedDocument({
      loan_id: params.loanId,
      requirement_id: params.requirementId,
      storage_path: '', // will be updated after upload
      file_name: params.fileName,
      file_size: params.fileSize,
      mime_type: params.mimeType,
    })

    if (!doc) {
      return { success: false, error: 'Failed to create document record' }
    }

    // ── Step 3: Upload to Supabase Storage ──────────────────
    const storagePath = `${params.loanId}/${doc.id}/${params.fileName}`

    const { error: uploadError } = await db.storage
      .from(config.documents.storageBucket)
      .upload(storagePath, params.fileBuffer, {
        contentType: params.mimeType,
        upsert: false,
      })

    if (uploadError) {
      logger.error('Storage upload failed', {
        documentId: doc.id,
        error: uploadError,
      })
      await this.docRepo.updateDocument(doc.id, {
        document_state: UploadedDocumentState.PrecheckFailed,
      })
      return { success: false, error: 'File upload failed. Please try again.' }
    }

    // Update storage path
    await this.docRepo.updateDocument(doc.id, { storage_path: storagePath })

    // ── Step 4: Supersede previous documents for this requirement ──
    await this.docRepo.supersedePreviousDocuments(params.requirementId, doc.id)

    // ── Step 5: Notify workflow of upload ───────────────────
    await this.engine.onDocumentReceived(params.loanId, params.requirementId, doc.id)

    // ── Step 6: Run AI pipeline ─────────────────────────────
    const result = await this.agent.processDocument({
      documentId: doc.id,
      loanId: params.loanId,
      requirementId: params.requirementId,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileDescription: `Uploaded file: ${params.fileName} (${params.mimeType}, ${params.fileSize} bytes)`,
    })

    logger.info('Document pipeline complete', {
      documentId: doc.id,
      loanId: params.loanId,
      classification: result.classification,
      confidence: result.confidence_score,
      passed: result.validation_passed,
      needsHumanReview: result.needs_human_review,
    })

    return {
      success: result.success,
      document_id: doc.id,
      storage_path: storagePath,
      error: result.error,
      validation_issues: result.issues,
      needs_human_review: result.needs_human_review,
    }
  }

  private precheck(params: {
    fileSize: number
    mimeType: string
    fileName: string
  }): { valid: boolean; error?: string } {
    if (params.fileSize > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File is too large. Maximum allowed size is ${config.documents.maxFileSizeMB}MB.`,
      }
    }

    if (!isAllowedMimeType(params.mimeType)) {
      return {
        valid: false,
        error: 'File type not supported. Please upload a PDF, JPG, or PNG file.',
      }
    }

    if (!params.fileName || params.fileName.length > 255) {
      return { valid: false, error: 'Invalid file name.' }
    }

    return { valid: true }
  }
}
