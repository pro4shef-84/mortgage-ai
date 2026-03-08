// ============================================================
// DETERMINISTIC WORKFLOW TRANSITION RULES
// Defines which transitions are valid and under what conditions
// ============================================================

import {
  LoanWorkflowState,
  DocumentRequirementState,
  EscalationState,
} from '../enums'

export type TransitionActor = 'system' | 'officer' | 'borrower'

export interface TransitionRule {
  from: LoanWorkflowState
  to: LoanWorkflowState
  allowedActors: TransitionActor[]
  description: string
}

// Explicit allowed transitions — anything not listed is FORBIDDEN
export const ALLOWED_TRANSITIONS: TransitionRule[] = [
  // Officer creates loan
  {
    from: LoanWorkflowState.Draft,
    to: LoanWorkflowState.LoanCreated,
    allowedActors: ['officer'],
    description: 'Officer saves loan record',
  },
  // System sends borrower invite
  {
    from: LoanWorkflowState.LoanCreated,
    to: LoanWorkflowState.BorrowerInvited,
    allowedActors: ['system', 'officer'],
    description: 'Borrower invitation email sent',
  },
  // Borrower clicks portal link — starts checklist phase
  {
    from: LoanWorkflowState.BorrowerInvited,
    to: LoanWorkflowState.AwaitingBorrowerDocuments,
    allowedActors: ['system', 'borrower'],
    description: 'Borrower accessed portal for the first time',
  },
  // First document uploaded — starts validation phase
  {
    from: LoanWorkflowState.AwaitingBorrowerDocuments,
    to: LoanWorkflowState.DocumentsUnderValidation,
    allowedActors: ['system'],
    description: 'At least one document received, AI validation pipeline started',
  },
  // Correction needed: go back to borrower
  {
    from: LoanWorkflowState.DocumentsUnderValidation,
    to: LoanWorkflowState.BorrowerCorrectionRequired,
    allowedActors: ['system'],
    description: 'One or more documents failed validation — borrower must correct',
  },
  // Borrower re-uploads during correction phase
  {
    from: LoanWorkflowState.BorrowerCorrectionRequired,
    to: LoanWorkflowState.DocumentsUnderValidation,
    allowedActors: ['system', 'borrower'],
    description: 'Borrower uploaded replacement documents',
  },
  // All docs tentatively satisfied — ready for officer
  {
    from: LoanWorkflowState.DocumentsUnderValidation,
    to: LoanWorkflowState.AwaitingOfficerReview,
    allowedActors: ['system'],
    description: 'All document requirements tentatively satisfied',
  },
  // Human review required for suspicious docs, low confidence
  {
    from: LoanWorkflowState.DocumentsUnderValidation,
    to: LoanWorkflowState.HumanReviewRequired,
    allowedActors: ['system'],
    description: 'Suspicious or contradictory documents require human review',
  },
  // Officer resolves human review — either back to validation or officer review
  {
    from: LoanWorkflowState.HumanReviewRequired,
    to: LoanWorkflowState.DocumentsUnderValidation,
    allowedActors: ['officer'],
    description: 'Officer resolved human review — reprocessing documents',
  },
  {
    from: LoanWorkflowState.HumanReviewRequired,
    to: LoanWorkflowState.AwaitingOfficerReview,
    allowedActors: ['officer'],
    description: 'Officer resolved human review — proceeding to officer review',
  },
  {
    from: LoanWorkflowState.HumanReviewRequired,
    to: LoanWorkflowState.BorrowerCorrectionRequired,
    allowedActors: ['officer'],
    description: 'Officer determined borrower needs to re-upload',
  },
  // Borrower unresponsive after 3 reminders
  {
    from: LoanWorkflowState.AwaitingBorrowerDocuments,
    to: LoanWorkflowState.BorrowerUnresponsive,
    allowedActors: ['system'],
    description: 'Borrower did not respond after 3 reminder emails',
  },
  {
    from: LoanWorkflowState.BorrowerCorrectionRequired,
    to: LoanWorkflowState.BorrowerUnresponsive,
    allowedActors: ['system'],
    description: 'Borrower did not correct documents after 3 reminders',
  },
  // Officer follows up on unresponsive borrower
  {
    from: LoanWorkflowState.BorrowerUnresponsive,
    to: LoanWorkflowState.OfficerFollowupRequired,
    allowedActors: ['system'],
    description: 'Escalated to officer for direct borrower follow-up',
  },
  {
    from: LoanWorkflowState.OfficerFollowupRequired,
    to: LoanWorkflowState.AwaitingBorrowerDocuments,
    allowedActors: ['officer'],
    description: 'Officer re-engaged borrower successfully',
  },
  // ONLY the officer can set review_ready
  {
    from: LoanWorkflowState.AwaitingOfficerReview,
    to: LoanWorkflowState.ReviewReady,
    allowedActors: ['officer'],
    description: 'Officer approved — loan is review ready',
  },
  {
    from: LoanWorkflowState.AwaitingOfficerReview,
    to: LoanWorkflowState.BorrowerCorrectionRequired,
    allowedActors: ['officer'],
    description: 'Officer found issues — borrower must correct',
  },
  // Archiving
  {
    from: LoanWorkflowState.AwaitingOfficerReview,
    to: LoanWorkflowState.Archived,
    allowedActors: ['officer'],
    description: 'Officer archived the loan',
  },
  {
    from: LoanWorkflowState.ReviewReady,
    to: LoanWorkflowState.Archived,
    allowedActors: ['officer'],
    description: 'Officer archived a review-ready loan',
  },
  {
    from: LoanWorkflowState.BorrowerUnresponsive,
    to: LoanWorkflowState.Archived,
    allowedActors: ['officer'],
    description: 'Officer archived unresponsive loan',
  },
  // Block / unblock
  {
    from: LoanWorkflowState.DocumentsUnderValidation,
    to: LoanWorkflowState.Blocked,
    allowedActors: ['system', 'officer'],
    description: 'Loan blocked due to system error or compliance hold',
  },
  {
    from: LoanWorkflowState.Blocked,
    to: LoanWorkflowState.DocumentsUnderValidation,
    allowedActors: ['officer'],
    description: 'Officer unblocked loan — resuming validation',
  },
]

