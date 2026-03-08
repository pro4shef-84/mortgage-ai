-- ============================================================
-- MIGRATION 002: Indexes + RLS Policies
-- ============================================================

-- Enable RLS on all tables
alter table loans enable row level security;
alter table borrowers enable row level security;
alter table document_requirements enable row level security;
alter table uploaded_documents enable row level security;
alter table escalations enable row level security;
alter table event_logs enable row level security;
alter table notification_messages enable row level security;
alter table review_decisions enable row level security;
alter table officers enable row level security;

-- ── Officers can see their own loans ──────────────────────────
create policy "officers_own_loans" on loans
  for all using (officer_id = auth.uid());

-- ── Officers can see borrowers for their loans ─────────────────
create policy "officers_borrowers" on borrowers
  for all using (
    exists (
      select 1 from loans
      where loans.borrower_id = borrowers.id
      and loans.officer_id = auth.uid()
    )
  );

-- ── Officers can see doc requirements for their loans ──────────
create policy "officers_doc_requirements" on document_requirements
  for all using (
    exists (
      select 1 from loans
      where loans.id = document_requirements.loan_id
      and loans.officer_id = auth.uid()
    )
  );

-- ── Officers can see uploaded docs for their loans ─────────────
create policy "officers_uploaded_docs" on uploaded_documents
  for all using (
    exists (
      select 1 from loans
      where loans.id = uploaded_documents.loan_id
      and loans.officer_id = auth.uid()
    )
  );

-- ── Officers can see escalations for their loans ───────────────
create policy "officers_escalations" on escalations
  for all using (
    exists (
      select 1 from loans
      where loans.id = escalations.loan_id
      and loans.officer_id = auth.uid()
    )
  );

-- ── Officers can see event logs for their loans ────────────────
create policy "officers_event_logs" on event_logs
  for all using (
    exists (
      select 1 from loans
      where loans.id = event_logs.loan_id
      and loans.officer_id = auth.uid()
    )
  );

-- ── Officers can see notifications for their loans ─────────────
create policy "officers_notifications" on notification_messages
  for all using (
    exists (
      select 1 from loans
      where loans.id = notification_messages.loan_id
      and loans.officer_id = auth.uid()
    )
  );

-- ── Officers can see review decisions for their loans ──────────
create policy "officers_review_decisions" on review_decisions
  for all using (
    exists (
      select 1 from loans
      where loans.id = review_decisions.loan_id
      and loans.officer_id = auth.uid()
    )
  );

-- ── Officers can see/update their own profile ──────────────────
create policy "officers_self" on officers
  for all using (id = auth.uid());

-- ── Performance Indexes ────────────────────────────────────────
create index if not exists idx_loans_officer_id on loans(officer_id);
create index if not exists idx_loans_borrower_id on loans(borrower_id);
create index if not exists idx_loans_workflow_state on loans(workflow_state);
create index if not exists idx_loans_updated_at on loans(updated_at desc);
create index if not exists idx_doc_requirements_loan_id on document_requirements(loan_id);
create index if not exists idx_doc_requirements_state on document_requirements(state);
create index if not exists idx_uploaded_docs_loan_id on uploaded_documents(loan_id);
create index if not exists idx_uploaded_docs_requirement_id on uploaded_documents(requirement_id);
create index if not exists idx_uploaded_docs_state on uploaded_documents(document_state);
create index if not exists idx_escalations_loan_id on escalations(loan_id);
create index if not exists idx_escalations_status on escalations(status);
create index if not exists idx_event_logs_loan_id on event_logs(loan_id);
create index if not exists idx_event_logs_event_type on event_logs(event_type);
create index if not exists idx_borrowers_portal_token on borrowers(portal_token);
create index if not exists idx_notification_loan_id on notification_messages(loan_id);
