// ============================================================
// REMINDER SERVICE — idempotent reminder scheduling
// ============================================================

import { createServiceRoleClient } from '../db/supabase'
import { EventRepository } from '../db/repositories/eventRepository'
import { NotificationService } from './notificationService'
import { WorkflowEngine } from '../workflow/workflowEngine'
import { EventType } from '../domain/enums'
import { docTypeLabel } from '../lib/utils'
import { config } from '../lib/config'
import { logger } from '../lib/logger'

const REMINDER_INTERVAL_MS = config.reminders.intervalDays * 24 * 60 * 60 * 1000
const MAX_REMINDERS = config.reminders.maxBeforeUnresponsive

export class ReminderService {
  private events: EventRepository
  private notifications: NotificationService
  private engine: WorkflowEngine

  constructor() {
    this.events = new EventRepository()
    this.notifications = new NotificationService()
    this.engine = new WorkflowEngine()
  }

  async sendRemindersForAllPendingLoans(): Promise<void> {
    const db = createServiceRoleClient()

    const { data: pendingLoans, error } = await db
      .from('loans')
      .select(`
        id,
        workflow_state,
        borrower:borrowers(id, full_name, email, portal_token),
        document_requirements(doc_type, state)
      `)
      .in('workflow_state', [
        'awaiting_borrower_documents',
        'borrower_correction_required',
      ])

    if (error || !pendingLoans) {
      logger.error('Failed to fetch pending loans for reminders', { error })
      return
    }

    for (const loan of pendingLoans) {
      await this.processSingleLoan({
        id: loan.id,
        workflow_state: loan.workflow_state,
        borrower: Array.isArray(loan.borrower) ? loan.borrower[0] ?? null : loan.borrower,
        document_requirements: loan.document_requirements ?? [],
      })
    }
  }

  private async processSingleLoan(loan: {
    id: string
    workflow_state: string
    borrower: { id: string; full_name: string; email: string | null; portal_token: string } | null
    document_requirements: { doc_type: string; state: string }[]
  }): Promise<void> {
    const borrower = loan.borrower
    if (!borrower?.email) {
      logger.warn('Loan borrower missing email — skipping reminder', { loanId: loan.id })
      return
    }

    // Check idempotency — don't send if sent recently
    const lastSent = await this.events.getLastReminderSent(loan.id)
    if (lastSent) {
      const elapsed = Date.now() - new Date(lastSent).getTime()
      if (elapsed < REMINDER_INTERVAL_MS) {
        logger.debug('Reminder skipped — sent recently', {
          loanId: loan.id,
          hoursAgo: Math.floor(elapsed / 3600000),
        })
        return
      }
    }

    // Count total reminders
    const reminderCount = await this.events.countRemindersSent(loan.id)

    if (reminderCount >= MAX_REMINDERS) {
      // Trigger unresponsive workflow
      await this.engine.trackReminder(loan.id, reminderCount + 1)
      return
    }

    // Determine pending docs
    const pendingStates = [
      'required',
      'awaiting_upload',
      'correction_required',
    ]
    const pendingDocs = loan.document_requirements
      .filter((r) => pendingStates.includes(r.state))
      .map((r) => docTypeLabel(r.doc_type))

    if (pendingDocs.length === 0) return

    // Send reminder
    const result = await this.notifications.sendDocumentReminder({
      loanId: loan.id,
      borrowerId: borrower.id,
      borrowerName: borrower.full_name,
      borrowerEmail: borrower.email,
      portalToken: borrower.portal_token,
      pendingDocs,
      reminderNumber: reminderCount + 1,
    })

    if (result.success) {
      // Log the event
      await this.events.log({
        loan_id: loan.id,
        event_type: EventType.ReminderSent,
        actor: 'system',
        payload: {
          reminder_number: reminderCount + 1,
          pending_docs: pendingDocs,
          email_id: result.messageId,
        },
      })

      // Check if we've now hit the max
      await this.engine.trackReminder(loan.id, reminderCount + 1)
    }
  }
}
