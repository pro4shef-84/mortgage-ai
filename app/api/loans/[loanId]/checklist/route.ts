// ============================================================
// GET /api/loans/[loanId]/checklist
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/src/db/supabase'
import { DocumentRepository } from '@/src/db/repositories/documentRepository'
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

  const loanRepo = new LoanRepository()
  const loan = await loanRepo.findById(loanId)
  if (!loan || loan.officer_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const docRepo = new DocumentRepository()
  const requirements = await docRepo.getRequirements(loanId)

  return NextResponse.json({ requirements })
}
