import { Badge } from '@/components/ui/Badge'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const STATE_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  loan_created: { label: 'Created', variant: 'info' },
  borrower_invited: { label: 'Invited', variant: 'info' },
  awaiting_borrower_documents: { label: 'Awaiting Docs', variant: 'warning' },
  documents_under_validation: { label: 'Validating', variant: 'info' },
  borrower_correction_required: { label: 'Correction Required', variant: 'warning' },
  borrower_unresponsive: { label: 'Unresponsive', variant: 'danger' },
  human_review_required: { label: 'Human Review', variant: 'danger' },
  officer_followup_required: { label: 'Follow-up Needed', variant: 'danger' },
  awaiting_officer_review: { label: 'Ready for Review', variant: 'success' },
  review_ready: { label: 'Review Ready', variant: 'success' },
  blocked: { label: 'Blocked', variant: 'danger' },
  archived: { label: 'Archived', variant: 'neutral' },
}

const REQUIREMENT_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  required: { label: 'Required', variant: 'warning' },
  awaiting_upload: { label: 'Awaiting Upload', variant: 'warning' },
  uploaded_pending_validation: { label: 'Validating...', variant: 'info' },
  tentatively_satisfied: { label: 'Accepted', variant: 'success' },
  correction_required: { label: 'Needs Correction', variant: 'danger' },
  needs_human_review: { label: 'Under Review', variant: 'danger' },
  waived_by_officer: { label: 'Waived', variant: 'neutral' },
  confirmed_by_officer: { label: 'Confirmed', variant: 'success' },
}

export function LoanStateBadge({ state }: { state: string }) {
  const cfg = STATE_CONFIG[state] ?? { label: state, variant: 'neutral' as BadgeVariant }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}

export function RequirementStateBadge({ state }: { state: string }) {
  const cfg = REQUIREMENT_CONFIG[state] ?? { label: state, variant: 'neutral' as BadgeVariant }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    info: { label: 'Info', variant: 'info' },
    warning: { label: 'Warning', variant: 'warning' },
    high: { label: 'High', variant: 'danger' },
    critical: { label: 'Critical', variant: 'danger' },
  }
  const cfg = config[severity] ?? { label: severity, variant: 'neutral' as BadgeVariant }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
