// ============================================================
// DETERMINISTIC DOCUMENT VALIDATION RULES
// AI is NOT involved here — pure rule-based checks
// ============================================================

import { DocumentType } from '../enums'
import { ValidationResult } from '../entities'

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000

export interface ExtractedFields {
  employee_name?: string
  employer_name?: string
  pay_period?: string
  ytd_income?: string
  tax_year?: string
  wages?: string
  account_holder_name?: string
  statement_date?: string
  all_pages?: string
  full_name?: string
  id_type?: string
  document_type?: string
  date?: string
  image_quality?: string
  page_count?: string
  [key: string]: string | undefined
}

function isDateOlderThan(dateStr: string | undefined, maxAgeMs: number): boolean {
  if (!dateStr) return true
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return true
  return Date.now() - parsed.getTime() > maxAgeMs
}

function isImageQualityLow(quality: string | undefined): boolean {
  if (!quality) return false
  return ['low', 'poor', 'blurry', 'unreadable'].includes(quality.toLowerCase())
}

// ── Pay Stub Validation ──────────────────────────────────────
function validatePayStub(fields: ExtractedFields): ValidationResult {
  const issues: string[] = []
  const missing: string[] = []
  const warnings: string[] = []

  if (!fields.employee_name) missing.push('employee_name')
  if (!fields.employer_name) missing.push('employer_name')
  if (!fields.pay_period) missing.push('pay_period')

  if (!fields.ytd_income) {
    missing.push('ytd_income')
    issues.push('Missing year-to-date income — required for all pay stubs.')
  }

  if (isDateOlderThan(fields.pay_period, SIXTY_DAYS_MS)) {
    issues.push('Pay stub is older than 60 days and cannot be accepted.')
  }

  if (isImageQualityLow(fields.image_quality)) {
    issues.push('Image quality is too low to read required fields clearly.')
  }

  return {
    valid: issues.length === 0 && missing.length === 0,
    issues,
    missing_fields: missing,
    warnings,
  }
}

// ── W-2 Validation ───────────────────────────────────────────
function validateW2(fields: ExtractedFields): ValidationResult {
  const issues: string[] = []
  const missing: string[] = []
  const warnings: string[] = []

  const currentYear = new Date().getFullYear()
  const expectedYear = currentYear - 1 // prior tax year

  if (!fields.employee_name) missing.push('employee_name')
  if (!fields.tax_year) {
    missing.push('tax_year')
    issues.push('Tax year is missing from the W-2.')
  } else {
    const docYear = parseInt(fields.tax_year, 10)
    if (docYear !== expectedYear) {
      issues.push(
        `W-2 is for tax year ${docYear}, but we need the ${expectedYear} W-2.`
      )
    }
  }

  if (!fields.wages) {
    missing.push('wages')
    issues.push('Wage amount (Box 1) is missing from the W-2.')
  }

  if (isImageQualityLow(fields.image_quality)) {
    issues.push('Partial screenshot detected — please provide the complete W-2 document.')
  }

  return {
    valid: issues.length === 0 && missing.length === 0,
    issues,
    missing_fields: missing,
    warnings,
  }
}

// ── Bank Statement Validation ────────────────────────────────
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

function validateBankStatement(fields: ExtractedFields): ValidationResult {
  const issues: string[] = []
  const missing: string[] = []
  const warnings: string[] = []

  if (!fields.account_holder_name) missing.push('account_holder_name')

  if (!fields.statement_date) {
    missing.push('statement_date')
    issues.push('Statement date is missing.')
  } else if (isDateOlderThan(fields.statement_date, NINETY_DAYS_MS)) {
    issues.push('Bank statement is older than 90 days and cannot be accepted.')
  }

  const pageCount = parseInt(fields.page_count ?? '0', 10)
  if (fields.all_pages !== 'true' || pageCount < 2) {
    issues.push(
      'All pages of the bank statement are required. It appears only page 1 was uploaded, or this is a screenshot.'
    )
  }

  if (isImageQualityLow(fields.image_quality)) {
    issues.push('Image quality too low — please upload the original PDF from your bank.')
  }

  return {
    valid: issues.length === 0 && missing.length === 0,
    issues,
    missing_fields: missing,
    warnings,
  }
}

// ── Government ID Validation ─────────────────────────────────
function validateGovernmentId(fields: ExtractedFields): ValidationResult {
  const issues: string[] = []
  const missing: string[] = []
  const warnings: string[] = []

  if (!fields.full_name) missing.push('full_name')

  if (!fields.id_type) {
    missing.push('id_type')
    issues.push('Could not identify the type of ID (driver\'s license, passport, etc.).')
  }

  if (isImageQualityLow(fields.image_quality)) {
    issues.push('ID image is not legible. Please take a clearer photo in good lighting.')
  }

  return {
    valid: issues.length === 0 && missing.length === 0,
    issues,
    missing_fields: missing,
    warnings,
  }
}

// ── Purchase Contract Validation ─────────────────────────────
function validatePurchaseContract(fields: ExtractedFields): ValidationResult {
  const issues: string[] = []
  const missing: string[] = []
  const warnings: string[] = []

  if (!fields.document_type || !['purchase_agreement', 'purchase_contract', 'sales_contract'].includes(
    fields.document_type.toLowerCase()
  )) {
    issues.push('Document could not be identified as a purchase agreement or sales contract.')
  }

  return {
    valid: issues.length === 0 && missing.length === 0,
    issues,
    missing_fields: missing,
    warnings,
  }
}

// ── Main validator dispatch ──────────────────────────────────
export function validateDocument(
  docType: DocumentType,
  extractedFields: ExtractedFields
): ValidationResult {
  switch (docType) {
    case DocumentType.PayStub:
      return validatePayStub(extractedFields)
    case DocumentType.W2:
      return validateW2(extractedFields)
    case DocumentType.BankStatement:
      return validateBankStatement(extractedFields)
    case DocumentType.GovernmentId:
      return validateGovernmentId(extractedFields)
    case DocumentType.PurchaseContract:
      return validatePurchaseContract(extractedFields)
    case DocumentType.UnknownDocument:
      return {
        valid: false,
        issues: ['Document type could not be determined. Please upload the correct document.'],
        missing_fields: [],
        warnings: [],
      }
    default:
      return {
        valid: false,
        issues: ['Unsupported document type.'],
        missing_fields: [],
        warnings: [],
      }
  }
}

// ── Required document types per loan type ───────────────────
export const REQUIRED_DOCS_BY_LOAN_TYPE: Record<string, DocumentType[]> = {
  conventional_purchase: [
    DocumentType.PayStub,
    DocumentType.W2,
    DocumentType.BankStatement,
    DocumentType.GovernmentId,
    DocumentType.PurchaseContract,
  ],
  conventional_refinance: [
    DocumentType.PayStub,
    DocumentType.W2,
    DocumentType.BankStatement,
    DocumentType.GovernmentId,
  ],
}

export const CONFIDENCE_THRESHOLD = 0.75
