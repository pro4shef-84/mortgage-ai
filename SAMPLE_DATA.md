# Sample Data and Test Fixtures

Provide test files for the following scenarios:

1. good pay stub
2. blurry pay stub
3. full bank statement PDF
4. incomplete bank statement (missing page)
5. wrong document upload (e.g. tax return instead of W2)
6. government ID image
7. duplicate upload
8. screenshot of account balance instead of full statement

## Recommended fixture scenarios

### Happy path
- valid pay stub
- valid W2
- valid bank statement

### Correction path
- blurry pay stub
- page 1 only bank statement
- screenshot instead of PDF

### Escalation path
- low confidence classification
- name mismatch
- suspicious alteration signal (mocked if necessary)
- borrower advisory question: “Am I approved?”

Use these fixtures to seed integration tests and Playwright flows.
