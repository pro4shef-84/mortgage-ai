// ============================================================
// REVIEW SERVICE — officer review decisions
// ONLY officers can mark a loan review_ready
// ============================================================

import { createServiceRoleClient } from '../db/supabase'
import { WorkflowEngine } from '../workflow/workflowEngine'
import {
  LoanWorkflowState,
  ReviewDecisionType,
  DocumentRequirementState,
  EventType,
} from '../domain/enums'
import { EventRepository } from '../db/repositories/eventRepository'
import { logger } from '../lib/logger'

export interface ReviewSubmitResult {
  success: boolean
  new_loan_state?: LoanWorkflowState
  error?: string
}

export class ReviewService {
  private engine: WorkflowEngine
  private events: EventRepository

  constructor() {
    this.engine = new WorkflowEngine()
    this.events = new EventRepository()
  }

  async submitReview(params: {
    loanId: string
    officerId: string
    decision: ReviewDecisionType
    notes?: string
    requirementOverrides?: { requirementId: string; newState: DocumentRequirementState }[]
  }): Promise<ReviewSubmitResult> {
    const db = createServiceRoleClient()

    // Verify officer owns this loan
    const { data: loan } = await db
      .from('loans')
      .select('workflow_state, officer_id')
      .eq('id', params.loanId)
      .single()

    if (!loan) {
      return { success: false, error: 'Loan not found' }
    }

    if (loan.officer_id !== params.officerId) {
      return { success: false, error: 'Not authorized to review this loan' }
    }

    if (loan.workflow_state !== LoanWorkflowState.AwaitingOfficerReview) {
      return {
        success: false,
        error: `Loan must be in awaiting_officer_review state. Current state: ${loan.workflow_state}`,
      }
    }

    // Apply any requirement overrides
    if (params.requirementOverrides?.length) {
      for (const override of params.requirementOverrides) {
        await this.engine.transitionRequirement(
          override.requirementId,
          override.newState
        )
      }
    }

    // Record the review decision
    const { error: decisionError } = await db
      .from('review_decisions')
      .insert({
        loan_id: params.loanId,
        officer_id: params.officerId,
        decision: params.decision,
        notes: params.notes ?? null,
      })

    if (decisionError) {
      logger.error('Failed to record review decision', { error: decisionError })
      return { success: false, error: 'Failed to record decision' }
    }

    // Determine target loan state
    let targetState: LoanWorkflowState
    switch (params.decision) {
      case ReviewDecisionType.ReviewReady:
        // CRITICAL: Only the officer (never AI) can set this state
        targetState = LoanWorkflowState.ReviewReady
        break
      case ReviewDecisionType.NeedsCorrection:
        targetState = LoanWorkflowState.BorrowerCorrectionRequired
        break
      case ReviewDecisionType.Archived:
        targetState = LoanWorkflowState.Archived
        break
    }

    const transitionResult = await this.engine.transitionLoan(
      params.loanId,
      targetState,
      'officer',
      params.officerId
    )

    if (!transitionResult.success) {
      return { success: false, error: transitionResult.error }
    }

    await this.events.log({
      loan_id: params.loanId,
      event_type: EventType.OfficerReviewSubmitted,
      actor: params.officerId,
      payload: {
        decision: params.decision,
        notes: params.notes,
        new_state: targetState,
      },
    })

    logger.info('Officer review submitted', {
      loanId: params.loanId,
      officerId: params.officerId,
      decision: params.decision,
      newState: targetState,
    })

    return { success: true, new_loan_state: targetState }
  }

  async waiveRequirement(params: {
    requirementId: string
    officerId: string
    reason: string
  }): Promise<{ success: boolean; error?: string }> {
    const result = await this.engine.transitionRequirement(
      params.requirementId,
      DocumentRequirementState.WaivedByOfficer
    )

    if (!result.success) return result

    logger.info('Requirement waived by officer', {
      requirementId: params.requirementId,
      officerId: params.officerId,
    })

    return { success: true }
  }
}
