import { describe, it, expect } from 'vitest'
import { LoanStateMachine } from '../../src/workflow/loanStateMachine'
import { RequirementStateMachine } from '../../src/workflow/requirementStateMachine'
import { DocumentStateMachine } from '../../src/workflow/documentStateMachine'
import { EscalationStateMachine } from '../../src/workflow/escalationStateMachine'
import {
  LoanWorkflowState,
  DocumentRequirementState,
  UploadedDocumentState,
  EscalationState,
} from '../../src/domain/enums'

describe('LoanStateMachine', () => {
  it('starts in draft state', () => {
    const sm = new LoanStateMachine()
    expect(sm.currentState).toBe(LoanWorkflowState.Draft)
  })

  it('allows officer to transition draft → loan_created', () => {
    const sm = new LoanStateMachine()
    const result = sm.transition(LoanWorkflowState.LoanCreated, 'officer')
    expect(result.success).toBe(true)
    expect(sm.currentState).toBe(LoanWorkflowState.LoanCreated)
  })

  it('rejects system transition from draft → review_ready (skipped states)', () => {
    const sm = new LoanStateMachine()
    const result = sm.transition(LoanWorkflowState.ReviewReady, 'system')
    expect(result.success).toBe(false)
    expect(sm.currentState).toBe(LoanWorkflowState.Draft)
  })

  it('only allows officer to set review_ready', () => {
    const sm = new LoanStateMachine(LoanWorkflowState.AwaitingOfficerReview)
    const systemResult = sm.transition(LoanWorkflowState.ReviewReady, 'system')
    expect(systemResult.success).toBe(false)

    const officerResult = sm.transition(LoanWorkflowState.ReviewReady, 'officer')
    expect(officerResult.success).toBe(true)
    expect(sm.currentState).toBe(LoanWorkflowState.ReviewReady)
  })

  it('borrower cannot set review_ready', () => {
    const sm = new LoanStateMachine(LoanWorkflowState.AwaitingOfficerReview)
    const result = sm.transition(LoanWorkflowState.ReviewReady, 'borrower')
    expect(result.success).toBe(false)
  })

  it('follows full happy path', () => {
    const sm = new LoanStateMachine()
    expect(sm.transition(LoanWorkflowState.LoanCreated, 'officer').success).toBe(true)
    expect(sm.transition(LoanWorkflowState.BorrowerInvited, 'system').success).toBe(true)
    expect(sm.transition(LoanWorkflowState.AwaitingBorrowerDocuments, 'system').success).toBe(true)
    expect(sm.transition(LoanWorkflowState.DocumentsUnderValidation, 'system').success).toBe(true)
    expect(sm.transition(LoanWorkflowState.AwaitingOfficerReview, 'system').success).toBe(true)
    expect(sm.transition(LoanWorkflowState.ReviewReady, 'officer').success).toBe(true)
    expect(sm.currentState).toBe(LoanWorkflowState.ReviewReady)
  })

  it('reports terminal state correctly', () => {
    const sm = new LoanStateMachine(LoanWorkflowState.ReviewReady)
    expect(sm.isTerminal()).toBe(true)
    const archived = new LoanStateMachine(LoanWorkflowState.Archived)
    expect(archived.isTerminal()).toBe(true)
    const active = new LoanStateMachine(LoanWorkflowState.AwaitingBorrowerDocuments)
    expect(active.isTerminal()).toBe(false)
  })

  it('correctly identifies borrower action states', () => {
    const awaiting = new LoanStateMachine(LoanWorkflowState.AwaitingBorrowerDocuments)
    expect(awaiting.requiresBorrowerAction()).toBe(true)
    const correction = new LoanStateMachine(LoanWorkflowState.BorrowerCorrectionRequired)
    expect(correction.requiresBorrowerAction()).toBe(true)
    const review = new LoanStateMachine(LoanWorkflowState.AwaitingOfficerReview)
    expect(review.requiresBorrowerAction()).toBe(false)
  })
})

describe('RequirementStateMachine', () => {
  it('starts in required state', () => {
    const sm = new RequirementStateMachine()
    expect(sm.currentState).toBe(DocumentRequirementState.Required)
  })

  it('allows required → awaiting_upload', () => {
    const sm = new RequirementStateMachine()
    const result = sm.transition(DocumentRequirementState.AwaitingUpload)
    expect(result.success).toBe(true)
  })

  it('rejects invalid transitions', () => {
    const sm = new RequirementStateMachine()
    const result = sm.transition(DocumentRequirementState.ConfirmedByOfficer)
    expect(result.success).toBe(false)
  })

  it('correctly identifies satisfied state', () => {
    const satisfied = new RequirementStateMachine(DocumentRequirementState.TentativelySatisfied)
    expect(satisfied.isSatisfied()).toBe(true)
    const confirmed = new RequirementStateMachine(DocumentRequirementState.ConfirmedByOfficer)
    expect(confirmed.isSatisfied()).toBe(true)
    const pending = new RequirementStateMachine(DocumentRequirementState.UploadedPendingValidation)
    expect(pending.isSatisfied()).toBe(false)
  })
})

describe('DocumentStateMachine', () => {
  it('starts in received state', () => {
    const sm = new DocumentStateMachine()
    expect(sm.currentState).toBe(UploadedDocumentState.Received)
  })

  it('follows processing pipeline', () => {
    const sm = new DocumentStateMachine()
    expect(sm.transition(UploadedDocumentState.Processing).success).toBe(true)
    expect(sm.transition(UploadedDocumentState.Classified).success).toBe(true)
    expect(sm.transition(UploadedDocumentState.ValidatedOk).success).toBe(true)
    expect(sm.transition(UploadedDocumentState.AcceptedTentatively).success).toBe(true)
    expect(sm.isAccepted()).toBe(true)
  })

  it('handles rejection path', () => {
    const sm = new DocumentStateMachine(UploadedDocumentState.ValidatedIssuFound)
    expect(sm.transition(UploadedDocumentState.Rejected).success).toBe(true)
    expect(sm.isTerminal()).toBe(true)
  })

  it('rejects invalid transitions', () => {
    const sm = new DocumentStateMachine()
    const result = sm.transition(UploadedDocumentState.AcceptedTentatively)
    expect(result.success).toBe(false)
  })
})

describe('EscalationStateMachine', () => {
  it('starts open', () => {
    const sm = new EscalationStateMachine()
    expect(sm.currentState).toBe(EscalationState.Open)
    expect(sm.isActive()).toBe(true)
  })

  it('can be acknowledged then resolved', () => {
    const sm = new EscalationStateMachine()
    expect(sm.transition(EscalationState.Acknowledged).success).toBe(true)
    expect(sm.transition(EscalationState.Resolved).success).toBe(true)
    expect(sm.isResolved()).toBe(true)
  })

  it('can be dismissed directly', () => {
    const sm = new EscalationStateMachine()
    expect(sm.transition(EscalationState.Dismissed).success).toBe(true)
    expect(sm.isResolved()).toBe(true)
  })

  it('cannot go from resolved back to open', () => {
    const sm = new EscalationStateMachine(EscalationState.Resolved)
    const result = sm.transition(EscalationState.Open)
    expect(result.success).toBe(false)
  })
})
