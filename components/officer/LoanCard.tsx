import Link from 'next/link'
import { AlertTriangle, ChevronRight, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { LoanStateBadge } from './StatusBadge'
import { timeAgo, shortId } from '@/src/lib/utils'

interface LoanCardProps {
  loan: {
    id: string
    loan_type: string
    workflow_state: string
    created_at: string
    updated_at: string
    borrower?: { full_name: string; email?: string | null } | null
    escalations?: { status: string; severity: string }[]
  }
}

export function LoanCard({ loan }: LoanCardProps) {
  const openEscalations = (loan.escalations ?? []).filter((e) =>
    ['open', 'acknowledged'].includes(e.status)
  )
  const hasCritical = openEscalations.some((e) => e.severity === 'critical')
  const hasHigh = openEscalations.some((e) => e.severity === 'high')

  return (
    <Link href={`/dashboard/loans/${loan.id}`}>
      <Card
        className={`hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group ${
          hasCritical
            ? 'border-red-300 bg-red-50/30'
            : hasHigh
            ? 'border-orange-300'
            : ''
        }`}
        padding="md"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900 truncate">
                {loan.borrower?.full_name ?? 'Unknown Borrower'}
              </span>
              {openEscalations.length > 0 && (
                <AlertTriangle
                  className={`w-4 h-4 flex-shrink-0 ${
                    hasCritical ? 'text-red-500' : 'text-amber-500'
                  }`}
                />
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                #{shortId(loan.id)}
              </span>
              <span className="capitalize">{loan.loan_type.replace(/_/g, ' ')}</span>
              {openEscalations.length > 0 && (
                <span className="text-red-600 font-medium">
                  {openEscalations.length} escalation{openEscalations.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <LoanStateBadge state={loan.workflow_state} />
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                {timeAgo(loan.updated_at)}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
        </div>
      </Card>
    </Link>
  )
}
