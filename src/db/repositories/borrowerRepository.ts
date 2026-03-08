// ============================================================
// BORROWER REPOSITORY
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js'
import { createServiceRoleClient } from '../supabase'
import type { Borrower } from '../../domain/entities'

export class BorrowerRepository {
  private db: SupabaseClient

  constructor(db?: SupabaseClient) {
    this.db = db ?? createServiceRoleClient()
  }

  async findById(id: string): Promise<Borrower | null> {
    const { data, error } = await this.db
      .from('borrowers')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as Borrower
  }

  async findByPortalToken(token: string): Promise<Borrower | null> {
    const { data, error } = await this.db
      .from('borrowers')
      .select('*')
      .eq('portal_token', token)
      .single()

    if (error || !data) return null
    return data as Borrower
  }

  async findByEmail(email: string): Promise<Borrower | null> {
    const { data, error } = await this.db
      .from('borrowers')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) return null
    return data as Borrower
  }

  // Get loan associated with this portal token
  async getLoanByPortalToken(token: string) {
    const { data, error } = await this.db
      .from('borrowers')
      .select(`
        *,
        loans(
          *,
          document_requirements(
            *,
            uploaded_documents(*)
          )
        )
      `)
      .eq('portal_token', token)
      .single()

    if (error || !data) return null
    return data
  }
}
