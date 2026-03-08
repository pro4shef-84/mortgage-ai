// ============================================================
// LOAN STATE MACHINE
// Deterministic transitions for loan workflow state
// ============================================================

import { LoanWorkflowState } from '../domain/enums'
import {
  isTransitionAllowed,
  getValidTransitions,
  TransitionActor,
} from '../domain/rules/workflowRules'

export interface LoanStateMachineResult {
  success: boolean
  previous_state: LoanWorkflowState
  new_state: LoanWorkflowState
  error?: string
}

export class LoanStateMachine {
  private state: LoanWorkflowState

  constructor(initialState: LoanWorkflowState = LoanWorkflowState.Draft) {
    this.state = initialState
  }

  get currentState(): LoanWorkflowState {
    return this.state
  }

  transition(
    to: LoanWorkflowState,
    actor: TransitionActor
  ): LoanStateMachineResult {
    const previous = this.state

    if (!isTransitionAllowed(this.state, to, actor)) {
      return {
        success: false,
        previous_state: previous,
        new_state: this.state,
        error: `Transition from '${this.state}' to '${to}' by actor '${actor}' is not allowed.`,
      }
    }

    this.state = to
    return {
      success: true,
      previous_state: previous,
      new_state: this.state,
    }
  }

  canTransitionTo(to: LoanWorkflowState, actor: TransitionActor): boolean {
    return isTransitionAllowed(this.state, to, actor)
  }

  getAvailableTransitions(actor: TransitionActor): LoanWorkflowState[] {
    return getValidTransitions(this.state, actor)
  }

  isTerminal(): boolean {
    return (
      this.state === LoanWorkflowState.Archived ||
      this.state === LoanWorkflowState.ReviewReady
    )
  }

  requiresBorrowerAction(): boolean {
    return (
      this.state === LoanWorkflowState.AwaitingBorrowerDocuments ||
      this.state === LoanWorkflowState.BorrowerCorrectionRequired
    )
  }

  requiresOfficerAction(): boolean {
    return (
      this.state === LoanWorkflowState.AwaitingOfficerReview ||
      this.state === LoanWorkflowState.HumanReviewRequired ||
      this.state === LoanWorkflowState.OfficerFollowupRequired
    )
  }

  requiresSystemAction(): boolean {
    return (
      this.state === LoanWorkflowState.DocumentsUnderValidation ||
      this.state === LoanWorkflowState.BorrowerUnresponsive
    )
  }
}
