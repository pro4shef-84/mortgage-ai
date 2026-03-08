// ============================================================
// POST /api/documents/upload — officer-side document upload
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/src/db/supabase'
import { LoanRepository } from '@/src/db/repositories/loanRepository'
import { DocumentPipeline } from '@/src/services/documentPipeline'
import { logger } from '@/src/lib/logger'

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const loanId = formData.get('loan_id') as string | null
  const requirementId = formData.get('requirement_id') as string | null

  if (!file || !loanId || !requirementId) {
    return NextResponse.json(
      { error: 'file, loan_id, and requirement_id are required' },
      { status: 400 }
    )
  }

  // Verify ownership
  const loanRepo = new LoanRepository()
  const loan = await loanRepo.findById(loanId)
  if (!loan || loan.officer_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const pipeline = new DocumentPipeline()
  const result = await pipeline.process({
    loanId,
    requirementId,
    fileBuffer,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    uploadedBy: user.id,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  logger.info('Document uploaded by officer', {
    officerId: user.id,
    loanId,
    documentId: result.document_id,
  })

  return NextResponse.json(result, { status: 201 })
}
