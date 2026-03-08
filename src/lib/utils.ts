// ============================================================
// UTILITY FUNCTIONS
// ============================================================

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind class merging
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Date formatting
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr))
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// File helpers
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isAllowedMimeType(mimeType: string): boolean {
  const allowed = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
  ]
  return allowed.includes(mimeType)
}

// Human-readable document type labels
export function docTypeLabel(docType: string): string {
  const labels: Record<string, string> = {
    pay_stub: 'Pay Stub',
    w2: 'W-2 Form',
    bank_statement: 'Bank Statement',
    government_id: 'Government ID',
    purchase_contract: 'Purchase Contract',
    unknown_document: 'Unknown Document',
  }
  return labels[docType] ?? docType
}

// Human-readable state labels
export function loanStateLabel(state: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    loan_created: 'Loan Created',
    borrower_invited: 'Borrower Invited',
    awaiting_borrower_documents: 'Awaiting Documents',
    documents_under_validation: 'Validating Documents',
    borrower_correction_required: 'Correction Required',
    borrower_unresponsive: 'Borrower Unresponsive',
    human_review_required: 'Human Review Required',
    officer_followup_required: 'Officer Follow-up Required',
    awaiting_officer_review: 'Ready for Review',
    review_ready: 'Review Ready',
    blocked: 'Blocked',
    archived: 'Archived',
  }
  return labels[state] ?? state
}

export function requirementStateLabel(state: string): string {
  const labels: Record<string, string> = {
    required: 'Required',
    awaiting_upload: 'Awaiting Upload',
    uploaded_pending_validation: 'Validating...',
    tentatively_satisfied: 'Accepted',
    correction_required: 'Needs Correction',
    needs_human_review: 'Under Review',
    waived_by_officer: 'Waived',
    confirmed_by_officer: 'Confirmed',
  }
  return labels[state] ?? state
}

// Generate a short ID for display
export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

// Portal URL
export function portalUrl(token: string, baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/portal/${token}`
}
