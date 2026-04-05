export type ClaimStatus =
  | "new"
  | "ai_flagged"
  | "under_review"
  | "pending_confirmation"
  | "confirmed_savings"
  | "no_issue"
  | "disputed"
  | "resolved"

export type Classification =
  | "red"
  | "yellow"
  | "green"
  | "shadow"

export type ErrorCategory =
  | "duplicate_charge"
  | "upcoding"
  | "phantom_service"
  | "balance_billing"
  | "incorrect_denial"
  | "deductible_error"
  | "oop_max_error"
  | "preventive_care_error"
  | "bundling_error"
  | "modifier_issue"
  | "adjacent_duplicate"
  | "unknown"

export type PaymentStatus =
  | "safe_to_pay"
  | "review_before_paying"
  | "do_not_pay_yet"

export type TruthAnswer =
  | "yes"
  | "no"
  | "not_sure"

export interface AuditFields {
  created_at: string
  updated_at: string
  processed_by?: string
}

export interface CanonicalClaimInput extends AuditFields {
  claim_id: string
  employee_id?: string
  employer_id?: string
  provider_name?: string
  provider_npi?: string
  payer_name?: string
  tpa_name?: string
  service_date?: string
  claim_received_date?: string
  cpt_codes: string[]
  icd10_codes?: string[]
  modifiers?: string[]
  billed_amount?: number
  allowed_amount?: number
  patient_responsibility?: number
  deductible_amount?: number
  oop_applied_amount?: number
  place_of_service?: string
  network_status?: "in_network" | "out_of_network" | "unknown"
  denial_reason?: string
  source_type: "tpa_export" | "bill_upload" | "eob_upload" | "manual_entry"
  raw_text?: string
  source_file_name?: string
}

export interface OcrExtractionOutput extends AuditFields {
  claim_id: string
  extracted_provider_name?: string
  extracted_service_date?: string
  extracted_cpt_codes: string[]
  extracted_icd10_codes: string[]
  extracted_billed_amount?: number
  extracted_allowed_amount?: number
  extracted_patient_responsibility?: number
  extracted_text_blocks: string[]
  extraction_confidence: number
  missing_fields: string[]
}

export interface ReasoningFlag {
  category: ErrorCategory
  title: string
  explanation: string
  estimated_savings: number
  confidence: number
  evidence: string[]
}

export interface ReasoningOutput extends AuditFields {
  claim_id: string
  model: string
  reasoning_summary: string
  detected_flags: ReasoningFlag[]
  payment_status: PaymentStatus
  overall_confidence: number
  recommended_classification: Classification
  requires_verification: boolean
}

export interface VerificationDecision {
  category: ErrorCategory
  agrees_with_reasoning: boolean
  adjusted_confidence: number
  verification_notes: string
}

export interface VerificationOutput extends AuditFields {
  claim_id: string
  model: string
  verification_summary: string
  decisions: VerificationDecision[]
  overall_verified_confidence: number
  conflict_detected: boolean
  should_trigger_truth_layer: boolean
}

export interface ClassificationOutput extends AuditFields {
  claim_id: string
  final_classification: Classification
  final_confidence: number
  payment_status: PaymentStatus
  primary_error_category: ErrorCategory
  estimated_savings_total: number
  requires_truth_layer: boolean
  status_after_classification: ClaimStatus
  rationale: string
}

export interface TruthLayerDecision extends AuditFields {
  claim_id: string
  should_send: boolean
  reason: string
  question: string
  answer_choices: TruthAnswer[]
  delivery_channel: "email" | "sms" | "in_app"
  response_deadline_days: number
}

export interface TruthLayerResponse extends AuditFields {
  claim_id: string
  employee_id?: string
  answer: TruthAnswer
  answered_at: string
}

export interface DisputeTarget {
  target_type: "provider" | "payer" | "dual"
  target_name: string
  contact_email?: string
  contact_fax?: string
}

export interface DisputePacket extends AuditFields {
  claim_id: string
  dispute_id: string
  target: DisputeTarget
  subject_line: string
  letter_body: string
  hold_request_included: boolean
  attached_evidence: string[]
}

export interface SavingsEvent extends AuditFields {
  claim_id: string
  savings_event_id: string
  error_category: ErrorCategory
  verified_savings_amount: number
  employee_refund_amount: number
  employer_plan_savings_amount: number
  xilo_fee_amount: number
  participation_reward_amount: number
  verification_method: "high_confidence_ai" | "truth_layer" | "manual_review"
  finalized_at: string
}

/**
 * Main app-level claim record.
 * This is the single object that can represent a claim row in your database,
 * with nested outputs from each pipeline stage as they become available.
 */
export interface Claim extends AuditFields {
  id: string
  claim_id: string
  employee_id?: string
  employer_id?: string
  status: ClaimStatus
  current_classification?: Classification
  current_payment_status?: PaymentStatus

  input: CanonicalClaimInput
  ocr_output?: OcrExtractionOutput
  reasoning_output?: ReasoningOutput
  verification_output?: VerificationOutput
  classification_output?: ClassificationOutput
  truth_layer_decision?: TruthLayerDecision
  truth_layer_response?: TruthLayerResponse
  dispute_packet?: DisputePacket
  savings_event?: SavingsEvent

  notes?: string[]
  tags?: string[]
}

export function classifyPaymentStatus(
  classification: Classification
): PaymentStatus {
  if (classification === "green") return "safe_to_pay"
  if (classification === "yellow") return "review_before_paying"
  return "do_not_pay_yet"
}

export function shouldTriggerTruthLayer(
  confidence: number,
  classification: Classification,
  conflictDetected: boolean,
  estimatedSavings: number
): boolean {
  if (conflictDetected) return true
  if (classification !== "yellow") return false
  if (estimatedSavings >= 500) return true
  return confidence >= 0.4 && confidence <= 0.79 && estimatedSavings >= 50
}

export function deriveClaimStatus(
  classification: Classification,
  requiresTruthLayer: boolean
): ClaimStatus {
  if (requiresTruthLayer) return "pending_confirmation"
  if (classification === "green") return "no_issue"
  if (classification === "shadow") return "ai_flagged"
  return "under_review"
}
