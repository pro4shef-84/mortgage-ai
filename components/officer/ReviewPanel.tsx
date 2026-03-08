'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Archive } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'

interface ReviewPanelProps {
  loanId: string
  workflowState: string
  onReviewSubmitted?: () => void
}

export function ReviewPanel({ loanId, workflowState, onReviewSubmitted }: ReviewPanelProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const canReview = workflowState === 'awaiting_officer_review'

  async function submitReview(decision: 'review_ready' | 'needs_correction' | 'archived') {
    setLoading(decision)
    setResult(null)

    try {
      const res = await fetch(`/api/loans/${loanId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes: notes.trim() || undefined }),
      })

      const data = await res.json()
      if (data.success) {
        setResult({ success: true, message: 'Review submitted successfully.' })
        onReviewSubmitted?.()
      } else {
        setResult({ success: false, message: data.error ?? 'Failed to submit review.' })
      }
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setLoading(null)
    }
  }

  if (!canReview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Officer Review</CardTitle>
        </CardHeader>
        <p className="text-sm text-slate-500">
          Review panel is available when the loan is in &ldquo;Awaiting Officer Review&rdquo; state.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Officer Review</CardTitle>
      </CardHeader>

      {result && (
        <Alert variant={result.success ? 'success' : 'error'} className="mb-4">
          {result.message}
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="review_notes" className="text-sm font-medium text-slate-700 block mb-1">
            Review Notes (optional)
          </label>
          <textarea
            id="review_notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes for this review decision..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="success"
            onClick={() => submitReview('review_ready')}
            loading={loading === 'review_ready'}
            className="flex-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Review Ready
          </Button>
          <Button
            variant="outline"
            onClick={() => submitReview('needs_correction')}
            loading={loading === 'needs_correction'}
            className="flex-1"
          >
            <XCircle className="w-4 h-4" />
            Request Correction
          </Button>
          <Button
            variant="ghost"
            onClick={() => submitReview('archived')}
            loading={loading === 'archived'}
          >
            <Archive className="w-4 h-4" />
            Archive
          </Button>
        </div>
      </div>
    </Card>
  )
}
