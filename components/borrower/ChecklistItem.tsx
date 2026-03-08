'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ChevronRight,
  XCircle,
} from 'lucide-react'
import { docTypeLabel, requirementStateLabel } from '@/src/lib/utils'
import { Button } from '@/components/ui/Button'

interface ChecklistItemProps {
  requirement: {
    id: string
    doc_type: string
    state: string
    uploaded_documents?: { file_name: string; created_at: string }[]
  }
  portalToken: string
}

function StateIcon({ state }: { state: string }) {
  switch (state) {
    case 'tentatively_satisfied':
    case 'confirmed_by_officer':
      return <CheckCircle2 className="w-6 h-6 text-emerald-500" />
    case 'correction_required':
      return <XCircle className="w-6 h-6 text-red-500" />
    case 'needs_human_review':
      return <Clock className="w-6 h-6 text-amber-500" />
    case 'uploaded_pending_validation':
      return <Clock className="w-6 h-6 text-blue-500 animate-pulse" />
    case 'waived_by_officer':
      return <CheckCircle2 className="w-6 h-6 text-slate-400" />
    default:
      return <FileText className="w-6 h-6 text-slate-400" />
  }
}

const stateColors: Record<string, string> = {
  tentatively_satisfied: 'bg-emerald-50 border-emerald-200',
  confirmed_by_officer: 'bg-emerald-50 border-emerald-200',
  correction_required: 'bg-red-50 border-red-200',
  needs_human_review: 'bg-amber-50 border-amber-200',
  uploaded_pending_validation: 'bg-blue-50 border-blue-200',
  default: 'bg-white border-slate-200',
}

export function ChecklistItem({ requirement, portalToken }: ChecklistItemProps) {
  const isSatisfied = ['tentatively_satisfied', 'confirmed_by_officer', 'waived_by_officer'].includes(
    requirement.state
  )
  const needsUpload = ['required', 'awaiting_upload', 'correction_required'].includes(requirement.state)
  const latestDoc = requirement.uploaded_documents?.[0]

  const colorClass = stateColors[requirement.state] ?? stateColors.default

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${colorClass} transition-colors`}>
      <StateIcon state={requirement.state} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900">{docTypeLabel(requirement.doc_type)}</p>
        <p className="text-sm text-slate-500">
          {requirement.state === 'correction_required'
            ? 'Please re-upload — see correction notes'
            : requirementStateLabel(requirement.state)}
        </p>
        {latestDoc && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            Uploaded: {latestDoc.file_name}
          </p>
        )}
      </div>

      {needsUpload && (
        <Link href={`/portal/${portalToken}/upload?requirement=${requirement.id}`}>
          <Button size="md" variant="primary" className="flex-shrink-0 min-w-[100px]">
            {requirement.state === 'correction_required' ? 'Re-upload' : 'Upload'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      )}

      {isSatisfied && (
        <span className="text-emerald-600 font-medium text-sm flex-shrink-0">Done</span>
      )}
    </div>
  )
}
