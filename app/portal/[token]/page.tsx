import { notFound } from 'next/navigation'
import { BorrowerRepository } from '@/src/db/repositories/borrowerRepository'
import { ChecklistItem } from '@/components/borrower/ChecklistItem'
import { ProgressBar } from '@/components/borrower/ProgressBar'
import { MessageCard } from '@/components/borrower/MessageCard'

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const borrowerRepo = new BorrowerRepository()
  const data = await borrowerRepo.getLoanByPortalToken(token)

  if (!data) notFound()

  const loans = (data.loans ?? []) as {
    id: string
    workflow_state: string
    loan_type: string
    document_requirements: {
      id: string
      doc_type: string
      state: string
      uploaded_documents?: { file_name: string; created_at: string }[]
    }[]
  }[]

  const loan = loans[0]
  const requirements = loan?.document_requirements ?? []

  const satisfiedStates = ['tentatively_satisfied', 'confirmed_by_officer', 'waived_by_officer']
  const completed = requirements.filter((r) => satisfiedStates.includes(r.state)).length
  const total = requirements.length

  const loanState = loan?.workflow_state ?? ''
  const hasCorrectionRequired = requirements.some((r) => r.state === 'correction_required')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hi {data.full_name.split(' ')[0]}, here&apos;s what we need from you
        </h1>
        <p className="text-slate-500 mt-1">
          Please upload the documents below so we can process your{' '}
          {loan?.loan_type?.replace(/_/g, ' ')} application.
        </p>
      </div>

      {hasCorrectionRequired && (
        <MessageCard
          type="warning"
          title="Action required"
          message="Some of your documents need to be re-uploaded. Please see the items marked below."
        />
      )}

      {loanState === 'awaiting_officer_review' && (
        <MessageCard
          type="success"
          title="All documents received!"
          message="We have everything we need. Our team is reviewing your file and will be in touch soon."
        />
      )}

      {loanState === 'review_ready' && (
        <MessageCard
          type="success"
          title="Your application is complete!"
          message="Your mortgage application has passed our review. Your loan officer will contact you with next steps."
        />
      )}

      {total > 0 && <ProgressBar completed={completed} total={total} />}

      <div className="space-y-3">
        {requirements.map((req) => (
          <ChecklistItem key={req.id} requirement={req} portalToken={token} />
        ))}
      </div>

      <div className="bg-slate-100 rounded-xl p-4 text-sm text-slate-600">
        <p className="font-medium mb-1">Questions?</p>
        <p>
          If you have questions about the documents needed or your application, please contact your
          loan officer directly. We cannot provide advice on loan approval or rates through this portal.
        </p>
      </div>
    </div>
  )
}
