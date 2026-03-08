// ============================================================
// INTAKE AGENT
// Generates document checklist based on loan type (deterministic)
// ============================================================

import {
  DocumentType,
  LoanType,
  DocumentRequirementState,
} from '../domain/enums'
import { REQUIRED_DOCS_BY_LOAN_TYPE } from '../domain/rules/documentValidationRules'
import { createServiceRoleClient } from '../db/supabase'
import { logger } from '../lib/logger'

export class IntakeAgent {
  async generateChecklist(params: {
    loanId: string
    loanType: LoanType
  }): Promise<{ success: boolean; requirements: string[]; error?: string }> {
    const db = createServiceRoleClient()

    const requiredDocs = REQUIRED_DOCS_BY_LOAN_TYPE[params.loanType]
    if (!requiredDocs) {
      return {
        success: false,
        requirements: [],
        error: `Unsupported loan type: ${params.loanType}`,
      }
    }

    // Check if requirements already exist
    const { data: existing } = await db
      .from('document_requirements')
      .select('id, doc_type')
      .eq('loan_id', params.loanId)

    if (existing && existing.length > 0) {
      logger.info('Checklist already exists for loan', {
        loanId: params.loanId,
        count: existing.length,
      })
      return {
        success: true,
        requirements: existing.map((r) => r.id),
      }
    }

    // Insert all required document requirements
    const records = requiredDocs.map((docType) => ({
      loan_id: params.loanId,
      doc_type: docType,
      state: DocumentRequirementState.Required,
    }))

    const { data, error } = await db
      .from('document_requirements')
      .insert(records)
      .select('id')

    if (error) {
      logger.error('Failed to create document checklist', {
        loanId: params.loanId,
        error,
      })
      return { success: false, requirements: [], error: error.message }
    }

    logger.info('Checklist generated', {
      loanId: params.loanId,
      docs: requiredDocs,
    })

    return {
      success: true,
      requirements: (data ?? []).map((r: { id: string }) => r.id),
    }
  }

  getRequiredDocTypes(loanType: LoanType): DocumentType[] {
    return REQUIRED_DOCS_BY_LOAN_TYPE[loanType] ?? []
  }
}
