// ============================================================
// POST /api/loans/[loanId]/review — officer review submission
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/src/db/supabase'
import { LoanRepository } from '@/src/db/repositories/loanRepository'
import { ReviewService } from '@/src/services/reviewService'
import { ReviewDecisionType } from '@/src/domain/enums'

const reviewSchema = z.object({
  decision: z.nativeEnum(ReviewDecisionType),
  notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ loanId: string }> }
) {
  const { loanId } = await params
  const { user, error } = await getAuthenticatedUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loanRepo = new LoanRepository()
  const loan = await loanRepo.findById(loanId)
  if (!loan) {
    return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
  }
  if (loan.officer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.issues },
      { status: 422 }
    )
  }

  const service = new ReviewService()
  const result = await service.submitReview({
    loanId,
    officerId: user.id,
    decision: parsed.data.decision,
    notes: parsed.data.notes,
  })

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
