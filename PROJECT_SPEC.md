# AI Mortgage Processing Assistant
Author: Praveen Rao

## Mission
Build an AI-native mortgage document processing assistant that automates borrower document collection, validation, reminders, and issue detection for independent mortgage loan officers.

The system replaces repetitive processor tasks while keeping humans responsible for judgment.

---

# Core Architecture Principles

## LLM is NOT the workflow engine
Deterministic services control:

- workflow state
- timers
- retries
- escalation routing
- permissions
- audit logs

AI assists with:

- document classification
- extraction interpretation
- borrower explanations
- borrower Q&A
- officer summaries

## Human in the loop
AI must never autonomously finalize:

- review_ready state
- ambiguous document acceptance
- advisory borrower questions
- suspicious document resolution
- unsupported scenario resolution

## Escalations are first-class
Escalation objects must include:

- category
- severity
- status
- owner
- resolution
- timestamps

## Explicit state machines
The system uses independent state machines for:

- loan file
- document requirement
- uploaded document
- escalation

---

# Product Scope

## Target User
Independent mortgage loan officer.

Typical profile:

- 3–10 loans/month
- pays $500–$750 per loan to processors
- wants automation for document collection

## Supported loans (MVP)

- conventional purchase
- conventional refinance
- W2 borrower only
- single borrower only
- US only

## Excluded

- self-employed borrowers
- commercial loans
- construction loans
- complex income
- multiple borrowers
- underwriting decisions
- lender selection
- rate advice
- LOS integration
- loan submission

---

# Processor Task Graph

The MVP automates the following processor layers:

1. file setup
2. document planning
3. borrower communication
4. document verification
5. checklist tracking
6. exception handling
7. review preparation

Representative micro-tasks:

- create loan file
- generate checklist
- invite borrower
- send document requests
- send reminders
- receive uploads
- validate file format
- OCR document
- classify document
- detect duplicates
- detect missing pages
- extract metadata
- match requirement
- request corrections
- track checklist state
- detect stalled borrower
- escalate issues
- generate file summary
- prepare review packet

---

# Agentic System Design

## Intake & Checklist Agent
Responsibilities:

- generate checklist
- create document requirements
- initialize loan workflow

Inputs:

- loan type
- borrower employment type
- state

## Borrower Concierge Agent
Responsibilities:

- send onboarding
- request documents
- send reminders
- answer operational questions
- request corrections

Restrictions:

Must not answer:

- approval questions
- rates
- loan advice
- underwriting questions

## Document Intelligence Agent
Responsibilities:

- classify documents
- extract metadata
- detect quality issues
- detect missing pages
- detect mismatches

Outputs must include:

- doc_type
- confidence_score
- issues[]
- rationale_summary

## Loan Officer Copilot Agent
Responsibilities:

- summarize file
- highlight issues
- prepare officer review packet
- prioritize files needing attention

## Workflow Orchestrator
Non-AI deterministic service controlling:

- state transitions
- reminders
- timers
- agent triggers
- escalations
- audit logs

---

# Workflow State Machine

## Loan states

- draft
- loan_created
- borrower_invited
- awaiting_borrower_documents
- documents_under_validation
- borrower_correction_required
- borrower_unresponsive
- human_review_required
- officer_followup_required
- awaiting_officer_review
- review_ready
- blocked
- archived

Rule:

- review_ready may only be set by the loan officer

## Document requirement states

- required
- awaiting_upload
- uploaded_pending_validation
- tentatively_satisfied
- correction_required
- needs_human_review
- waived_by_officer
- confirmed_by_officer

## Uploaded document states

- received
- precheck_failed
- processing
- classified
- validated_ok
- validated_issue_found
- needs_human_review
- superseded
- rejected
- accepted_tentatively

## Escalation states

- open
- acknowledged
- resolved
- dismissed

---

# Document Taxonomy

Supported document types:

- pay_stub
- w2
- bank_statement
- government_id
- purchase_contract
- unknown_document

Auxiliary classifications:

- duplicate_document
- low_quality_image
- incomplete_document
- suspicious_document

---

# Document Verification Pipeline

Each upload follows this pipeline:

Upload  
→ file validation  
→ OCR extraction  
→ classification  
→ structural validation  
→ requirement matching  
→ confidence evaluation  
→ workflow decision

Possible workflow decisions:

- accepted_tentatively
- correction_required
- needs_human_review
- suspicious_document

---

# Document Validation Rules

## Pay Stub
Must include when possible:

- employee_name
- employer_name
- pay_period
- ytd_income
- recent date

Common failures:

- missing YTD
- cropped screenshot
- old pay stub
- blurry image

## W2
Must include when possible:

- employee_name
- tax_year
- wages

Common failures:

- tax return instead of W2
- wrong year
- partial screenshot

## Bank Statement
Must include when possible:

- account holder name
- statement date
- all pages

Common failures:

- page 1 only
- screenshots instead of full statement
- old statement
- missing name

## Government ID
Must include when possible:

- full_name
- readable ID type
- legible image

## Purchase Contract
Must be identifiable as purchase contract / agreement with enough visible structure to classify confidently.

---

# Escalations

Categories:

- low_confidence_classification
- borrower_advisory_question
- repeated_failed_upload
- borrower_unresponsive
- name_mismatch
- contradictory_data
- suspicious_document
- unsupported_scenario
- system_processing_failure
- borrower_frustration_signal

Severity:

- info
- warning
- high
- critical

Example rule:

If borrower asks "Am I approved?"

create escalation:
- category: borrower_advisory_question
- severity: high
- resulting file state: officer_followup_required

---

# Event Model

Core events:

- loan_created
- borrower_invited
- borrower_uploaded_document
- document_classified
- document_issue_detected
- borrower_reminder_sent
- borrower_replied
- escalation_created
- officer_review_started
- file_marked_review_ready

Event schema:

- event_id
- loan_id
- event_type
- actor
- timestamp
- payload

---

# Core Entities

- Loan
- Borrower
- DocumentRequirement
- UploadedDocument
- Escalation
- EventLog
- NotificationMessage
- ReviewDecision

---

# System Architecture

Recommended stack:

Frontend:
- Next.js
- React
- Tailwind

Backend:
- Next.js route handlers / Node services

Database:
- Supabase Postgres

Storage:
- Supabase Storage or S3

AI:
- OpenAI API

OCR:
- AWS Textract or Google Document AI

Messaging:
- Twilio (SMS)
- Resend (email)

Deployment:
- Vercel

---

# Officer Dashboard

Must show:

- loan status
- missing documents
- document issues
- escalations
- AI summary
- review-ready action

# Borrower Portal

Must support:

- secure upload
- document checklist
- mobile upload
- status feedback
- correction instructions

---

# Testing

Required scenarios:

- happy path
- wrong document correction
- blurry upload correction
- borrower advisory question escalation
- name mismatch
- low confidence classification

---

# Success Metrics

- reduce document chasing by ≥70%
- reduce document collection time by ≥50%
- loan officers feel comfortable processing standard files without external processors
