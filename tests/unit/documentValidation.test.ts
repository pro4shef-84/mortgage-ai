import { describe, it, expect } from 'vitest'
import { validateDocument } from '../../src/domain/rules/documentValidationRules'
import { DocumentType } from '../../src/domain/enums'

const VALID_RECENT_DATE = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
const STALE_DATE = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
const CURRENT_YEAR = (new Date().getFullYear() - 1).toString()

describe('Pay Stub Validation', () => {
  it('validates a correct pay stub', () => {
    const result = validateDocument(DocumentType.PayStub, {
      employee_name: 'Jane Smith',
      employer_name: 'Acme Corp',
      pay_period: VALID_RECENT_DATE,
      ytd_income: '45000',
    })
    expect(result.valid).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it('fails when YTD income is missing', () => {
    const result = validateDocument(DocumentType.PayStub, {
      employee_name: 'Jane Smith',
      employer_name: 'Acme Corp',
      pay_period: VALID_RECENT_DATE,
    })
    expect(result.valid).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.missing_fields).toContain('ytd_income')
  })

  it('fails when pay stub is older than 60 days', () => {
    const result = validateDocument(DocumentType.PayStub, {
      employee_name: 'Jane Smith',
      employer_name: 'Acme Corp',
      pay_period: STALE_DATE,
      ytd_income: '45000',
    })
    expect(result.valid).toBe(false)
    expect(result.issues.some((i) => i.includes('60 days'))).toBe(true)
  })

  it('fails when image quality is low', () => {
    const result = validateDocument(DocumentType.PayStub, {
      employee_name: 'Jane Smith',
      employer_name: 'Acme Corp',
      pay_period: VALID_RECENT_DATE,
      ytd_income: '45000',
      image_quality: 'low',
    })
    expect(result.valid).toBe(false)
  })
})

describe('W-2 Validation', () => {
  it('validates a correct W-2', () => {
    const result = validateDocument(DocumentType.W2, {
      employee_name: 'Jane Smith',
      tax_year: CURRENT_YEAR,
      wages: '95000',
    })
    expect(result.valid).toBe(true)
  })

  it('fails for wrong tax year', () => {
    const result = validateDocument(DocumentType.W2, {
      employee_name: 'Jane Smith',
      tax_year: '2020',
      wages: '95000',
    })
    expect(result.valid).toBe(false)
    expect(result.issues.some((i) => i.includes('tax year'))).toBe(true)
  })

  it('fails when wages are missing', () => {
    const result = validateDocument(DocumentType.W2, {
      employee_name: 'Jane Smith',
      tax_year: CURRENT_YEAR,
    })
    expect(result.valid).toBe(false)
    expect(result.missing_fields).toContain('wages')
  })
})

describe('Bank Statement Validation', () => {
  const RECENT_STATEMENT = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  it('validates a correct bank statement', () => {
    const result = validateDocument(DocumentType.BankStatement, {
      account_holder_name: 'Jane Smith',
      statement_date: RECENT_STATEMENT,
      all_pages: 'true',
      page_count: '3',
    })
    expect(result.valid).toBe(true)
  })

  it('fails when only page 1 is uploaded', () => {
    const result = validateDocument(DocumentType.BankStatement, {
      account_holder_name: 'Jane Smith',
      statement_date: RECENT_STATEMENT,
      all_pages: 'false',
      page_count: '1',
    })
    expect(result.valid).toBe(false)
    expect(result.issues.some((i) => i.toLowerCase().includes('page'))).toBe(true)
  })

  it('fails when statement is older than 90 days', () => {
    const result = validateDocument(DocumentType.BankStatement, {
      account_holder_name: 'Jane Smith',
      statement_date: STALE_DATE,
      all_pages: 'true',
      page_count: '3',
    })
    expect(result.valid).toBe(false)
    expect(result.issues.some((i) => i.includes('90 days'))).toBe(true)
  })
})

describe('Government ID Validation', () => {
  it('validates a valid ID', () => {
    const result = validateDocument(DocumentType.GovernmentId, {
      full_name: 'Jane Smith',
      id_type: 'drivers_license',
    })
    expect(result.valid).toBe(true)
  })

  it('fails when ID type cannot be identified', () => {
    const result = validateDocument(DocumentType.GovernmentId, {
      full_name: 'Jane Smith',
    })
    expect(result.valid).toBe(false)
    expect(result.missing_fields).toContain('id_type')
  })

  it('fails when image is blurry', () => {
    const result = validateDocument(DocumentType.GovernmentId, {
      full_name: 'Jane Smith',
      id_type: 'passport',
      image_quality: 'blurry',
    })
    expect(result.valid).toBe(false)
  })
})

describe('Unknown Document', () => {
  it('always fails for unknown document type', () => {
    const result = validateDocument(DocumentType.UnknownDocument, {})
    expect(result.valid).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })
})
