// ============================================================
// DOCUMENT REPOSITORY
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js'
import { createServiceRoleClient } from '../supabase'
import type { DocumentRequirement, UploadedDocument } from '../../domain/entities'
import { DocumentRequirementState, UploadedDocumentState } from '../../domain/enums'

export class DocumentRepository {
  private db: SupabaseClient

  constructor(db?: SupabaseClient) {
    this.db = db ?? createServiceRoleClient()
  }

  async getRequirements(loanId: string): Promise<DocumentRequirement[]> {
    const { data, error } = await this.db
      .from('document_requirements')
      .select(`
        *,
        uploaded_documents(*)
      `)
      .eq('loan_id', loanId)
      .order('created_at', { ascending: true })

    if (error || !data) return []
    return data as DocumentRequirement[]
  }

  async getRequirement(id: string): Promise<DocumentRequirement | null> {
    const { data, error } = await this.db
      .from('document_requirements')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as DocumentRequirement
  }

  async updateRequirementState(
    id: string,
    state: DocumentRequirementState
  ): Promise<boolean> {
    const { error } = await this.db
      .from('document_requirements')
      .update({ state, updated_at: new Date().toISOString() })
      .eq('id', id)
    return !error
  }

  async createUploadedDocument(params: {
    loan_id: string
    requirement_id: string | null
    storage_path: string
    file_name: string
    file_size: number | null
    mime_type: string | null
  }): Promise<UploadedDocument | null> {
    const { data, error } = await this.db
      .from('uploaded_documents')
      .insert({
        ...params,
        document_state: UploadedDocumentState.Received,
        issues: [],
      })
      .select()
      .single()

    if (error || !data) return null
    return data as UploadedDocument
  }

  async getUploadedDocument(id: string): Promise<UploadedDocument | null> {
    const { data, error } = await this.db
      .from('uploaded_documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as UploadedDocument
  }

  async updateDocument(
    id: string,
    updates: Partial<UploadedDocument>
  ): Promise<boolean> {
    const { error } = await this.db
      .from('uploaded_documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    return !error
  }

  async supersedePreviousDocuments(requirementId: string, exceptId: string): Promise<void> {
    await this.db
      .from('uploaded_documents')
      .update({
        document_state: UploadedDocumentState.Superseded,
        updated_at: new Date().toISOString(),
      })
      .eq('requirement_id', requirementId)
      .neq('id', exceptId)
      .in('document_state', [
        UploadedDocumentState.AcceptedTentatively,
        UploadedDocumentState.ValidatedOk,
        UploadedDocumentState.Rejected,
      ])
  }

  async getDocumentsByLoan(loanId: string): Promise<UploadedDocument[]> {
    const { data, error } = await this.db
      .from('uploaded_documents')
      .select('*')
      .eq('loan_id', loanId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as UploadedDocument[]
  }
}
