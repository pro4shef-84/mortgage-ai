# Agent Development Rules

## LLM is NOT the workflow engine
All workflow transitions must occur in deterministic services.

## AI Responsibilities
AI may perform:

- document classification
- extraction interpretation
- borrower message drafting
- officer summaries

AI may NOT perform:

- workflow state transitions
- final review decisions
- underwriting judgments

## State Machines
The system must maintain explicit state machines for:

- loan files
- document requirements
- uploaded documents
- escalations

## Escalation Rules
Escalations must include:

- category
- severity
- status
- owner

Escalations must appear in officer dashboard.

## Coding Conventions
- Use TypeScript.
- Prefer pure functions for rule evaluation.
- Separate:
  - workflow engine
  - AI adapters
  - OCR adapters
  - notification adapters
  - persistence layer
  - UI layer
- No direct state mutation from UI.
- No hidden status logic in components.
- No irreversible workflow decisions made solely from LLM text output.

## Testing Requirements
- All state transitions must have unit tests.
- All validation rules must have tests.
- End-to-end borrower and officer flows must have Playwright tests.

## Architecture guardrails
- workflow engine decides, AI advises
- escalations are first-class records
- all important actions must emit events
- all important state changes must be auditable
