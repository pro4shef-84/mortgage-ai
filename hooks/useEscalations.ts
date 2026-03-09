'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Escalation } from '@/src/domain/entities'

async function fetchEscalations(loanId: string): Promise<Escalation[]> {
  const res = await fetch(`/api/loans/${loanId}/escalations`)
  if (!res.ok) throw new Error('Failed to fetch escalations')
  const data = await res.json()
  return data.escalations
}

async function resolveEscalation(params: {
  loanId: string
  escalation_id: string
  action: 'resolve' | 'dismiss'
  resolution?: string
}): Promise<{ success: boolean }> {
  const res = await fetch(`/api/loans/${params.loanId}/escalations`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      escalation_id: params.escalation_id,
      action: params.action,
      resolution: params.resolution,
    }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? 'Failed to update escalation')
  }
  return res.json()
}

export function useEscalations(loanId: string) {
  return useQuery({
    queryKey: ['escalations', loanId],
    queryFn: () => fetchEscalations(loanId),
    enabled: !!loanId,
  })
}

export function useResolveEscalation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resolveEscalation,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escalations', variables.loanId] })
      queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] })
      queryClient.invalidateQueries({ queryKey: ['loans'] })
    },
  })
}
