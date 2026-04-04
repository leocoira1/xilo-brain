import type { ParsedClaimInput, ParsedLineItem } from "./inputParser"

export type AnalysisMode =
  | "claims_audit"
  | "employee_bill_review"
  | "manual_review_assist"

export type InferredRoute =
  | "billing_accuracy_analysis"
  | "plan_adjudication_analysis"
  | "denial_analysis"
  | "duplicate_detection"
  | "mixed_analysis"

export type PreliminaryState = "clear" | "review" | "high_risk" | "shadow"

export type PaymentRecommendation =
  | "safe_to_pay"
  | "review_before_paying"
  | "do_not_pay_yet"
  | "insufficient_data"

export type RuleFamily =
  | "duplicate_charge"
  | "upcoding"
  | "phantom_charge"
  | "modifier_error"
  | "ncci_unbundling"
  | "mue_violation"
  | "diagnosis_mismatch"
  | "amount_outlier"
  | "frequency_anomaly"
  | "deductible_error"
  | "coinsurance_error"
  | "copay_error"
  | "oop_max_error"
  | "preventive_misclassification"
  | "network_tier_error"
  | "balance_billing_error"
  | "denial_error"
  | "arithmetic_error"
  | "other"

export type Track = "billing_accuracy" | "plan_adjudication"

export type Severity = "low" | "medium" | "high" | "critical"

export type VerificationPriority = "auto" | "standard" | "high" | "manual_review"

export type NextStep =
  | "skip_to_classification"
  | "send_to_verification"
  | "send_to_truth_layer"
  | "manual_review"
  | "request_better_document"
  | "close_as_clear"

export type TargetDisputeChannel = "email" | "portal" | "fax" | "none"

export interface ReasoningEvidence {
  evidence_type: "field_mismatch" | "frequency_check" | "rule_lookup" | "pattern_match" | "arithmetic_check"
  field_path: string
  observed_value?: unknown
  expected_value?: unknown
  note?: string
}

export interface CandidateFinding {
  finding_id: string
  rule_family: RuleFamily
  track: Track
  line_item_refs: string[]

  severity: Severity
  description: string
  plain_language_explanation: string

  evidence: ReasoningEvidence[]
  preliminary_confidence: number

  confidence_adjustment_factors?: {
    ocr_confidence_adjustment?: number
    provider_pattern_adjustment?: number
    rule_strength_adjustment?: number
    missing_data_penalty?: number
  }

  confidence_rationale?: string

  estimated_savings: number
  recovery_probability_preliminary?: number

  dispute_target: "provider" | "payer" | "dual" | "none"
  requires_truth_layer: boolean
  truth_layer_question: string | null
  verification_priority: VerificationPriority
}

export interface ReasoningOutput {
  schema_version: "1.2"
  source_schema_version: "2.2"

  analysis_id: string
  claim_id: string
  analyzed_at: string

  engine_metadata: {
    engine_name: string
    engine_version?: string
    rule_library_version?: string
    analysis_mode: AnalysisMode
  }

  routing_inference: {
    inferred_route: InferredRoute
    inference_rationale?: string
  }

  reasoning_summary: {
    preliminary_state: PreliminaryState
    payment_recommendation: PaymentRecommendation
    overall_rationale: string
  }

  candidate_findings: CandidateFinding[]
  total_candidate_findings: number
  total_candidate_savings: number
  preliminary_bill_health_score: number | null

  reasoning_flags?: {
    has_objective_error_candidates?: boolean
    has_ambiguous_candidates?: boolean
    has_plan_adjudication_candidates?: boolean
    has_provider_billing_candidates?: boolean
    requires_truth_layer?: boolean
    low_confidence_source?: boolean
  }

  routing_recommendations: {
    next_step: NextStep
    target_dispute_channel: TargetDisputeChannel
    recommended_hold_request?: boolean
  }

