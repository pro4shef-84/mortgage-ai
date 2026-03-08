import { notFound } from 'next/navigation'
import { BorrowerRepository } from '@/src/db/repositories/borrowerRepository'
import { DocumentRepository } from '@/src/db/repositories/documentRepository'
import { UploadZone } from '@/components/borrower/UploadZone'
import { MessageCard } from '@/components/borrower/MessageCard'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { docTypeLabel } from '@/src/lib/utils'

export default async function UploadPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ requirement?: string }>
}) {
  const { token } = await params
  const { requirement: requirementId } = await searchParams

  if (!requirementId) notFound()

  const borrowerRepo = new BorrowerRepository()
  const portalData = await borrowerRepo.getLoanByPortalToken(token)
  if (!portalData) notFound()

  // Verify requirement belongs to this borrower's loan
  const docRepo = new DocumentRepository()
  const requirement = await docRepo.getRequirement(requirementId)
  if (!requirement) notFound()

  const loans = (portalData.loans ?? []) as { id: string }[]
  const loanIds = loans.map((l) => l.id)
  if (!loanIds.includes(requirement.loan_id)) notFound()

  const docLabel = docTypeLabel(requirement.doc_type)

  const DOC_INSTRUCTIONS: Record<string, string[]> = {
    pay_stub: [
      'Must be from within the last 60 days',
      'Must show your name, employer name, and year-to-date income',
      'PDF preferred — photos accepted if all text is legible',
    ],
    w2: [
      'Must be from the most recent tax year',
      'Upload the complete W-2, not a screenshot',
      'All four corners must be visible',
    ],
    bank_statement: [
      'Must include ALL pages — not just page 1',
      'Must be from the last 90 days',
      'Download the PDF from your bank — do not take a screenshot',
    ],
    government_id: [
      'Accepted: Driver\'s license, passport, state ID',
      'Must be valid and not expired',
      'Take a clear photo in good lighting',
    ],
    purchase_contract: [
      'Upload the signed purchase agreement',
      'All pages must be included',
      'Both buyer and seller signatures required',
    ],
  }

  const instructions = DOC_INSTRUCTIONS[requirement.doc_type] ?? []

  return (
    <div className="space-y-6">
      <Link
        href={`/portal/${token}`}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to checklist
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload {docLabel}</h1>
        <p className="text-slate-500 mt-1">
          {requirement.state === 'correction_required'
            ? 'Please upload a corrected version of this document.'
            : 'Upload a clear photo or PDF of this document.'}
        </p>
      </div>

      {instructions.length > 0 && (
        <MessageCard
          type="info"
          title="What to include"
          message={instructions.join('\n')}
        />
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <UploadZone
          requirementId={requirementId}
          portalToken={token}
          docTypeLabel={docLabel}
        />
      </div>

      <p className="text-xs text-slate-400 text-center">
        🔒 Your document is encrypted during upload and stored securely.
        Accepted formats: PDF, JPG, PNG, HEIC. Max size: 25MB.
      </p>
    </div>
  )
}
