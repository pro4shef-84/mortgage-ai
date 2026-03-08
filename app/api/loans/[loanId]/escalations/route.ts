// ============================================================
// GET /api/loans/[loanId]/escalations
// PATCH /api/loans/[loanId]/escalations — resolve/dismiss
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/src/db/supabase'
import { LoanRepository } from '@/src/db/repositories/loanRepository'
import { EscalationService } from '@/src/services/escalationService'

const resolveSchema = z.object({
  escalation_id: z.string().uuid(),
  action: z.enum(['resolve', 'dismiss']),
  resolution: z.string().optional(),
})

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

  const service = new EscalationService()
  const escalations = await service.getAllEscalations(loanId)

  return NextResponse.json({ escalations })
}

export async function PATCH(
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
  if (!loan || loan.officer_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = resolveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.issues }, { status: 422 })
  }

  const service = new EscalationService()

  if (parsed.data.action === 'resolve') {
    const result = await service.resolve({
      escalationId: parsed.data.escalation_id,
      officerId: user.id,
      resolution: parsed.data.resolution ?? 'Resolved by officer',
    })
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } else {
    const result = await service.dismiss({
      escalationId: parsed.data.escalation_id,
      officerId: user.id,
    })
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  }
}
