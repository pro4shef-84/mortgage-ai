// ============================================================
// ESCALATION SERVICE
// ============================================================

import { EscalationRepository } from '../db/repositories/escalationRepository'
import { WorkflowEngine } from '../workflow/workflowEngine'
import { EscalationCategory, EscalationSeverity, EscalationState } from '../domain/enums'
import { logger } from '../lib/logger'
import type { Escalation } from '../domain/entities'

export class EscalationService {
  private repo: EscalationRepository
  private engine: WorkflowEngine

  constructor() {
    this.repo = new EscalationRepository()
    this.engine = new WorkflowEngine()
  }

  async getOpenEscalations(loanId: string): Promise<Escalation[]> {
    return this.repo.findOpenByLoan(loanId)
  }

  async getAllEscalations(loanId: string): Promise<Escalation[]> {
    return this.repo.findByLoan(loanId)
  }

  async resolve(params: {
    escalationId: string
    officerId: string
    resolution: string
  }): Promise<{ success: boolean; error?: string }> {
    const escalation = await this.repo.findById(params.escalationId)
    if (!escalation) {
      return { success: false, error: 'Escalation not found' }
    }

    if (escalation.status === EscalationState.Resolved || escalation.status === EscalationState.Dismissed) {
      return { success: false, error: 'Escalation is already resolved' }
    }

    const result = await this.engine.resolveEscalation(
      params.escalationId,
      params.resolution,
      params.officerId
    )

    return result
  }

  async dismiss(params: {
    escalationId: string
    officerId: string
  }): Promise<{ success: boolean; error?: string }> {
    const success = await this.repo.dismiss(params.escalationId)
    if (!success) return { success: false, error: 'Failed to dismiss escalation' }

    logger.info('Escalation dismissed', {
      escalationId: params.escalationId,
      officerId: params.officerId,
    })

    return { success: true }
  }

  async create(params: {
    loanId: string
    category: EscalationCategory
    severity: EscalationSeverity
    owner?: string
  }): Promise<string | null> {
    return this.engine.createEscalation(params.loanId, {
      category: params.category,
      severity: params.severity,
      owner: params.owner,
    })
  }
}
