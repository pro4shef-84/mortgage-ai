// ============================================================
// BORROWER CONCIERGE AGENT
// Handles borrower messages — NEVER answers advisory questions
// ============================================================

import { generateBorrowerResponse } from '../ai/anthropicAdapter'
import { borrowerConciergePrompt } from '../ai/promptTemplates'
import {
  EscalationCategory,
  EscalationSeverity,
} from '../domain/enums'
import { createServiceRoleClient } from '../db/supabase'
import { WorkflowEngine } from '../workflow/workflowEngine'
import { logger } from '../lib/logger'
import type { BorrowerMessageOutput } from '../ai/schemas'

export interface ConciergeResponse {
  message: string
  escalation_created: boolean
  escalation_id: string | null
}

export class BorrowerConciergeAgent {
  private engine: WorkflowEngine

  constructor() {
    this.engine = new WorkflowEngine()
  }

  async respond(params: {
    loanId: string
    borrowerName: string
    borrowerMessage: string
    loanState: string
    pendingDocTypes: string[]
  }): Promise<ConciergeResponse> {
    const db = createServiceRoleClient()

    try {
      const prompt = borrowerConciergePrompt({
        borrowerName: params.borrowerName,
        loanState: params.loanState,
        pendingDocs: params.pendingDocTypes,
        borrowerMessage: params.borrowerMessage,
      })

      let aiResult: BorrowerMessageOutput
      try {
        aiResult = await generateBorrowerResponse(prompt)
      } catch (error) {
        logger.error('Borrower concierge AI call failed', { loanId: params.loanId, error })
        return {
          message:
            "I'm sorry, I'm having trouble processing your message right now. Please try again later or contact your loan officer directly.",
          escalation_created: false,
          escalation_id: null,
        }
      }

      // Detect frustration signals
      const frustrationKeywords = [
        'frustrated', 'angry', 'ridiculous', 'impossible', 'terrible',
        'this is stupid', "can't believe", 'awful', 'disgusted',
      ]
      const isFrustrated = frustrationKeywords.some((kw) =>
        params.borrowerMessage.toLowerCase().includes(kw)
      )

      let escalationId: string | null = null

      if (aiResult.escalation_required || isFrustrated) {
        const category = aiResult.is_advisory_question
          ? EscalationCategory.BorrowerAdvisoryQuestion
          : EscalationCategory.BorrowerFrustrationSignal

        escalationId = await this.engine.createEscalation(params.loanId, {
          category,
          severity: aiResult.is_advisory_question
            ? EscalationSeverity.Warning
            : EscalationSeverity.Info,
        })

        // Log the message for officer context
        await db.from('event_logs').insert({
          loan_id: params.loanId,
          event_type: 'borrower_message',
          actor: 'borrower',
          payload: {
            message: params.borrowerMessage,
            escalation_id: escalationId,
            is_advisory_question: aiResult.is_advisory_question,
            escalation_reason: aiResult.escalation_reason,
          },
        })
      }

      return {
        message: aiResult.message,
        escalation_created: escalationId !== null,
        escalation_id: escalationId,
      }
    } catch (error) {
      logger.error('Borrower concierge error', { loanId: params.loanId, error })
      return {
        message:
          "I'm having trouble responding right now. Your loan officer will be in touch shortly.",
        escalation_created: false,
        escalation_id: null,
      }
    }
  }
}
