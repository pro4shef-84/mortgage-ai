// ============================================================
// GET /api/loans/[loanId] — loan detail
// PATCH /api/loans/[loanId] — update loan
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/src/db/supabase'
import { LoanRepository } from '@/src/db/repositories/loanRepository'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ loanId: string }> }
) {
  const { loanId } = await params
  const { user, error } = await getAuthenticatedUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const repo = new LoanRepository()
  const loan = await repo.getLoanWithFullContext(loanId)

  if (!loan) {
    return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
  }

  if (loan.officer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ loan })
}
