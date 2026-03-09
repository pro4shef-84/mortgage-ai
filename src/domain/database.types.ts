// ============================================================
// DATABASE TYPES — typed Supabase table interfaces
// Matches the mortgage-ai schema (001_initial_schema.sql + 002)
// ============================================================

export interface Database {
  public: {
    Tables: {
      officers: {
        Row: {
          id: string
          full_name: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          created_at?: string
        }
      }
      borrowers: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          portal_token: string
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email?: string | null
          phone?: string | null
          portal_token?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          portal_token?: string
          created_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          borrower_id: string
          officer_id: string
          loan_type: string
          workflow_state: string
          property_state: string | null
          employment_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          borrower_id: string
          officer_id: string
          loan_type: string
          workflow_state?: string
          property_state?: string | null
          employment_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          borrower_id?: string
          officer_id?: string
          loan_type?: string
          workflow_state?: string
          property_state?: string | null
          employment_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      document_requirements: {
        Row: {
          id: string
          loan_id: string
          doc_type: string
          state: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          doc_type: string
          state?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          doc_type?: string
          state?: string
          created_at?: string
          updated_at?: string
        }
      }
      uploaded_documents: {
        Row: {
          id: string
          loan_id: string
          requirement_id: string | null
          storage_path: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          classification: string | null
          document_state: string
          confidence_score: number | null
          issues: string[]
          ai_rationale: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          requirement_id?: string | null
          storage_path: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          classification?: string | null
          document_state?: string
          confidence_score?: number | null
          issues?: string[]
          ai_rationale?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          requirement_id?: string | null
          storage_path?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          classification?: string | null
          document_state?: string
          confidence_score?: number | null
          issues?: string[]
          ai_rationale?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      escalations: {
        Row: {
          id: string
          loan_id: string
          category: string
          severity: string
          status: string
          owner: string | null
          resolution: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          category: string
          severity: string
          status?: string
          owner?: string | null
          resolution?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          category?: string
          severity?: string
          status?: string
          owner?: string | null
          resolution?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_logs: {
        Row: {
          id: string
          loan_id: string | null
          event_type: string
          actor: string | null
          payload: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          loan_id?: string | null
          event_type: string
          actor?: string | null
          payload?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          loan_id?: string | null
          event_type?: string
          actor?: string | null
          payload?: Record<string, unknown>
          created_at?: string
        }
      }
      notification_messages: {
        Row: {
          id: string
          loan_id: string | null
          borrower_id: string | null
          channel: string
          message_type: string
          content: string
          status: 'pending' | 'sent' | 'failed'
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          loan_id?: string | null
          borrower_id?: string | null
          channel: string
          message_type: string
          content: string
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          loan_id?: string | null
          borrower_id?: string | null
          channel?: string
          message_type?: string
          content?: string
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          created_at?: string
        }
      }
      review_decisions: {
        Row: {
          id: string
          loan_id: string
          officer_id: string | null
          decision: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          officer_id?: string | null
          decision: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          officer_id?: string | null
          decision?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
