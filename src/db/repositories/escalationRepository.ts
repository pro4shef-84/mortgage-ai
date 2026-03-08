// ============================================================
// ESCALATION REPOSITORY
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js'
import { createServiceRoleClient } from '../supabase'
import { EscalationState } from '../../domain/enums'
import type { Escalation } from '../../domain/entities'

export class EscalationRepository {
  private db: SupabaseClient

  constructor(db?: SupabaseClient) {
    this.db = db ?? createServiceRoleClient()
  }

  async findByLoan(loanId: string): Promise<Escalation[]> {
    const { data, error } = await this.db
      .from('escalations')
      .select('*')
      .eq('loan_id', loanId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as Escalation[]
  }

  async findOpenByLoan(loanId: string): Promise<Escalation[]> {
    const { data, error } = await this.db
      .from('escalations')
      .select('*')
      .eq('loan_id', loanId)
      .in('status', [EscalationState.Open, EscalationState.Acknowledged])
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as Escalation[]
  }

  async findById(id: string): Promise<Escalation | null> {
    const { data, error } = await this.db
      .from('escalations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as Escalation
  }

  async resolve(id: string, resolution: string): Promise<boolean> {
    const { error } = await this.db
      .from('escalations')
      .update({
        status: EscalationState.Resolved,
        resolution,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    return !error
  }

  async dismiss(id: string): Promise<boolean> {
    const { error } = await this.db
      .from('escalations')
      .update({
        status: EscalationState.Dismissed,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    return !error
  }

  async countOpenByOfficer(officerId: string): Promise<number> {
    const { count, error } = await this.db
      .from('escalations')
      .select('id', { count: 'exact', head: true })
      .in('status', [EscalationState.Open, EscalationState.Acknowledged])
      .in(
        'loan_id',
        (
          await this.db
            .from('loans')
            .select('id')
            .eq('officer_id', officerId)
        ).data?.map((l: { id: string }) => l.id) ?? []
      )

    return error ? 0 : (count ?? 0)
  }
}
