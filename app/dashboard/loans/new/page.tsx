'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export default function NewLoanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    borrower_name: '',
    borrower_email: '',
    borrower_phone: '',
    loan_type: 'conventional_purchase',
    property_state: '',
  })

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrower_name: form.borrower_name,
          borrower_email: form.borrower_email,
          borrower_phone: form.borrower_phone || undefined,
          loan_type: form.loan_type,
          property_state: form.property_state || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to create loan')
        return
      }

      router.push(`/dashboard/loans/${data.loan.id}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Loan" subtitle="Create a mortgage file and invite the borrower" />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Borrower Info</legend>
            <Input
              label="Full Name"
              placeholder="Jane Smith"
              required
              value={form.borrower_name}
              onChange={(e) => handleChange('borrower_name', e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="jane@example.com"
              required
              value={form.borrower_email}
              onChange={(e) => handleChange('borrower_email', e.target.value)}
              hint="A portal invitation will be sent here."
            />
            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="(555) 000-0000"
              value={form.borrower_phone}
              onChange={(e) => handleChange('borrower_phone', e.target.value)}
            />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Loan Details</legend>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Loan Type</label>
              <select
                value={form.loan_type}
                onChange={(e) => handleChange('loan_type', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="conventional_purchase">Conventional Purchase</option>
                <option value="conventional_refinance">Conventional Refinance</option>
              </select>
            </div>
            <Input
              label="Property State (optional)"
              placeholder="CA"
              maxLength={2}
              value={form.property_state}
              onChange={(e) => handleChange('property_state', e.target.value.toUpperCase())}
            />
          </fieldset>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">
              Create Loan & Send Invite
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
