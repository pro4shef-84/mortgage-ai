'use client'

import { useState } from 'react'
import { LoanCard } from './LoanCard'

interface Loan {
  id: string
  loan_type: string
  workflow_state: string
  created_at: string
  updated_at: string
  borrower?: { full_name: string; email?: string | null } | null
  escalations?: { status: string; severity: string }[]
}

type Filter = 'all' | 'needs_attention' | 'review_ready' | 'archived'

interface LoanTableProps {
  loans: Loan[]
}

const ATTENTION_STATES = [
  'borrower_correction_required',
  'borrower_unresponsive',
  'human_review_required',
  'officer_followup_required',
  'blocked',
]

function urgencyScore(loan: Loan): number {
  const openEsc = (loan.escalations ?? []).filter((e) =>
    ['open', 'acknowledged'].includes(e.status)
  )
  const hasCritical = openEsc.some((e) => e.severity === 'critical')
  const hasHigh = openEsc.some((e) => e.severity === 'high')
  if (hasCritical) return 0
  if (hasHigh) return 1
  if (ATTENTION_STATES.includes(loan.workflow_state)) return 2
  if (loan.workflow_state === 'awaiting_officer_review') return 3
  return 10
}

export function LoanTable({ loans }: LoanTableProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = loans
    .filter((l) => {
      if (filter === 'needs_attention') return ATTENTION_STATES.includes(l.workflow_state)
      if (filter === 'review_ready') return l.workflow_state === 'awaiting_officer_review' || l.workflow_state === 'review_ready'
      if (filter === 'archived') return l.workflow_state === 'archived'
      return l.workflow_state !== 'archived'
    })
    .sort((a, b) => urgencyScore(a) - urgencyScore(b))

  const filters: { id: Filter; label: string; count?: number }[] = [
    { id: 'all', label: 'All Active', count: loans.filter((l) => l.workflow_state !== 'archived').length },
    { id: 'needs_attention', label: 'Needs Attention', count: loans.filter((l) => ATTENTION_STATES.includes(l.workflow_state)).length },
    { id: 'review_ready', label: 'Review Ready', count: loans.filter((l) => ['awaiting_officer_review', 'review_ready'].includes(l.workflow_state)).length },
    { id: 'archived', label: 'Archived', count: loans.filter((l) => l.workflow_state === 'archived').length },
  ]

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              filter === f.id
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {f.label}
            {f.count !== undefined && (
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                  filter === f.id ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loan list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg font-medium">No loans found</p>
          <p className="text-sm mt-1">Try a different filter or create a new loan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      )}
    </div>
  )
}
