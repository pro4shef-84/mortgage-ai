// ============================================================
// GET /api/portal/[token] — borrower portal data (service role)
// Borrowers authenticate via portal_token, NOT Supabase auth
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { BorrowerRepository } from '@/src/db/repositories/borrowerRepository'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token || token.length < 10) {
    return NextResponse.json({ error: 'Invalid portal token' }, { status: 400 })
  }

  const repo = new BorrowerRepository()
  const data = await repo.getLoanByPortalToken(token)

  if (!data) {
    return NextResponse.json({ error: 'Portal not found' }, { status: 404 })
  }

  // Return borrower + loan + requirements (no sensitive officer data)
  return NextResponse.json({
    borrower: {
      id: data.id,
      full_name: data.full_name,
      email: data.email,
    },
    loans: data.loans,
  })
}