  error_handling: {
    shadow_state: boolean
    shadow_reason: string | null
    manual_review_reason: string | null
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function maxNumber(values: number[]): number {
  if (!values.length) return 0
  return Math.max(...values)
}

function deriveAnalysisMode(input: ParsedClaimInput): AnalysisMode {
  // MVP default: employee bill review unless claim export / manual internal review explicitly says otherwise
  if (input.source_metadata.source_type === "claims_export") {
    return "claims_audit"
  }
  return "employee_bill_review"
}

function deriveRoute(input: ParsedClaimInput, findings: CandidateFinding[]): {
  inferred_route: InferredRoute
  inference_rationale: string
} {
  if (input.claim_status === "denied") {
    return {
      inferred_route: "denial_analysis",
      inference_rationale: "Claim status is denied, so denial analysis is the primary route.",
    }
  }

  if (findings.some(f => f.rule_family === "duplicate_charge")) {
    return {
      inferred_route: "duplicate_detection",
      inference_rationale: "Duplicate billing signals were identified in the line items.",
    }
  }

  const hasBilling = findings.some(f => f.track === "billing_accuracy")
  const hasPlan = findings.some(f => f.track === "plan_adjudication")

  if (hasBilling && hasPlan) {
    return {
      inferred_route: "mixed_analysis",
      inference_rationale: "Both provider billing and plan adjudication signals are present.",
    }
  }

  if (hasPlan) {
    return {
      inferred_route: "plan_adjudication_analysis",
      inference_rationale: "Primary signals point to insurer or plan adjudication issues.",
    }
  }

  return {
    inferred_route: "billing_accuracy_analysis",
    inference_rationale: "Primary signals point to provider-side billing accuracy issues.",
  }
}

function buildDuplicateFindings(input: ParsedClaimInput): CandidateFinding[] {
  const findings: CandidateFinding[] = []
  const seen = new Map<string, ParsedLineItem[]>()

  for (const line of input.line_items) {
    const key = `${line.cpt_code}|${line.billed_amount}|${line.primary_icd10 ?? ""}`
    const arr = seen.get(key) ?? []
    arr.push(line)
    seen.set(key, arr)
  }

  for (const [, lines] of seen.entries()) {
    if (lines.length >= 2) {
      const totalSavings = round2(lines.slice(1).reduce((sum, line) => sum + line.billed_amount, 0))
      findings.push({
        finding_id: makeId("finding"),
        rule_family: "duplicate_charge",
        track: "billing_accuracy",
        line_item_refs: lines.map(l => l.line_id),
        severity: totalSavings >= 1000 ? "high" : "medium",
        description: "Potential duplicate charge detected across matching line items.",
        plain_language_explanation:
          "This bill may include the same service more than once.",
        evidence: [
          {
            evidence_type: "pattern_match",
            field_path: "line_items",
            observed_value: lines.map(l => ({
              line_id: l.line_id,
              cpt_code: l.cpt_code,
              billed_amount: l.billed_amount,
            })),
            expected_value: "Single billable line for this repeated service pattern",
            note: "Matching CPT, diagnosis, and billed amount suggest a duplicate charge pattern.",
          },
        ],
        preliminary_confidence: 0.88,
        confidence_adjustment_factors: {
          rule_strength_adjustment: 0.1,
        },
        confidence_rationale:
          "Multiple line items match strongly on CPT, amount, and diagnosis, which is consistent with a duplicate billing pattern.",
        estimated_savings: totalSavings,
        recovery_probability_preliminary: 0.9,
        dispute_target: "provider",
        requires_truth_layer: false,
        truth_layer_question: null,
        verification_priority: "standard",
      })
    }
  }

  return findings
}

function buildArithmeticFinding(input: ParsedClaimInput): CandidateFinding[] {
  if (!input.claim_totals.validation_flag) return []

  const lineBilled = round2(input.line_items.reduce((sum, li) => sum + li.billed_amount, 0))
  const declaredBilled = input.claim_totals.total_billed_amount

  return [
    {
      finding_id: makeId("finding"),
      rule_family: "arithmetic_error",
      track: "billing_accuracy",
      line_item_refs: input.line_items.map(li => li.line_id),
      severity: "high",
      description: "Declared totals do not match the sum of line items.",
      plain_language_explanation:
        "The totals on this bill may not add up correctly.",
      evidence: [
        {
          evidence_type: "arithmetic_check",
          field_path: "claim_totals.total_billed_amount",
          observed_value: declaredBilled,
          expected_value: lineBilled,
          note: "Claim totals validation flag was triggered during intake.",
        },
      ],
      preliminary_confidence: 0.93,
      confidence_adjustment_factors: {
        rule_strength_adjustment: 0.1,
      },
      confidence_rationale:
        "This is a direct arithmetic mismatch between declared totals and line-item sums.",
      estimated_savings: Math.abs(round2(declaredBilled - lineBilled)),
      recovery_probability_preliminary: 0.95,
      dispute_target: "provider",
      requires_truth_layer: false,
      truth_layer_question: null,
      verification_priority: "auto",
    },
  ]
}

function buildAmountOutlierFindings(input: ParsedClaimInput): CandidateFinding[] {
  const findings: CandidateFinding[] = []

  for (const line of input.line_items) {
    if (line.allowed_amount !== null && line.billed_amount > line.allowed_amount * 1.75) {
      const savings = round2(line.billed_amount - line.allowed_amount)
      findings.push({
        finding_id: makeId("finding"),
        rule_family: "amount_outlier",
        track: "billing_accuracy",
        line_item_refs: [line.line_id],
        severity: savings >= 1000 ? "high" : "medium",
        description: "Billed amount is materially above allowed amount for the same line item.",
        plain_language_explanation:
          "This charge appears much higher than the allowed amount for the service billed.",
        evidence: [
          {
            evidence_type: "field_mismatch",
            field_path: `line_items.${line.line_id}`,
            observed_value: line.billed_amount,
            expected_value: line.allowed_amount,
            note: "Line billed amount materially exceeds allowed amount.",
          },
        ],
        preliminary_confidence: 0.72,
        confidence_adjustment_factors: {
          rule_strength_adjustment: 0.05,
        },
        confidence_rationale:
          "Large spread between billed and allowed amount suggests a pricing anomaly, but verification is still needed.",
        estimated_savings: savings,
        recovery_probability_preliminary: 0.7,
        dispute_target: "provider",
        requires_truth_layer: false,
        truth_layer_question: null,
        verification_priority: "standard",
      })
    }
  }

  return findings
}

function buildNetworkTierFinding(input: ParsedClaimInput): CandidateFinding[] {
  const networkTier = input.visit_context.network_tier
  if (networkTier !== "out_of_network") return []

  const estSavings = round2(input.claim_totals.total_patient_responsibility)

  return [
    {
      finding_id: makeId("finding"),
      rule_family: "network_tier_error",
      track: "plan_adjudication",
      line_item_refs: [],
      severity: estSavings >= 500 ? "medium" : "low",
      description: "Out-of-network billing context may require plan or network review.",
      plain_language_explanation:
        "This bill may involve an out-of-network issue that should be reviewed before payment.",
      evidence: [
        {
          evidence_type: "field_mismatch",
          field_path: "visit_context.network_tier",
          observed_value: networkTier,
          expected_value: "tier_1 / tier_2 / preferred when expected under plan context",
          note: "Out-of-network context increases billing risk and may require review.",
        },
      ],
      preliminary_confidence: 0.61,
      confidence_adjustment_factors: {
        rule_strength_adjustment: 0,
      },
      confidence_rationale:
        "Out-of-network context raises potential adjudication concerns, but additional confirmation may be needed.",
      estimated_savings: estSavings,
      recovery_probability_preliminary: 0.5,
      dispute_target: "payer",
      requires_truth_layer: true,
      truth_layer_question: "Did you expect this visit to be covered as in-network?",
      verification_priority: "high",
    },
  ]
}

function buildDenialFinding(input: ParsedClaimInput): CandidateFinding[] {
  if (input.claim_status !== "denied") return []

  const estSavings = round2(input.claim_totals.total_allowed_amount || input.claim_totals.total_billed_amount)

  return [
    {
      finding_id: makeId("finding"),
      rule_family: "denial_error",
      track: "plan_adjudication",
      line_item_refs: [],
      severity: estSavings >= 1000 ? "high" : "medium",
      description: "Denied claim requires adjudication review.",
      plain_language_explanation:
        "This bill appears to be tied to a denied claim and should be reviewed before payment.",
      evidence: [
        {
          evidence_type: "field_mismatch",
          field_path: "claim_status",
          observed_value: input.claim_status,
          expected_value: "paid or partially_paid when coverage should have applied",
          note: input.appeal_context.denial_reason_code
            ? `Denial reason code: ${input.appeal_context.denial_reason_code}`
            : "Claim denial detected.",
        },
      ],
      preliminary_confidence: 0.74,
      confidence_adjustment_factors: {
        rule_strength_adjustment: 0.05,
      },
      confidence_rationale:
        "Denied claims often need verification and possible appeal before the employee pays the provider bill.",
      estimated_savings: estSavings,
      recovery_probability_preliminary: 0.65,
      dispute_target: "payer",
      requires_truth_layer: false,
      truth_layer_question: null,
      verification_priority: "high",
    },
  ]
}

function buildMissingDataPenalty(input: ParsedClaimInput): number {
  let penalty = 0

  const missingPrimary = input.line_items.some(li => !li.primary_icd10)
  if (missingPrimary) penalty -= 0.08

  if (input.source_metadata.manual_review_required) penalty -= 0.1

  return penalty
}

function applyInputAdjustments(
  findings: CandidateFinding[],
  input: ParsedClaimInput
): CandidateFinding[] {
  const ocrConfidence = input.source_metadata.ocr_confidence
  const missingDataPenalty = buildMissingDataPenalty(input)

  return findings.map(finding => {
    let adjusted = finding.preliminary_confidence

    let ocrAdj = 0
    if (typeof ocrConfidence === "number") {
      if (ocrConfidence < 0.7) ocrAdj = -0.2
      else if (ocrConfidence < 0.85) ocrAdj = -0.08
    }

    adjusted += ocrAdj
    adjusted += missingDataPenalty
    adjusted = clamp(adjusted, 0, 0.98)

    return {
      ...finding,
      preliminary_confidence: adjusted,
      confidence_adjustment_factors: {
        ...finding.confidence_adjustment_factors,
        ocr_confidence_adjustment: ocrAdj,
        missing_data_penalty: missingDataPenalty,
      },
    }
  })
}

function computeBillHealthScore(
  findings: CandidateFinding[],
  shadowState: boolean
): number | null {
  if (shadowState) return null

  let score = 100

  for (const finding of findings) {
    if (finding.severity === "critical") score -= 35 * finding.preliminary_confidence
    if (finding.severity === "high") score -= 25 * finding.preliminary_confidence
    if (finding.severity === "medium") score -= 15 * finding.preliminary_confidence
    if (finding.severity === "low") score -= 5 * finding.preliminary_confidence
  }

  const totalSavings = findings.reduce((sum, f) => sum + f.estimated_savings, 0)
  if (totalSavings > 500) score -= 10

  return Math.round(clamp(score, 0, 100))
}

function deriveReasoningSummary(
  findings: CandidateFinding[],
  shadowState: boolean
): {
  preliminary_state: PreliminaryState
  payment_recommendation: PaymentRecommendation
  overall_rationale: string
} {
  if (shadowState) {
    return {
      preliminary_state: "shadow",
      payment_recommendation: "insufficient_data",
      overall_rationale:
        "We could not review this bill reliably because the document or extracted data was incomplete.",
    }
  }

  if (!findings.length) {
    return {
      preliminary_state: "clear",
      payment_recommendation: "safe_to_pay",
      overall_rationale:
        "We did not find any billing issues that currently require action on this bill.",
    }
  }

  const maxConfidence = maxNumber(findings.map(f => f.preliminary_confidence))
  const hasHighRisk = findings.some(
    f =>
      (f.severity === "high" || f.severity === "critical") &&
      f.preliminary_confidence >= 0.75 &&
      !f.requires_truth_layer
  )
  const hasReview = findings.some(
    f => f.preliminary_confidence >= 0.55 || f.requires_truth_layer
  )

  if (hasHighRisk) {
    return {
      preliminary_state: "high_risk",
      payment_recommendation: "do_not_pay_yet",
      overall_rationale:
        "We found a likely billing issue on this bill that should be reviewed or disputed before payment.",
    }
  }

  if (hasReview || maxConfidence >= 0.55) {
    return {
      preliminary_state: "review",
      payment_recommendation: "review_before_paying",
      overall_rationale:
        "We found possible billing concerns on this bill and recommend reviewing it before payment.",
    }
  }

  return {
    preliminary_state: "clear",
    payment_recommendation: "safe_to_pay",
    overall_rationale:
      "This bill appears low risk based on the information currently available.",
  }
}

function buildReasoningFlags(
  findings: CandidateFinding[],
  input: ParsedClaimInput
): ReasoningOutput["reasoning_flags"] {
  return {
    has_objective_error_candidates: findings.some(
      f => !f.requires_truth_layer && f.preliminary_confidence >= 0.75
    ),
    has_ambiguous_candidates: findings.some(f => f.requires_truth_layer),
    has_plan_adjudication_candidates: findings.some(f => f.track === "plan_adjudication"),
    has_provider_billing_candidates: findings.some(f => f.track === "billing_accuracy"),
    requires_truth_layer: findings.some(
      f => f.requires_truth_layer && f.preliminary_confidence >= 0.55
    ),
    low_confidence_source:
      typeof input.source_metadata.ocr_confidence === "number" &&
      input.source_metadata.ocr_confidence < 0.7,
  }
}

function deriveRoutingRecommendations(
  summary: ReasoningOutput["reasoning_summary"],
  flags: NonNullable<ReasoningOutput["reasoning_flags"]>,
  shadowState: boolean
): ReasoningOutput["routing_recommendations"] {
  if (shadowState) {
    return {
      next_step: "request_better_document",
      target_dispute_channel: "none",
      recommended_hold_request: false,
    }
  }

  if (summary.preliminary_state === "clear") {
    return {
      next_step: "close_as_clear",
      target_dispute_channel: "none",
      recommended_hold_request: false,
    }
  }

  if (flags.requires_truth_layer) {
    return {
      next_step: "send_to_truth_layer",
      target_dispute_channel: "email",
      recommended_hold_request: summary.payment_recommendation === "do_not_pay_yet",
    }
  }

  if (flags.has_objective_error_candidates) {
    return {
      next_step: "send_to_verification",
      target_dispute_channel: "email",
      recommended_hold_request: summary.payment_recommendation === "do_not_pay_yet",
    }
  }

  return {
    next_step: "manual_review",
    target_dispute_channel: "none",
    recommended_hold_request: false,
  }
}

function deriveShadowState(input: ParsedClaimInput): {
  shadow_state: boolean
  shadow_reason: string | null
  manual_review_reason: string | null
} {
  if (input.source_metadata.manual_review_required) {
    return {
      shadow_state: true,
      shadow_reason: "Input parser flagged this claim for manual review due to missing critical values or low OCR confidence.",
      manual_review_reason: "Intake quality insufficient for reliable reasoning.",
    }
  }

  if (!input.line_items.length) {
    return {
      shadow_state: true,
      shadow_reason: "No line items available for reasoning.",
      manual_review_reason: "No line items available.",
    }
  }

  if (input.claim_totals.validation_flag) {
    // Keep this as a finding, not full shadow, for MVP
    return {
      shadow_state: false,
      shadow_reason: null,
      manual_review_reason: null,
    }
  }

  return {
    shadow_state: false,
    shadow_reason: null,
    manual_review_reason: null,
  }
}

export function runReasoning(input: ParsedClaimInput): ReasoningOutput {
  const errorHandling = deriveShadowState(input)

  let findings: CandidateFinding[] = []

  if (!errorHandling.shadow_state) {
    findings = [
      ...buildDuplicateFindings(input),
      ...buildArithmeticFinding(input),
      ...buildAmountOutlierFindings(input),
      ...buildNetworkTierFinding(input),
      ...buildDenialFinding(input),
    ]

    findings = applyInputAdjustments(findings, input)
  }

  const routingInference = deriveRoute(input, findings)
  const reasoningSummary = deriveReasoningSummary(findings, errorHandling.shadow_state)
  const totalCandidateFindings = findings.length
  const totalCandidateSavings = round2(
    findings.reduce((sum, finding) => sum + finding.estimated_savings, 0)
  )
  const preliminaryBillHealthScore = computeBillHealthScore(
    findings,
    errorHandling.shadow_state
  )
  const reasoningFlags = buildReasoningFlags(findings, input)
  const routingRecommendations = deriveRoutingRecommendations(
    reasoningSummary,
    reasoningFlags!,
    errorHandling.shadow_state
  )

  return {
    schema_version: "1.2",
    source_schema_version: "2.2",

    analysis_id: makeId("analysis"),
    claim_id: input.claim_id,
    analyzed_at: nowIso(),

    engine_metadata: {
      engine_name: "xilo-reasoning-v1",
      engine_version: "1.2-mvp",
      rule_library_version: "1.2-mvp",
      analysis_mode: deriveAnalysisMode(input),
    },

    routing_inference: routingInference,

    reasoning_summary: reasoningSummary,

    candidate_findings: findings,
    total_candidate_findings: totalCandidateFindings,
    total_candidate_savings: totalCandidateSavings,
    preliminary_bill_health_score: preliminaryBillHealthScore,

    reasoning_flags: reasoningFlags,

    routing_recommendations: routingRecommendations,

    error_handling: errorHandling,
  }
}
