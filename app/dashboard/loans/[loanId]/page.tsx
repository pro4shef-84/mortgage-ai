import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/db/supabase'
import { LoanRepository } from '@/src/db/repositories/loanRepository'
import { OfficerCopilotAgent } from '@/src/agents/officerCopilotAgent'
import { DocumentChecklist } from '@/components/officer/DocumentChecklist'
import { ReviewPanel } from '@/components/officer/ReviewPanel'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoanStateBadge, SeverityBadge } from '@/components/officer/StatusBadge'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatDate, shortId } from '@/src/lib/utils'
import { ArrowLeft, User, AlertTriangle, Activity } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Loan Detail — MortgageAI' }

const CATEGORY_LABELS: Record<string, string> = {
  low_confidence_classification: 'Low confidence classification',
  borrower_advisory_question: 'Borrower advisory question',
  repeated_failed_upload: 'Repeated upload failures',
  borrower_unresponsive: 'Borrower unresponsive',
  name_mismatch: 'Name mismatch',
  contradictory_data: 'Contradictory data',
  suspicious_document: 'Suspicious document',
  unsupported_scenario: 'Unsupported scenario',
  system_processing_failure: 'System processing failure',
  borrower_frustration_signal: 'Borrower frustration',
}

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ loanId: string }>
}) {
  const { loanId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const loanRepo = new LoanRepository()
  const loan = await loanRepo.getLoanWithFullContext(loanId)

  if (!loan) notFound()
  if (loan.officer_id !== user.id) notFound()

  // Generate AI copilot summary
  const copilot = new OfficerCopilotAgent()
  const summary = await copilot.generateSummary(loanId).catch(() => null)

  const borrower = loan.borrower as { full_name: string; email: string | null; phone: string | null } | null
  const requirements = (loan.document_requirements ?? []) as Parameters<typeof DocumentChecklist>[0]['requirements']
  const escalations = (loan.escalations ?? []) as { id: string; category: string; severity: string; status: string; created_at: string }[]
  const events = (loan.event_logs ?? []).slice(0, 10) as { id: string; event_type: string; actor: string | null; created_at: string }[]

  const openEscalations = escalations.filter((e) => ['open', 'acknowledged'].includes(e.status))

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={`Loan #${shortId(loanId)}`}
          subtitle={`${loan.loan_type?.replace(/_/g, ' ')} · Created ${formatDate(loan.created_at)}`}
          actions={<LoanStateBadge state={loan.workflow_state} />}
          className="mb-0 flex-1"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Borrower card */}
          <Card>
            <CardHeader>
              <CardTitle>Borrower</CardTitle>
              <Link href={`/portal/${(loan as { borrower?: { portal_token?: string } }).borrower?.portal_token ?? ''}`} className="text-sm text-amber-600 hover:underline">
                View Portal →
              </Link>
            </CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{borrower?.full_name}</p>
                <p className="text-sm text-slate-500">{borrower?.email}</p>
                {borrower?.phone && <p className="text-sm text-slate-500">{borrower.phone}</p>}
              </div>
            </div>
          </Card>

          {/* Document checklist */}
          <DocumentChecklist requirements={requirements} />

          {/* AI Copilot Summary */}
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle>AI Review Summary</CardTitle>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Powered by Claude</span>
              </CardHeader>
              <p className="text-sm text-slate-700 mb-4">{summary.overall_status}</p>

              {summary.unresolved_issues.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Unresolved Issues</p>
                  <ul className="space-y-1">
                    {summary.unresolved_issues.map((issue, i) => (
                      <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.recommended_actions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recommended Actions</p>
                  <ul className="space-y-1">
                    {summary.recommended_actions.map((action, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="mt-1">→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Review panel */}
          <ReviewPanel loanId={loanId} workflowState={loan.workflow_state} />

          {/* Escalations */}
          {escalations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Escalations</CardTitle>
                {openEscalations.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    {openEscalations.length} open
                  </span>
                )}
              </CardHeader>
              <div className="space-y-3">
                {escalations.slice(0, 5).map((esc) => (
                  <div key={esc.id} className="flex items-start gap-2">
                    <SeverityBadge severity={esc.severity} />
                    <div>
                      <p className="text-sm text-slate-700">{CATEGORY_LABELS[esc.category] ?? esc.category}</p>
                      <p className="text-xs text-slate-400">{formatDate(esc.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Event log */}
          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Activity
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-2 text-xs">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="text-slate-700">{event.event_type.replace(/_/g, ' ')}</span>
                      {event.actor && <span className="text-slate-400 ml-1">by {event.actor.slice(0, 12)}</span>}
                      <p className="text-slate-400">{formatDate(event.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
