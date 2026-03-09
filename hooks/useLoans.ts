'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Loan } from '@/src/domain/entities'

async function fetchLoans(): Promise<Loan[]> {
  const res = await fetch('/api/loans')
  if (!res.ok) throw new Error('Failed to fetch loans')
  const data = await res.json()
  return data.loans
}

async function fetchLoan(loanId: string) {
  const res = await fetch(`/api/loans/${loanId}`)
  if (!res.ok) throw new Error('Failed to fetch loan')
  const data = await res.json()
  return data.loan
}

async function createLoan(input: {
  borrower_name: string
  borrower_email: string
  borrower_phone?: string
  loan_type: string
  property_state?: string
}): Promise<Loan> {
  const res = await fetch('/api/loans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? 'Failed to create loan')
  }
  const data = await res.json()
  return data.loan
}

export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: fetchLoans,
  })
}

export function useLoan(loanId: string) {
  return useQuery({
    queryKey: ['loans', loanId],
    queryFn: () => fetchLoan(loanId),
    enabled: !!loanId,
  })
}

export function useCreateLoan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
    },
  })
}
