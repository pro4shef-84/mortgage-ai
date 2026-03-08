-- ============================================================
-- MIGRATION 001: Initial Schema
-- ============================================================

-- borrowers table
create table if not exists borrowers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  portal_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- officers table (linked to Supabase auth)
create table if not exists officers (
  id uuid primary key references auth.users(id),
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- loans table
create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid not null references borrowers(id),
  officer_id uuid not null references officers(id),
  loan_type text not null check (loan_type in ('conventional_purchase','conventional_refinance')),
  workflow_state text not null default 'draft',
  property_state text,
  employment_type text not null default 'w2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- document_requirements table
create table if not exists document_requirements (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  doc_type text not null,
  state text not null default 'required',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- uploaded_documents table
create table if not exists uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  requirement_id uuid references document_requirements(id) on delete set null,
  storage_path text not null,
  file_name text not null,
  file_size integer,
  mime_type text,
  classification text,
  document_state text not null default 'received',
  confidence_score numeric(4,3),
  issues jsonb default '[]',
  ai_rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- escalations table
create table if not exists escalations (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  category text not null,
  severity text not null,
  status text not null default 'open',
  owner text,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- event_logs table
create table if not exists event_logs (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid references loans(id) on delete cascade,
  event_type text not null,
  actor text,
  payload jsonb default '{}',
  created_at timestamptz not null default now()
);

-- notification_messages table
create table if not exists notification_messages (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid references loans(id) on delete cascade,
  borrower_id uuid references borrowers(id),
  channel text not null check (channel in ('email','sms')),
  message_type text not null,
  content text not null,
  status text not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- review_decisions table
create table if not exists review_decisions (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  officer_id uuid references officers(id),
  decision text not null check (decision in ('review_ready','needs_correction','archived')),
  notes text,
  created_at timestamptz not null default now()
);
