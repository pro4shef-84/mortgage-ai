# Recommended Repo Structure

```text
/ (repo root)
  PROJECT_SPEC.md
  CODEX_SUPERPROMPT.md
  AGENTS.md
  REPO_STRUCTURE.md
  ENV_TEMPLATE.md
  SAMPLE_DATA.md
  RUN_INSTRUCTIONS.md
  README.md

  /app
    /dashboard
    /borrower
    /loan

  /src
    /agents
      borrowerConciergeAgent.ts
      documentIntelligenceAgent.ts
      intakeAgent.ts
      officerCopilotAgent.ts

    /workflow
      workflowEngine.ts
      loanStateMachine.ts
      requirementStateMachine.ts
      documentStateMachine.ts
      escalationStateMachine.ts

    /services
      documentPipeline.ts
      reminderService.ts
      escalationService.ts
      notificationService.ts
      reviewService.ts

    /ai
      openaiAdapter.ts
      promptTemplates.ts
      schemas.ts

    /ocr
      textractAdapter.ts
      documentAiAdapter.ts
      types.ts

    /db
      schema.ts
      migrations
      repositories

    /events
      eventBus.ts
      eventTypes.ts
      emitters.ts

    /domain
      entities
      enums
      rules
      validators

    /lib
      config.ts
      logger.ts
      utils.ts

  /tests
    /unit
    /integration
    /e2e

  /public
```

## Notes
- Keep workflow logic out of UI.
- Keep agent prompt logic isolated in /src/ai.
- Keep deterministic rule evaluation in /src/domain/rules or /src/workflow.
- Keep provider-specific code behind adapters.
