// ============================================================
// WORKFLOW ENGINE — orchestrates all state machines
// Source of truth for state transitions, timers, escalations
// ============================================================

import { createServiceRoleClient } from '../db/supabase'
import {
  LoanWorkflowState,
  DocumentRequirementState,
  UploadedDocumentState,
  EscalationCategory,
  EscalationSeverity,
  EscalationState,
  EventType,
} from '../domain/enums'
import {
  allRequirementsSatisfied,
  anyRequirementNeedsCorrection,
  anyRequirementNeedsHumanReview,
} from '../domain/rules/workflowRules'
import { LoanStateMachine } from './loanStateMachine'
import { RequirementStateMachine } from './requirementStateMachine'
import { DocumentStateMachine } from './documentStateMachine'
import { logger } from '../lib/logger'
import type { SupabaseClient } from '@supabase/supabase-js'

export class WorkflowEngine {
  private db: SupabaseClient

  constructor(db?: SupabaseClient) {
    this.db = db ?? createServiceRoleClient()
  }

  // ── Log every event ─────────────────────────────────────
  private async logEvent(
    loanId: string,
    eventType: EventType,
    actor: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const { error } = await this.db.from('event_logs').insert({
      loan_id: loanId,
      event_type: eventType,
      actor,
      payload,
    })
    if (error) {
      logger.error('Failed to log workflow event', { loanId, eventType, error })
    }
  }

