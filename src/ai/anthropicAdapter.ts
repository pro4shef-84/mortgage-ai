// ============================================================
// ANTHROPIC ADAPTER — wraps Anthropic SDK with structured outputs
// All AI calls go through this module
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import {
  DocumentIntelligenceSchema,
  BorrowerMessageSchema,
  OfficerCopilotSchema,
  type DocumentIntelligenceOutput,
  type BorrowerMessageOutput,
  type OfficerCopilotOutput,
} from './schemas'
import { logger } from '../lib/logger'
import { env } from '../lib/env'

const MODEL = 'claude-sonnet-4-6'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  }
  return _client
}

// ── Generic structured call ──────────────────────────────────
async function callStructured<T>(
  prompt: string,
  schema: z.ZodType<T>,
  toolName: string,
  toolDescription: string,
  toolInputSchema: Record<string, unknown>
): Promise<T> {
  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    tools: [
      {
        name: toolName,
        description: toolDescription,
        input_schema: {
          type: 'object' as const,
          ...toolInputSchema,
        },
      },
    ],
    tool_choice: { type: 'tool', name: toolName },
    messages: [{ role: 'user', content: prompt }],
  })

  const toolUse = response.content.find((c) => c.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error(`AI did not return tool_use response for ${toolName}`)
  }

  const parsed = schema.safeParse(toolUse.input)
  if (!parsed.success) {
    logger.error('AI output failed schema validation', {
      tool: toolName,
      errors: parsed.error.issues,
      raw: toolUse.input,
    })
    throw new Error(`AI output schema validation failed: ${parsed.error.message}`)
  }

  return parsed.data
}

// ── Document Intelligence ────────────────────────────────────
export async function classifyDocument(
  prompt: string
): Promise<DocumentIntelligenceOutput> {
  return callStructured(
    prompt,
    DocumentIntelligenceSchema,
    'classify_document',
    'Classify and extract information from a mortgage document',
    {
      properties: {
        doc_type: {
          type: 'string',
          enum: ['pay_stub', 'w2', 'bank_statement', 'government_id', 'purchase_contract', 'unknown_document'],
          description: 'The classified document type',
        },
        confidence_score: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confidence score for the classification (0-1)',
        },
        issues: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of issues found with the document',
        },
        rationale_summary: {
          type: 'string',
          description: 'Brief explanation of the classification decision',
        },
        extracted_fields: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Key-value pairs of extracted document fields',
        },
      },
      required: ['doc_type', 'confidence_score', 'issues', 'rationale_summary', 'extracted_fields'],
    }
  )
}

// ── Borrower Concierge ───────────────────────────────────────
export async function generateBorrowerResponse(
  prompt: string
): Promise<BorrowerMessageOutput> {
  return callStructured(
    prompt,
    BorrowerMessageSchema,
    'respond_to_borrower',
    'Generate a helpful response to a borrower question about the mortgage process',
    {
      properties: {
        message: {
          type: 'string',
          description: 'The message to send to the borrower',
        },
        is_advisory_question: {
          type: 'boolean',
          description: 'Whether the borrower asked an advisory/underwriting question',
        },
        escalation_required: {
          type: 'boolean',
          description: 'Whether this requires escalation to a human officer',
        },
        escalation_reason: {
          type: ['string', 'null'],
          description: 'Why escalation is required, or null if not required',
        },
      },
      required: ['message', 'is_advisory_question', 'escalation_required', 'escalation_reason'],
    }
  )
}

// ── Officer Copilot ──────────────────────────────────────────
export async function generateOfficerSummary(
  prompt: string
): Promise<OfficerCopilotOutput> {
  return callStructured(
    prompt,
    OfficerCopilotSchema,
    'generate_officer_summary',
    'Generate a structured loan review summary for a mortgage officer',
    {
      properties: {
        loan_id: { type: 'string' },
        overall_status: { type: 'string' },
        unresolved_issues: { type: 'array', items: { type: 'string' } },
        confidence_flags: { type: 'array', items: { type: 'string' } },
        recommended_actions: { type: 'array', items: { type: 'string' } },
        document_summaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              doc_type: {
                type: 'string',
                enum: ['pay_stub', 'w2', 'bank_statement', 'government_id', 'purchase_contract', 'unknown_document'],
              },
              state: { type: 'string' },
              issues: { type: 'array', items: { type: 'string' } },
            },
            required: ['doc_type', 'state', 'issues'],
          },
        },
      },
      required: ['loan_id', 'overall_status', 'unresolved_issues', 'confidence_flags', 'recommended_actions', 'document_summaries'],
    }
  )
}
