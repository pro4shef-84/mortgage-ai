// ============================================================
// GET /api/loans — list officer's loans
// POST /api/loans — create new loan
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/src/db/supabase'
import { LoanRepository } from '@/src/db/repositories/loanRepository'
import { IntakeAgent } from '@/src/agents/intakeAgent'
import { NotificationService } from '@/src/services/notificationService'
import { WorkflowEngine } from '@/src/workflow/workflowEngine'
import { LoanType, LoanWorkflowState } from '@/src/domain/enums'
import { logger } from '@/src/lib/logger'

const createLoanSchema = z.object({
  borrower_name: z.string().min(2, 'Borrower name must be at least 2 characters'),
  borrower_email: z.string().email('Invalid borrower email'),
  borrower_phone: z.string().optional(),
  loan_type: z.nativeEnum(LoanType),
  property_state: z.string().length(2, 'Property state must be 2-letter code').optional(),
})

export async function GET() {
  const { user, error } = await getAuthenticatedUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const repo = new LoanRepository()
  const loans = await repo.findByOfficer(user.id)

  return NextResponse.json({ loans })
}

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createLoanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.issues },
      { status: 422 }
    )
  }

  const data = parsed.data

  // Verify officer profile exists
  const { supabase } = await getAuthenticatedUser()
  const { data: officer } = await supabase
    .from('officers')
    .select('id, full_name')
    .eq('id', user.id)
    .single()

  if (!officer) {
    return NextResponse.json({ error: 'Officer profile not found' }, { status: 403 })
  }

  const repo = new LoanRepository()
  const loan = await repo.create({
    borrower_name: data.borrower_name,
    borrower_email: data.borrower_email,
    borrower_phone: data.borrower_phone,
    loan_type: data.loan_type,
    property_state: data.property_state,
    officer_id: user.id,
  })

  if (!loan) {
    return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 })
  }

  // Generate document checklist
  const intake = new IntakeAgent()
  await intake.generateChecklist({ loanId: loan.id, loanType: data.loan_type })

  // Transition to borrower_invited
  const engine = new WorkflowEngine()
  await engine.transitionLoan(loan.id, LoanWorkflowState.BorrowerInvited, 'officer', user.id)

  // Send borrower invite email
  if (loan.borrower?.email) {
    const notifs = new NotificationService()
    await notifs.sendBorrowerInvite({
      loanId: loan.id,
      borrowerId: loan.borrower.id,
      borrowerName: loan.borrower.full_name,
      borrowerEmail: loan.borrower.email,
      portalToken: loan.borrower.portal_token,
      officerName: officer.full_name,
    })
  }

  logger.info('Loan created', { loanId: loan.id, officerId: user.id })

  return NextResponse.json({ loan }, { status: 201 })
}
