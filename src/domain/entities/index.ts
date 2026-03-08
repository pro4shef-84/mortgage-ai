// ============================================================
// ALL DOMAIN ENTITIES — typed interfaces for mortgage-ai
// ============================================================

import {
  LoanWorkflowState,
  DocumentRequirementState,
  UploadedDocumentState,
  EscalationState,
  EscalationSeverity,
  EscalationCategory,
  DocumentType,
  LoanType,
  EmploymentType,
  NotificationChannel,
  ReviewDecisionType,
  EventType,
} from '../enums'

export interface Borrower {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  portal_token: string
  created_at: string
}

export interface Officer {
  id: string
  full_name: string
  email: string
  created_at: string
}

export interface Loan {
  id: string
  borrower_id: string
  officer_id: string
  loan_type: LoanType
  workflow_state: LoanWorkflowState
  property_state: string | null
  employment_type: EmploymentType
  created_at: string
  updated_at: string
  // joined relations (optional)
  borrower?: Borrower
  officer?: Officer
}

export interface DocumentRequirement {
  id: string
  loan_id: string
  doc_type: DocumentType
  state: DocumentRequirementState
  created_at: string
  updated_at: string
  // joined
  uploaded_documents?: UploadedDocument[]
}

export interface UploadedDocument {
  id: string
  loan_id: string
  requirement_id: string | null
  storage_path: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  classification: DocumentType | null
  document_state: UploadedDocumentState
  confidence_score: number | null
  issues: string[]
  ai_rationale: string | null
  created_at: string
  updated_at: string
}

export interface Escalation {
  id: string
  loan_id: string
  category: EscalationCategory
  severity: EscalationSeverity
  status: EscalationState
  owner: string | null
  resolution: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface EventLog {
  id: string
  loan_id: string | null
  event_type: EventType
  actor: string | null
  payload: Record<string, unknown>
  created_at: string
}

export interface NotificationMessage {
  id: string
  loan_id: string | null
  borrower_id: string | null
  channel: NotificationChannel
  message_type: string
  content: string
  status: 'pending' | 'sent' | 'failed'
  sent_at: string | null
  created_at: string
}

export interface ReviewDecision {
  id: string
  loan_id: string
  officer_id: string | null
  decision: ReviewDecisionType
  notes: string | null
  created_at: string
}

// ============================================================
// AI Agent Output Types
// ============================================================

export interface DocumentIntelligenceOutput {
  doc_type: DocumentType
  confidence_score: number
  issues: string[]
  rationale_summary: string
  extracted_fields: Record<string, string>
}

export interface OfficerCopilotSummary {
  loan_id: string
  overall_status: string
  unresolved_issues: string[]
  confidence_flags: string[]
  recommended_actions: string[]
  document_summaries: {
    doc_type: DocumentType
    state: DocumentRequirementState
    issues: string[]
  }[]
}

export interface BorrowerMessageOutput {
  message: string
  is_advisory_question: boolean
  escalation_required: boolean
  escalation_reason: string | null
}

// ============================================================
// Service Input/Output Types
// ============================================================

export interface CreateLoanInput {
  borrower_name: string
  borrower_email: string
  borrower_phone?: string
  loan_type: LoanType
  property_state?: string
  employment_type?: EmploymentType
  officer_id: string
}

export interface UploadDocumentInput {
  loan_id: string
  requirement_id?: string
  file_buffer: Buffer
  file_name: string
  file_size: number
  mime_type: string
}

export interface WorkflowTransitionResult {
  success: boolean
  new_state: LoanWorkflowState
  previous_state: LoanWorkflowState
  events_emitted: EventType[]
  error?: string
}

export interface ValidationResult {
  valid: boolean
  issues: string[]
  missing_fields: string[]
  warnings: string[]
}
