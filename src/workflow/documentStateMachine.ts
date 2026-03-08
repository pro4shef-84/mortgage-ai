// ============================================================
// UPLOADED DOCUMENT STATE MACHINE
// ============================================================

import { UploadedDocumentState } from '../domain/enums'

type DocTransition = [UploadedDocumentState, UploadedDocumentState]

const ALLOWED_DOC_TRANSITIONS: DocTransition[] = [
  [UploadedDocumentState.Received, UploadedDocumentState.PrecheckFailed],
  [UploadedDocumentState.Received, UploadedDocumentState.Processing],
  [UploadedDocumentState.Processing, UploadedDocumentState.Classified],
  [UploadedDocumentState.Processing, UploadedDocumentState.NeedsHumanReview],
  [UploadedDocumentState.Classified, UploadedDocumentState.ValidatedOk],
  [UploadedDocumentState.Classified, UploadedDocumentState.ValidatedIssuFound],
  [UploadedDocumentState.Classified, UploadedDocumentState.NeedsHumanReview],
  [UploadedDocumentState.ValidatedOk, UploadedDocumentState.AcceptedTentatively],
  [UploadedDocumentState.ValidatedOk, UploadedDocumentState.Superseded],
  [UploadedDocumentState.ValidatedIssuFound, UploadedDocumentState.Rejected],
  [UploadedDocumentState.ValidatedIssuFound, UploadedDocumentState.NeedsHumanReview],
  [UploadedDocumentState.ValidatedIssuFound, UploadedDocumentState.Superseded],
  [UploadedDocumentState.AcceptedTentatively, UploadedDocumentState.Superseded],
  [UploadedDocumentState.NeedsHumanReview, UploadedDocumentState.AcceptedTentatively],
  [UploadedDocumentState.NeedsHumanReview, UploadedDocumentState.Rejected],
  [UploadedDocumentState.NeedsHumanReview, UploadedDocumentState.Superseded],
  [UploadedDocumentState.Rejected, UploadedDocumentState.Superseded],
]

export interface DocumentTransitionResult {
  success: boolean
  previous_state: UploadedDocumentState
  new_state: UploadedDocumentState
  error?: string
}

export class DocumentStateMachine {
  private state: UploadedDocumentState

  constructor(initialState: UploadedDocumentState = UploadedDocumentState.Received) {
    this.state = initialState
  }

  get currentState(): UploadedDocumentState {
    return this.state
  }

  transition(to: UploadedDocumentState): DocumentTransitionResult {
    const previous = this.state
    const allowed = ALLOWED_DOC_TRANSITIONS.some(([f, t]) => f === this.state && t === to)

    if (!allowed) {
      return {
        success: false,
        previous_state: previous,
        new_state: this.state,
        error: `Document transition from '${this.state}' to '${to}' is not allowed.`,
      }
    }

    this.state = to
    return { success: true, previous_state: previous, new_state: this.state }
  }

  isTerminal(): boolean {
    return (
      this.state === UploadedDocumentState.Rejected ||
      this.state === UploadedDocumentState.Superseded ||
      this.state === UploadedDocumentState.PrecheckFailed
    )
  }

  isAccepted(): boolean {
    return this.state === UploadedDocumentState.AcceptedTentatively
  }

  requiresHumanReview(): boolean {
    return this.state === UploadedDocumentState.NeedsHumanReview
  }
}
