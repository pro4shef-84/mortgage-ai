// ============================================================
// NOTIFICATION SERVICE — email via Resend
// ============================================================

import { Resend } from 'resend'
import { createServiceRoleClient } from '../db/supabase'
import { NotificationChannel } from '../domain/enums'
import { logger } from '../lib/logger'
import { config } from '../lib/config'
import { portalUrl } from '../lib/utils'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export class NotificationService {
  async sendBorrowerInvite(params: {
    loanId: string
    borrowerId: string
    borrowerName: string
    borrowerEmail: string
    portalToken: string
    officerName: string
  }): Promise<EmailResult> {
    const url = portalUrl(params.portalToken)
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #0F172A; font-size: 24px; margin-bottom: 8px;">Your Mortgage Document Portal</h1>
        <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
          Hi ${params.borrowerName},
        </p>
        <p style="color: #374151; font-size: 16px;">
          ${params.officerName} has opened a mortgage file for you and needs a few documents to get started.
        </p>
        <p style="color: #374151; font-size: 16px;">
          Click the button below to access your secure document portal and see exactly what we need from you.
        </p>
        <a href="${url}" style="display: inline-block; background-color: #F59E0B; color: #0F172A; font-weight: 600; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 24px 0; font-size: 16px;">
          View My Document Checklist →
        </a>
        <p style="color: #6B7280; font-size: 14px; margin-top: 32px; border-top: 1px solid #E5E7EB; padding-top: 16px;">
          This link is unique to you and secure. Do not share it. If you have questions, contact ${params.officerName} directly.
        </p>
      </div>
    `

    return this.sendEmail({
      loanId: params.loanId,
      borrowerId: params.borrowerId,
      to: params.borrowerEmail,
      subject: `${params.officerName} needs a few documents from you`,
      html,
      messageType: 'borrower_invite',
    })
  }

  async sendDocumentReminder(params: {
    loanId: string
    borrowerId: string
    borrowerName: string
    borrowerEmail: string
    portalToken: string
    pendingDocs: string[]
    reminderNumber: number
  }): Promise<EmailResult> {
    const url = portalUrl(params.portalToken)
    const docList = params.pendingDocs.map((d) => `<li style="margin-bottom: 8px;">${d}</li>`).join('')

    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #0F172A; font-size: 24px; margin-bottom: 8px;">We still need a few documents</h1>
        <p style="color: #374151; font-size: 16px;">
          Hi ${params.borrowerName}, we're still waiting on:
        </p>
        <ul style="color: #374151; font-size: 16px; line-height: 1.6; padding-left: 20px;">
          ${docList}
        </ul>
        <p style="color: #374151; font-size: 16px;">
          Your loan file can't move forward without these. It only takes a few minutes to upload.
        </p>
        <a href="${url}" style="display: inline-block; background-color: #F59E0B; color: #0F172A; font-weight: 600; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 24px 0; font-size: 16px;">
          Upload Documents Now →
        </a>
      </div>
    `

    return this.sendEmail({
      loanId: params.loanId,
      borrowerId: params.borrowerId,
      to: params.borrowerEmail,
      subject: `Reminder: Your mortgage application needs ${params.pendingDocs.length} document${params.pendingDocs.length > 1 ? 's' : ''}`,
      html,
      messageType: 'document_reminder',
    })
  }

  async sendCorrectionRequest(params: {
    loanId: string
    borrowerId: string
    borrowerName: string
    borrowerEmail: string
    portalToken: string
    issues: string[]
  }): Promise<EmailResult> {
    const url = portalUrl(params.portalToken)
    const issueList = params.issues.map((i) => `<li style="margin-bottom: 8px; color: #DC2626;">${i}</li>`).join('')

    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #0F172A; font-size: 24px; margin-bottom: 8px;">We need you to re-upload some documents</h1>
        <p style="color: #374151; font-size: 16px;">Hi ${params.borrowerName},</p>
        <p style="color: #374151; font-size: 16px;">
          We reviewed your documents and found a few issues that need to be corrected:
        </p>
        <ul style="font-size: 16px; line-height: 1.6; padding-left: 20px;">
          ${issueList}
        </ul>
        <p style="color: #374151; font-size: 16px;">
          Please log in to your portal to upload corrected versions.
        </p>
        <a href="${url}" style="display: inline-block; background-color: #F59E0B; color: #0F172A; font-weight: 600; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 24px 0; font-size: 16px;">
          Fix My Documents →
        </a>
      </div>
    `

    return this.sendEmail({
      loanId: params.loanId,
      borrowerId: params.borrowerId,
      to: params.borrowerEmail,
      subject: 'Action required: Please re-upload some documents',
      html,
      messageType: 'correction_request',
    })
  }

  private async sendEmail(params: {
    loanId: string
    borrowerId: string
    to: string
    subject: string
    html: string
    messageType: string
  }): Promise<EmailResult> {
    const db = createServiceRoleClient()

    // Record notification as pending
    const { data: notif } = await db
      .from('notification_messages')
      .insert({
        loan_id: params.loanId,
        borrower_id: params.borrowerId,
        channel: NotificationChannel.Email,
        message_type: params.messageType,
        content: params.subject,
        status: 'pending',
      })
      .select('id')
      .single()

    try {
      const resend = getResend()
      const { data, error } = await resend.emails.send({
        from: `${config.email.fromName} <${config.email.from}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      })

      if (error || !data) {
        logger.error('Resend email failed', { error, to: params.to })

        if (notif) {
          await db
            .from('notification_messages')
            .update({ status: 'failed' })
            .eq('id', notif.id)
        }

        return { success: false, error: error?.message ?? 'Email send failed' }
      }

      if (notif) {
        await db
          .from('notification_messages')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', notif.id)
      }

      logger.info('Email sent', { to: params.to, type: params.messageType, id: data.id })
      return { success: true, messageId: data.id }
    } catch (error) {
      logger.error('Email service error', { error })
      return { success: false, error: 'Email service unavailable' }
    }
  }
}
