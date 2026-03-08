// ============================================================
// ALL STATE MACHINE ENUMS — mortgage-ai domain layer
// ============================================================

export enum LoanWorkflowState {
  Draft = 'draft',
  LoanCreated = 'loan_created',
  BorrowerInvited = 'borrower_invited',
  AwaitingBorrowerDocuments = 'awaiting_borrower_documents',
  DocumentsUnderValidation = 'documents_under_validation',
  BorrowerCorrectionRequired = 'borrower_correction_required',
  BorrowerUnresponsive = 'borrower_unresponsive',
  HumanReviewRequired = 'human_review_required',
  OfficerFollowupRequired = 'officer_followup_required',
  AwaitingOfficerReview = 'awaiting_officer_review',
  ReviewReady = 'review_ready',
  Blocked = 'blocked',
  Archived = 'archived',
}

export enum DocumentRequirementState {
  Required = 'required',
  AwaitingUpload = 'awaiting_upload',
  UploadedPendingValidation = 'uploaded_pending_validation',
  TentativelySatisfied = 'tentatively_satisfied',
  CorrectionRequired = 'correction_required',
  NeedsHumanReview = 'needs_human_review',
  WaivedByOfficer = 'waived_by_officer',
  ConfirmedByOfficer = 'confirmed_by_officer',
}

export enum UploadedDocumentState {
  Received = 'received',
  PrecheckFailed = 'precheck_failed',
  Processing = 'processing',
  Classified = 'classified',
  ValidatedOk = 'validated_ok',
  ValidatedIssuFound = 'validated_issue_found',
  NeedsHumanReview = 'needs_human_review',
  Superseded = 'superseded',
  Rejected = 'rejected',
  AcceptedTentatively = 'accepted_tentatively',
}

export enum EscalationState {
  Open = 'open',
  Acknowledged = 'acknowledged',
  Resolved = 'resolved',
  Dismissed = 'dismissed',
}

export enum EscalationSeverity {
  Info = 'info',
  Warning = 'warning',
  High = 'high',
  Critical = 'critical',
}

export enum EscalationCategory {
  LowConfidenceClassification = 'low_confidence_classification',
  BorrowerAdvisoryQuestion = 'borrower_advisory_question',
  RepeatedFailedUpload = 'repeated_failed_upload',
  BorrowerUnresponsive = 'borrower_unresponsive',
  NameMismatch = 'name_mismatch',
  ContradictoryData = 'contradictory_data',
  SuspiciousDocument = 'suspicious_document',
  UnsupportedScenario = 'unsupported_scenario',
  SystemProcessingFailure = 'system_processing_failure',
  BorrowerFrustrationSignal = 'borrower_frustration_signal',
}

export enum DocumentType {
  PayStub = 'pay_stub',
  W2 = 'w2',
  BankStatement = 'bank_statement',
  GovernmentId = 'government_id',
  PurchaseContract = 'purchase_contract',
  UnknownDocument = 'unknown_document',
}

export enum LoanType {
  ConventionalPurchase = 'conventional_purchase',
  ConventionalRefinance = 'conventional_refinance',
}

export enum EmploymentType {
  W2 = 'w2',
}

export enum NotificationChannel {
  Email = 'email',
  Sms = 'sms',
}

export enum ReviewDecisionType {
  ReviewReady = 'review_ready',
  NeedsCorrection = 'needs_correction',
  Archived = 'archived',
}

export enum EventType {
  LoanCreated = 'loan_created',
  BorrowerInvited = 'borrower_invited',
  DocumentUploaded = 'document_uploaded',
  DocumentValidated = 'document_validated',
  DocumentRejected = 'document_rejected',
  EscalationCreated = 'escalation_created',
  EscalationResolved = 'escalation_resolved',
  WorkflowTransition = 'workflow_transition',
  ReminderSent = 'reminder_sent',
  OfficerReviewSubmitted = 'officer_review_submitted',
  RequirementStateChanged = 'requirement_state_changed',
  DocumentStateChanged = 'document_state_changed',
}
