import { createServerSupabaseClient } from '@/src/db/supabase'
import { LoanRepository } from '@/src/db/repositories/loanRepository'
import { EscalationRepository } from '@/src/db/repositories/escalationRepository'
import { LoanTable } from '@/components/officer/LoanTable'
import { EscalationBanner } from '@/components/officer/EscalationBanner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Plus, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — MortgageAI',
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const loanRepo = new LoanRepository()
  const loans = await loanRepo.findByOfficer(user.id)

  const escalationRepo = new EscalationRepository()
  const openEscalationCount = await escalationRepo.countOpenByOfficer(user.id)

  const activeLoans = loans.filter((l) => l.workflow_state !== 'archived').length
  const reviewReadyLoans = loans.filter((l) =>
    ['awaiting_officer_review', 'review_ready'].includes(l.workflow_state)
  ).length

  const allOpenEscalations = loans.flatMap((l) =>
    ((l as { escalations?: { status: string; severity: string; id: string; category: string; loan_id: string }[] }).escalations ?? [])
      .filter((e) => ['open', 'acknowledged'].includes(e.status))
  )

  return (
    <div>
      <EscalationBanner escalations={allOpenEscalations} />

      <div className="pt-2">
        <PageHeader
          title="Loan Dashboard"
          subtitle="Manage your active mortgage files"
          actions={
            <Link href="/dashboard/loans/new">
              <Button size="md">
                <Plus className="w-4 h-4" />
                New Loan
              </Button>
            </Link>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeLoans}</p>
                <p className="text-sm text-slate-500">Active Loans</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{openEscalationCount}</p>
                <p className="text-sm text-slate-500">Open Escalations</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{reviewReadyLoans}</p>
                <p className="text-sm text-slate-500">Ready for Review</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Loan list */}
        <LoanTable loans={loans as Parameters<typeof LoanTable>[0]['loans']} />
      </div>
    </div>
  )
}