export function isTransitionAllowed(
  from: LoanWorkflowState,
  to: LoanWorkflowState,
  actor: TransitionActor
): boolean {
  return ALLOWED_TRANSITIONS.some(
    (rule) =>
      rule.from === from &&
      rule.to === to &&
      rule.allowedActors.includes(actor)
  )
}

export function getValidTransitions(
  from: LoanWorkflowState,
  actor: TransitionActor
): LoanWorkflowState[] {
  return ALLOWED_TRANSITIONS
    .filter((rule) => rule.from === from && rule.allowedActors.includes(actor))
    .map((rule) => rule.to)
}

// ── Requirement state transitions ───────────────────────────

export function canRequirementTransition(
  from: DocumentRequirementState,
  to: DocumentRequirementState
): boolean {
  const allowed: [DocumentRequirementState, DocumentRequirementState][] = [
    [DocumentRequirementState.Required, DocumentRequirementState.AwaitingUpload],
    [DocumentRequirementState.AwaitingUpload, DocumentRequirementState.UploadedPendingValidation],
    [DocumentRequirementState.UploadedPendingValidation, DocumentRequirementState.TentativelySatisfied],
    [DocumentRequirementState.UploadedPendingValidation, DocumentRequirementState.CorrectionRequired],
    [DocumentRequirementState.UploadedPendingValidation, DocumentRequirementState.NeedsHumanReview],
    [DocumentRequirementState.CorrectionRequired, DocumentRequirementState.UploadedPendingValidation],
    [DocumentRequirementState.NeedsHumanReview, DocumentRequirementState.TentativelySatisfied],
    [DocumentRequirementState.NeedsHumanReview, DocumentRequirementState.CorrectionRequired],
    [DocumentRequirementState.NeedsHumanReview, DocumentRequirementState.WaivedByOfficer],
    [DocumentRequirementState.TentativelySatisfied, DocumentRequirementState.ConfirmedByOfficer],
    [DocumentRequirementState.TentativelySatisfied, DocumentRequirementState.CorrectionRequired],
    [DocumentRequirementState.AwaitingUpload, DocumentRequirementState.WaivedByOfficer],
    [DocumentRequirementState.Required, DocumentRequirementState.WaivedByOfficer],
  ]
  return allowed.some(([f, t]) => f === from && t === to)
}

// ── Loan-level aggregation rules ─────────────────────────────

export function allRequirementsSatisfied(
  states: DocumentRequirementState[]
): boolean {
  return states.every((s) =>
    [
      DocumentRequirementState.TentativelySatisfied,
      DocumentRequirementState.ConfirmedByOfficer,
      DocumentRequirementState.WaivedByOfficer,
    ].includes(s)
  )
}

export function anyRequirementNeedsCorrection(
  states: DocumentRequirementState[]
): boolean {
  return states.some((s) => s === DocumentRequirementState.CorrectionRequired)
}

export function anyRequirementNeedsHumanReview(
  states: DocumentRequirementState[]
): boolean {
  return states.some((s) => s === DocumentRequirementState.NeedsHumanReview)
}

export function hasOpenEscalation(escalationStatuses: EscalationState[]): boolean {
  return escalationStatuses.some(
    (s) => s === EscalationState.Open || s === EscalationState.Acknowledged
  )
}
