// ============================================================
// ZOD SCHEMAS FOR AI OUTPUTS
// All AI responses must conform to these schemas
// ============================================================

import { z } from 'zod'

export const DocumentTypeSchema = z.enum([
  'pay_stub',
  'w2',
  'bank_statement',
  'government_id',
  'purchase_contract',
  'unknown_document',
])

export const DocumentIntelligenceSchema = z.object({
  doc_type: DocumentTypeSchema,
  confidence_score: z.number().min(0).max(1),
  issues: z.array(z.string()),
  rationale_summary: z.string(),
  extracted_fields: z.record(z.string(), z.string()),
})

export const BorrowerMessageSchema = z.object({
  message: z.string(),
  is_advisory_question: z.boolean(),
  escalation_required: z.boolean(),
  escalation_reason: z.string().nullable(),
})

export const OfficerCopilotSchema = z.object({
  loan_id: z.string(),
  overall_status: z.string(),
  unresolved_issues: z.array(z.string()),
  confidence_flags: z.array(z.string()),
  recommended_actions: z.array(z.string()),
  document_summaries: z.array(
    z.object({
      doc_type: DocumentTypeSchema,
      state: z.string(),
      issues: z.array(z.string()),
    })
  ),
})

export type DocumentIntelligenceOutput = z.infer<typeof DocumentIntelligenceSchema>
export type BorrowerMessageOutput = z.infer<typeof BorrowerMessageSchema>
export type OfficerCopilotOutput = z.infer<typeof OfficerCopilotSchema>
