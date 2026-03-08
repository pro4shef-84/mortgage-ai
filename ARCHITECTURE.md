# Architecture Overview

## Primary principle
Workflow engine decides. AI advises.

## Major components

1. Officer web app
2. Borrower portal
3. Workflow engine
4. Agent layer
5. Document pipeline
6. Notification service
7. Persistence + event log

## High-level flow

Loan Officer creates file
-> Workflow engine initializes loan + checklist
-> Borrower Concierge sends onboarding + upload link
-> Borrower uploads document
-> Document pipeline validates + classifies
-> Workflow engine updates requirement state
-> Borrower Concierge requests corrections or confirms receipt
-> Officer Copilot summarizes when ready for review
-> Officer makes final review decision

## Service boundaries

### Workflow engine
Owns:
- state transitions
- timers
- reminder scheduling
- escalation routing
- audit/event emission

### Agent layer
Owns:
- classification interpretation
- natural language explanations
- borrower Q&A routing
- officer summaries

### Document pipeline
Owns:
- file precheck
- OCR invocation
- structural validation
- requirement matching

### Notifications
Owns:
- SMS sending
- email sending
- dedupe/idempotency on reminders

## State machines
- Loan state machine
- Requirement state machine
- Uploaded document state machine
- Escalation state machine

## Reliability requirements
- idempotent reminders
- retry-safe jobs
- explicit error escalation for provider failures
- no direct UI-driven state mutation
