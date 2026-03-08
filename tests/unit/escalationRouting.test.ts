import { describe, it, expect } from 'vitest'
import {
  allRequirementsSatisfied,
  anyRequirementNeedsCorrection,
  anyRequirementNeedsHumanReview,
  hasOpenEscalation,
} from '../../src/domain/rules/workflowRules'
import { DocumentRequirementState, EscalationState } from '../../src/domain/enums'

describe('Workflow Aggregation Rules', () => {
  it('returns true when all requirements are satisfied', () => {
    const states = [
      DocumentRequirementState.TentativelySatisfied,
      DocumentRequirementState.ConfirmedByOfficer,
      DocumentRequirementState.WaivedByOfficer,
    ]
    expect(allRequirementsSatisfied(states)).toBe(true)
  })

  it('returns false when one requirement is pending', () => {
    const states = [
      DocumentRequirementState.TentativelySatisfied,
      DocumentRequirementState.CorrectionRequired,
    ]
    expect(allRequirementsSatisfied(states)).toBe(false)
  })

  it('detects correction required', () => {
    const states = [
      DocumentRequirementState.TentativelySatisfied,
      DocumentRequirementState.CorrectionRequired,
    ]
    expect(anyRequirementNeedsCorrection(states)).toBe(true)
  })

  it('detects human review required', () => {
    const states = [
      DocumentRequirementState.TentativelySatisfied,
      DocumentRequirementState.NeedsHumanReview,
    ]
    expect(anyRequirementNeedsHumanReview(states)).toBe(true)
  })

  it('returns false for correction when none needed', () => {
    const states = [
      DocumentRequirementState.TentativelySatisfied,
      DocumentRequirementState.ConfirmedByOfficer,
    ]
    expect(anyRequirementNeedsCorrection(states)).toBe(false)
  })

  it('detects open escalations', () => {
    const statuses = [EscalationState.Open, EscalationState.Resolved]
    expect(hasOpenEscalation(statuses)).toBe(true)
  })

  it('returns false when all escalations resolved', () => {
    const statuses = [EscalationState.Resolved, EscalationState.Dismissed]
    expect(hasOpenEscalation(statuses)).toBe(false)
  })
})
