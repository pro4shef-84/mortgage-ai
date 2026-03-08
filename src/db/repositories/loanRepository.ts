// ============================================================
// LOAN REPOSITORY
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js'
import { createServiceRoleClient } from '../supabase'
import { LoanWorkflowState, LoanType, EmploymentType } from '../../domain/enums'
import type { Loan, CreateLoanInput } from '../../domain/entities'

export class LoanRepository {
  private db: SupabaseClient

  constructor(db?: SupabaseClient) {
    this.db = db ?? createServiceRoleClient()
  }

  async findById(id: string): Promise<Loan | null> {
    const { data, error } = await this.db
      .from('loans')
      .select(`
        *,
        borrower:borrowers(*),
        officer:officers(*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as Loan
  }

  async findByOfficer(officerId: string): Promise<Loan[]> {
    const { data, error } = await this.db
      .from('loans')
      .select(`
        *,
        borrower:borrowers(full_name, email),
        escalations(status, severity)
      `)
      .eq('officer_id', officerId)
      .order('updated_at', { ascending: false })

    if (error || !data) return []
    return data as Loan[]
  }

  async create(input: CreateLoanInput): Promise<Loan | null> {
    // First create or find borrower
    const { data: borrower, error: borrowerError } = await this.db
      .from('borrowers')
      .insert({
        full_name: input.borrower_name,
        email: input.borrower_email,
        phone: input.borrower_phone ?? null,
      })
      .select()
      .single()

    if (borrowerError || !borrower) return null

    const { data, error } = await this.db
      .from('loans')
      .insert({
        borrower_id: borrower.id,
        officer_id: input.officer_id,
        loan_type: input.loan_type,
        workflow_state: LoanWorkflowState.LoanCreated,
        property_state: input.property_state ?? null,
        employment_type: input.employment_type ?? EmploymentType.W2,
      })
      .select(`
        *,
        borrower:borrowers(*),
        officer:officers(*)
      `)
      .single()

    if (error || !data) return null
    return data as Loan
  }

  async updateState(id: string, state: LoanWorkflowState): Promise<boolean> {
    const { error } = await this.db
      .from('loans')
      .update({ workflow_state: state, updated_at: new Date().toISOString() })
      .eq('id', id)
    return !error
  }

  async findByWorkflowState(state: LoanWorkflowState): Promise<Loan[]> {
    const { data, error } = await this.db
      .from('loans')
      .select('*')
      .eq('workflow_state', state)

    if (error || !data) return []
    return data as Loan[]
  }

  async getLoanWithFullContext(id: string) {
    const { data, error } = await this.db
      .from('loans')
      .select(`
        *,
        borrower:borrowers(*),
        officer:officers(*),
        document_requirements(
          *,
          uploaded_documents(*)
        ),
        escalations(*),
        event_logs(*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data
  }
}