  // ── Transition loan state ────────────────────────────────
  async transitionLoan(
    loanId: string,
    to: LoanWorkflowState,
    actor: 'system' | 'officer' | 'borrower',
    actorId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const { data: loan, error: fetchError } = await this.db
      .from('loans')
      .select('workflow_state')
      .eq('id', loanId)
      .single()

    if (fetchError || !loan) {
      return { success: false, error: 'Loan not found' }
    }

    const machine = new LoanStateMachine(loan.workflow_state as LoanWorkflowState)
    const result = machine.transition(to, actor)

    if (!result.success) {
      logger.warn('Workflow transition rejected', { loanId, from: loan.workflow_state, to, actor, error: result.error })
      return { success: false, error: result.error }
    }

    const { error: updateError } = await this.db
      .from('loans')
      .update({ workflow_state: to, updated_at: new Date().toISOString() })
      .eq('id', loanId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    await this.logEvent(loanId, EventType.WorkflowTransition, actorId ?? actor, {
      from: result.previous_state,
      to: result.new_state,
      actor,
    })

    logger.info('Loan workflow transitioned', {
      loanId,
      from: result.previous_state,
      to,
      actor,
    })

    return { success: true }
  }

  // ── Handle document upload received ─────────────────────
  async onDocumentReceived(
    loanId: string,
    requirementId: string,
    documentId: string
  ): Promise<void> {
    // Update requirement state to pending validation
    await this.transitionRequirement(
      requirementId,
      DocumentRequirementState.UploadedPendingValidation
    )

    // Transition loan to validation state if not already there
    const { data: loan } = await this.db
      .from('loans')
      .select('workflow_state')
      .eq('id', loanId)
      .single()

    if (
      loan &&
      (loan.workflow_state === LoanWorkflowState.AwaitingBorrowerDocuments ||
        loan.workflow_state === LoanWorkflowState.BorrowerCorrectionRequired)
    ) {
      await this.transitionLoan(loanId, LoanWorkflowState.DocumentsUnderValidation, 'system')
    }

    await this.logEvent(loanId, EventType.DocumentUploaded, 'borrower', {
      document_id: documentId,
      requirement_id: requirementId,
    })
  }

  // ── Handle document validation result ───────────────────
  async onDocumentValidated(
    loanId: string,
    requirementId: string,
    documentId: string,
    validationPassed: boolean,
    needsHumanReview: boolean,
    issues: string[]
  ): Promise<void> {
    if (needsHumanReview) {
      await this.transitionRequirement(requirementId, DocumentRequirementState.NeedsHumanReview)
      await this.transitionDocument(documentId, UploadedDocumentState.NeedsHumanReview)
      await this.createEscalation(loanId, {
        category: EscalationCategory.LowConfidenceClassification,
        severity: EscalationSeverity.High,
      })
    } else if (validationPassed) {
      await this.transitionRequirement(requirementId, DocumentRequirementState.TentativelySatisfied)
      await this.transitionDocument(documentId, UploadedDocumentState.AcceptedTentatively)
    } else {
      await this.transitionRequirement(requirementId, DocumentRequirementState.CorrectionRequired)
      await this.transitionDocument(documentId, UploadedDocumentState.Rejected)
    }

    await this.logEvent(loanId, EventType.DocumentValidated, 'system', {
      document_id: documentId,
      requirement_id: requirementId,
      passed: validationPassed,
      needs_human_review: needsHumanReview,
      issues,
    })

    // Re-evaluate loan-level state
    await this.evaluateLoanState(loanId)
  }

  // ── Evaluate overall loan state after document changes ──
  async evaluateLoanState(loanId: string): Promise<void> {
    const { data: requirements } = await this.db
      .from('document_requirements')
      .select('state')
      .eq('loan_id', loanId)

    if (!requirements || requirements.length === 0) return

    const { data: loan } = await this.db
      .from('loans')
      .select('workflow_state')
      .eq('id', loanId)
      .single()

    if (!loan) return

    const states = requirements.map((r) => r.state as DocumentRequirementState)

    // Only re-evaluate if in validation states
    if (loan.workflow_state !== LoanWorkflowState.DocumentsUnderValidation) return

    if (anyRequirementNeedsHumanReview(states)) {
      await this.transitionLoan(loanId, LoanWorkflowState.HumanReviewRequired, 'system')
    } else if (anyRequirementNeedsCorrection(states)) {
      await this.transitionLoan(loanId, LoanWorkflowState.BorrowerCorrectionRequired, 'system')
    } else if (allRequirementsSatisfied(states)) {
      await this.transitionLoan(loanId, LoanWorkflowState.AwaitingOfficerReview, 'system')
    }
  }

  // ── Transition a requirement ─────────────────────────────
  async transitionRequirement(
    requirementId: string,
    to: DocumentRequirementState
  ): Promise<{ success: boolean; error?: string }> {
    const { data: req, error: fetchError } = await this.db
      .from('document_requirements')
      .select('state, loan_id')
      .eq('id', requirementId)
      .single()

    if (fetchError || !req) return { success: false, error: 'Requirement not found' }

    const machine = new RequirementStateMachine(req.state as DocumentRequirementState)
    const result = machine.transition(to)

    if (!result.success) return result

    const { error } = await this.db
      .from('document_requirements')
      .update({ state: to, updated_at: new Date().toISOString() })
      .eq('id', requirementId)

    if (error) return { success: false, error: error.message }

    await this.logEvent(req.loan_id, EventType.RequirementStateChanged, 'system', {
      requirement_id: requirementId,
      from: result.previous_state,
      to,
    })

    return { success: true }
  }

  // ── Transition a document ────────────────────────────────
  async transitionDocument(
    documentId: string,
    to: UploadedDocumentState
  ): Promise<{ success: boolean; error?: string }> {
    const { data: doc, error: fetchError } = await this.db
      .from('uploaded_documents')
      .select('document_state, loan_id')
      .eq('id', documentId)
      .single()

    if (fetchError || !doc) return { success: false, error: 'Document not found' }

    const machine = new DocumentStateMachine(doc.document_state as UploadedDocumentState)
    const result = machine.transition(to)

    if (!result.success) return result

    const { error } = await this.db
      .from('uploaded_documents')
      .update({ document_state: to, updated_at: new Date().toISOString() })
      .eq('id', documentId)

    if (error) return { success: false, error: error.message }

    await this.logEvent(doc.loan_id, EventType.DocumentStateChanged, 'system', {
      document_id: documentId,
      from: result.previous_state,
      to,
    })

    return { success: true }
  }

  // ── Create escalation ────────────────────────────────────
  async createEscalation(
    loanId: string,
    opts: {
      category: EscalationCategory
      severity: EscalationSeverity
      owner?: string
    }
  ): Promise<string | null> {
    const { data, error } = await this.db
      .from('escalations')
      .insert({
        loan_id: loanId,
        category: opts.category,
        severity: opts.severity,
        status: EscalationState.Open,
        owner: opts.owner ?? null,
      })
      .select('id')
      .single()

    if (error) {
      logger.error('Failed to create escalation', { loanId, error })
      return null
    }

    await this.logEvent(loanId, EventType.EscalationCreated, 'system', {
      escalation_id: data.id,
      category: opts.category,
      severity: opts.severity,
    })

    return data.id
  }

  // ── Resolve escalation ────────────────────────────────────
  async resolveEscalation(
    escalationId: string,
    resolution: string,
    officerId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { data: esc, error: fetchError } = await this.db
      .from('escalations')
      .select('loan_id, status')
      .eq('id', escalationId)
      .single()

    if (fetchError || !esc) return { success: false, error: 'Escalation not found' }

    const { error } = await this.db
      .from('escalations')
      .update({
        status: EscalationState.Resolved,
        resolution,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', escalationId)

    if (error) return { success: false, error: error.message }

    await this.logEvent(esc.loan_id, EventType.EscalationResolved, officerId, {
      escalation_id: escalationId,
      resolution,
    })

    return { success: true }
  }

  // ── Increment reminder count and check unresponsive ──────
  async trackReminder(loanId: string, reminderCount: number): Promise<void> {
    if (reminderCount >= 3) {
      const { data: loan } = await this.db
        .from('loans')
        .select('workflow_state')
        .eq('id', loanId)
        .single()

      if (
        loan &&
        (loan.workflow_state === LoanWorkflowState.AwaitingBorrowerDocuments ||
          loan.workflow_state === LoanWorkflowState.BorrowerCorrectionRequired)
      ) {
        await this.transitionLoan(loanId, LoanWorkflowState.BorrowerUnresponsive, 'system')
        await this.createEscalation(loanId, {
          category: EscalationCategory.BorrowerUnresponsive,
          severity: EscalationSeverity.High,
        })
      }
    }
  }
}
