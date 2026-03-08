'use client'

import { FileText, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { RequirementStateBadge } from './StatusBadge'
import { docTypeLabel, timeAgo } from '@/src/lib/utils'

interface Requirement {
  id: string
  doc_type: string
  state: string
  updated_at: string
  uploaded_documents?: {
    id: string
    file_name: string
    document_state: string
    confidence_score: number | null
    issues: string[]
    created_at: string
  }[]
}

interface DocumentChecklistProps {
  requirements: Requirement[]
}

function StateIcon({ state }: { state: string }) {
  switch (state) {
    case 'tentatively_satisfied':
    case 'confirmed_by_officer':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    case 'correction_required':
    case 'needs_human_review':
      return <AlertCircle className="w-5 h-5 text-red-500" />
    case 'uploaded_pending_validation':
      return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
    case 'waived_by_officer':
      return <XCircle className="w-5 h-5 text-slate-400" />
    default:
      return <FileText className="w-5 h-5 text-slate-400" />
  }
}

export function DocumentChecklist({ requirements }: DocumentChecklistProps) {
  const completed = requirements.filter((r) =>
    ['tentatively_satisfied', 'confirmed_by_officer', 'waived_by_officer'].includes(r.state)
  ).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Checklist</CardTitle>
        <span className="text-sm text-slate-500">
          {completed}/{requirements.length} satisfied
        </span>
      </CardHeader>

      <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
        <div
          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
          style={{ width: requirements.length ? `${(completed / requirements.length) * 100}%` : '0%' }}
        />
      </div>

      <div className="space-y-3">
        {requirements.map((req) => {
          const latestDoc = req.uploaded_documents?.[0]
          const issues: string[] = latestDoc?.issues ?? []

          return (
            <div
              key={req.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
            >
              <StateIcon state={req.state} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-900 text-sm">
                    {docTypeLabel(req.doc_type)}
                  </span>
                  <RequirementStateBadge state={req.state} />
                </div>

                {latestDoc && (
                  <p className="text-xs text-slate-500 mt-1">
                    {latestDoc.file_name} · {timeAgo(latestDoc.created_at)}
                    {latestDoc.confidence_score !== null && (
                      <span className="ml-2">
                        · {(latestDoc.confidence_score * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </p>
                )}

                {issues.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {issues.map((issue, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-start gap-1">
                        <span className="mt-0.5">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
