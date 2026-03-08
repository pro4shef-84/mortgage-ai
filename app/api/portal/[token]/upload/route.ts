// ============================================================
// POST /api/portal/[token]/upload — borrower file upload
// Uses service role (no auth session) — token is the auth
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { BorrowerRepository } from '@/src/db/repositories/borrowerRepository'
import { DocumentPipeline } from '@/src/services/documentPipeline'
import { logger } from '@/src/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Validate portal token and get borrower
  const borrowerRepo = new BorrowerRepository()
  const portalData = await borrowerRepo.getLoanByPortalToken(token)

  if (!portalData) {
    return NextResponse.json({ error: 'Invalid portal token' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const requirementId = formData.get('requirement_id') as string | null

  if (!file || !requirementId) {
    return NextResponse.json(
      { error: 'file and requirement_id are required' },
      { status: 400 }
    )
  }

  // Find the loan associated with this borrower
  const loans = (portalData.loans as { id: string; document_requirements: { id: string }[] }[]) ?? []
  const loan = loans[0]
  if (!loan) {
    return NextResponse.json({ error: 'No active loan found' }, { status: 404 })
  }

  // Verify requirement belongs to this loan
  const reqBelongsToLoan = loan.document_requirements.some(
    (r) => r.id === requirementId
  )
  if (!reqBelongsToLoan) {
    return NextResponse.json({ error: 'Invalid requirement' }, { status: 403 })
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const pipeline = new DocumentPipeline()
  const result = await pipeline.process({
    loanId: loan.id,
    requirementId,
    fileBuffer,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    uploadedBy: `borrower:${portalData.id}`,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  logger.info('Document uploaded by borrower', {
    borrowerId: portalData.id,
    loanId: loan.id,
    documentId: result.document_id,
  })

  return NextResponse.json({
    success: true,
    document_id: result.document_id,
    validation_issues: result.validation_issues,
    needs_human_review: result.needs_human_review,
  }, { status: 201 })
}
