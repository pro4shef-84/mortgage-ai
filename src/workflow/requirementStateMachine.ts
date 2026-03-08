// ============================================================
// DOCUMENT REQUIREMENT STATE MACHINE
// ============================================================

import { DocumentRequirementState } from '../domain/enums'
import { canRequirementTransition } from '../domain/rules/workflowRules'

export interface RequirementTransitionResult {
  success: boolean
  previous_state: DocumentRequirementState
  new_state: DocumentRequirementState
  error?: string
}

export class RequirementStateMachine {
  private state: DocumentRequirementState

  constructor(initialState: DocumentRequirementState = DocumentRequirementState.Required) {
    this.state = initialState
  }

  get currentState(): DocumentRequirementState {
    return this.state
  }

  transition(to: DocumentRequirementState): RequirementTransitionResult {
    const previous = this.state

    if (!canRequirementTransition(this.state, to)) {
      return {
        success: false,
        previous_state: previous,
        new_state: this.state,
        error: `Requirement transition from '${this.state}' to '${to}' is not allowed.`,
      }
    }

    this.state = to
    return {
      success: true,
      previous_state: previous,
      new_state: this.state,
    }
  }

  isSatisfied(): boolean {
    return (
      this.state === DocumentRequirementState.TentativelySatisfied ||
      this.state === DocumentRequirementState.ConfirmedByOfficer ||
      this.state === DocumentRequirementState.WaivedByOfficer
    )
  }

  needsAction(): boolean {
    return (
      this.state === DocumentRequirementState.Required ||
      this.state === DocumentRequirementState.AwaitingUpload ||
      this.state === DocumentRequirementState.CorrectionRequired
    )
  }

  isInReview(): boolean {
    return (
      this.state === DocumentRequirementState.UploadedPendingValidation ||
      this.state === DocumentRequirementState.NeedsHumanReview
    )
  }
}
