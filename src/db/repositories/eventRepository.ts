// ============================================================
// EVENT LOG REPOSITORY
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js'
import { createServiceRoleClient } from '../supabase'
import { EventType } from '../../domain/enums'
import type { EventLog } from '../../domain/entities'

export class EventRepository {
  private db: SupabaseClient

  constructor(db?: SupabaseClient) {
    this.db = db ?? createServiceRoleClient()
  }

  async log(params: {
    loan_id: string
    event_type: EventType
    actor: string
    payload?: Record<string, unknown>
  }): Promise<void> {
    await this.db.from('event_logs').insert({
      loan_id: params.loan_id,
      event_type: params.event_type,
      actor: params.actor,
      payload: params.payload ?? {},
    })
  }

  async findByLoan(loanId: string, limit = 50): Promise<EventLog[]> {
    const { data, error } = await this.db
      .from('event_logs')
      .select('*')
      .eq('loan_id', loanId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data as EventLog[]
  }

  async countRemindersSent(loanId: string): Promise<number> {
    const { count, error } = await this.db
      .from('event_logs')
      .select('id', { count: 'exact', head: true })
      .eq('loan_id', loanId)
      .eq('event_type', EventType.ReminderSent)

    return error ? 0 : (count ?? 0)
  }

  async getLastReminderSent(loanId: string): Promise<string | null> {
    const { data, error } = await this.db
      .from('event_logs')
      .select('created_at')
      .eq('loan_id', loanId)
      .eq('event_type', EventType.ReminderSent)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null
    return data.created_at
  }
}
