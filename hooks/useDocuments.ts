'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DocumentRequirement } from '@/src/domain/entities'

async function fetchChecklist(loanId: string): Promise<DocumentRequirement[]> {
  const res = await fetch(`/api/loans/${loanId}/checklist`)
  if (!res.ok) throw new Error('Failed to fetch checklist')
  const data = await res.json()
  return data.requirements
}

async function uploadDocument(params: {
  loanId: string
  requirementId: string
  file: File
}): Promise<{ success: boolean; document_id: string; validation_issues: string[] }> {
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append('loan_id', params.loanId)
  formData.append('requirement_id', params.requirementId)

  const res = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? 'Upload failed')
  }
  return res.json()
}

export function useChecklist(loanId: string) {
  return useQuery({
    queryKey: ['checklist', loanId],
    queryFn: () => fetchChecklist(loanId),
    enabled: !!loanId,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checklist', variables.loanId] })
      queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] })
    },
  })
}
