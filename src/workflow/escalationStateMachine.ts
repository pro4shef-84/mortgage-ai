// ============================================================
// ESCALATION STATE MACHINE
// ============================================================

import { EscalationState } from '../domain/enums'

type EscTransition = [EscalationState, EscalationState]

const ALLOWED_ESCALATION_TRANSITIONS: EscTransition[] = [
  [EscalationState.Open, EscalationState.Acknowledged],
  [EscalationState.Open, EscalationState.Resolved],
  [EscalationState.Open, EscalationState.Dismissed],
  [EscalationState.Acknowledged, EscalationState.Resolved],
  [EscalationState.Acknowledged, EscalationState.Dismissed],
]

export interface EscalationTransitionResult {
  success: boolean
  previous_state: EscalationState
  new_state: EscalationState
  error?: string
}

export class EscalationStateMachine {
  private state: EscalationState

  constructor(initialState: EscalationState = EscalationState.Open) {
    this.state = initialState
  }

  get currentState(): EscalationState {
    return this.state
  }

  transition(to: EscalationState): EscalationTransitionResult {
    const previous = this.state
    const allowed = ALLOWED_ESCALATION_TRANSITIONS.some(
      ([f, t]) => f === this.state && t === to
    )

    if (!allowed) {
      return {
        success: false,
        previous_state: previous,
        new_state: this.state,
        error: `Escalation transition from '${this.state}' to '${to}' is not allowed.`,
      }
    }

    this.state = to
    return { success: true, previous_state: previous, new_state: this.state }
  }

  isResolved(): boolean {
    return (
      this.state === EscalationState.Resolved ||
      this.state === EscalationState.Dismissed
    )
  }

  isActive(): boolean {
    return (
      this.state === EscalationState.Open ||
      this.state === EscalationState.Acknowledged
    )
  }
}
