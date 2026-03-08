'use client'

import { AlertTriangle } from 'lucide-react'

interface Escalation {
  id: string
  category: string
  severity: string
  loan_id: string
}

interface EscalationBannerProps {
  escalations: Escalation[]
}

const CATEGORY_LABELS: Record<string, string> = {
  low_confidence_classification: 'Low confidence document classification',
  borrower_advisory_question: 'Borrower asked advisory question',
  repeated_failed_upload: 'Repeated upload failures',
  borrower_unresponsive: 'Borrower is unresponsive',
  name_mismatch: 'Name mismatch detected',
  contradictory_data: 'Contradictory data found',
  suspicious_document: 'Suspicious document flagged',
  unsupported_scenario: 'Unsupported scenario',
  system_processing_failure: 'System processing error',
  borrower_frustration_signal: 'Borrower frustration signal',
}

export function EscalationBanner({ escalations }: EscalationBannerProps) {
  if (escalations.length === 0) return null

  const critical = escalations.filter((e) => e.severity === 'critical')
  const items = critical.length > 0 ? critical : escalations.slice(0, 3)

  return (
    <div className="bg-red-600 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <span className="font-semibold">
            {escalations.length} active escalation{escalations.length > 1 ? 's' : ''} require your attention
          </span>
          {items.length > 0 && (
            <span className="text-red-100 text-sm ml-2">
              — {items.map((e) => CATEGORY_LABELS[e.category] ?? e.category).join(', ')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
