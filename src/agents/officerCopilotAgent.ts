// ============================================================
// OFFICER COPILOT AGENT
// Generates structured review summaries for loan officers
// ============================================================

import { generateOfficerSummary } from '../ai/anthropicAdapter'
import { officerCopilotPrompt } from '../ai/promptTemplates'
import { createServiceRoleClient } from '../db/supabase'
import { logger } from '../lib/logger'
import type { OfficerCopilotOutput } from '../ai/schemas'
import type { DocumentType } from '../domain/enums'

export class OfficerCopilotAgent {
  async generateSummary(loanId: string): Promise<OfficerCopilotOutput | null> {
    const db = createServiceRoleClient()

    try {
      // Fetch loan with borrower
      const { data: loan, error: loanError } = await db
        .from('loans')
        .select(`
          *,
          borrower:borrowers(full_name)
        `)
        .eq('id', loanId)
        .single()

      if (loanError || !loan) {
        logger.error('Loan not found for copilot', { loanId })
        return null
      }

      // Fetch document requirements with latest uploaded doc
      const { data: requirements } = await db
        .from('document_requirements')
        .select(`
          doc_type,
          state,
          uploaded_documents(confidence_score, issues, document_state)
        `)
        .eq('loan_id', loanId)

      // Fetch open escalations
      const { data: escalations } = await db
        .from('escalations')
        .select('category, severity, status')
        .eq('loan_id', loanId)
        .in('status', ['open', 'acknowledged'])

      const documentSummaries = (requirements ?? []).map((req) => {
        const docs = (req.uploaded_documents as { confidence_score: number | null; issues: string[] | null; document_state: string }[] | null) ?? []
        const latestDoc = docs[docs.length - 1]
        const issues: string[] = latestDoc?.issues ?? []
        return {
          doc_type: req.doc_type as DocumentType,
          state: req.state,
          issues,
          confidence_score: latestDoc?.confidence_score ?? null,
        }
      })

      const prompt = officerCopilotPrompt({
        loanId,
        borrowerName: (loan.borrower as { full_name: string } | null)?.full_name ?? 'Unknown',
        loanType: loan.loan_type,
        workflowState: loan.workflow_state,
        documentSummaries,
        escalations: escalations ?? [],
      })

      const summary = await generateOfficerSummary(prompt)
      return summary
    } catch (error) {
      logger.error('Officer copilot failed', { loanId, error })
      return null
    }
  }
}
