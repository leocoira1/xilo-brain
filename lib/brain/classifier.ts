import { getConfidenceThreshold } from "../confidenceThreshold";

export type FinalClassification = "red" | "yellow" | "green" | "shadow";
export type BillHealthState = "green" | "amber" | "red" | "shadow";
export type PaymentRecommendationFinal =
  | "safe_to_pay"
  | "review_before_paying"
  | "do_not_pay_yet"
  | "insufficient_data";

export type EmployeeAppStatus =
  | "safe_to_pay"
  | "review_before_paying"
  | "do_not_pay_yet";

export type SeverityFinal = "low" | "medium" | "high" | "critical";
export type Track = "billing_accuracy" | "plan_adjudication";

export type DisputeTargetFinal = "provider" | "payer" | "dual" | "none";

export type DisputeStatus =
  | "not_needed"
  | "ready"
  | "pending_truth_layer"
  | "manual_review_required"
  | "blocked"
  | "shadow";

export type TruthLayerStatus =
  | "not_required"
  | "eligible"
  | "queued"
  | "sent"
  | "responded_yes"
  | "responded_no"
  | "responded_unsure"
  | "expired"
  | "manual_review";

export type NextStep =
  | "dispatch_dispute"
  | "send_truth_layer"
  | "manual_review"
  | "close_as_clear"
  | "shadow_hold";

export type RecommendedDisputeChannel = "email" | "portal" | "fax" | "none";

export interface CandidateFindingForClassification {
  finding_id: string;
  review_id?: string;
  rule_family: string;
  track?: Track;
  line_item_refs?: string[];

  estimated_savings?: number | null;
  final_confidence?: number | null;
  severity_final?: SeverityFinal | null;
  requires_truth_layer_final?: boolean | null;
  agreement_status?: "confirmed" | "rejected" | "insufficient_evidence" | null;
  shadow_candidate?: boolean | null;
  critical_fields_missing?: boolean | null;

  dispute_target_final?: DisputeTargetFinal | null;
  duplicate_dispute_in_progress?: boolean | null;
  collections_risk_flag?: boolean | null;
  patient_paid_amount?: number | null;
  plain_language_explanation?: string | null;
}

export interface ClassificationEngineInput {
  claim_id: string;
  analysis_id: string;
  verification_id: string;
  findings: CandidateFindingForClassification[];
  inherited_shadow_state?: boolean;
  inherited_shadow_reason?: string | null;
}

export interface ClassifiedFinding {
  classified_finding_id: string;
  review_id: string;
  finding_id: string;
  rule_family: string;
  track: Track;
  line_item_refs: string[];

  final_classification: FinalClassification;
  final_confidence: number;
  classification_reason: string;
  severity_final: SeverityFinal | null;

  estimated_savings_final: number;
  recovery_probability_final: number | null;

  dispute_target_final: DisputeTargetFinal;
  dispute_status: DisputeStatus;
  hold_request_required: boolean;
  collections_risk_flag: boolean;

  requires_truth_layer_final: boolean;
  truth_layer_status: TruthLayerStatus;

  employee_refund_eligible: boolean;
  participation_reward_eligible: boolean;
  plain_language_explanation_final: string;
}

export interface ClassificationOutput {
  schema_version: "1.1";
  classification_id: string;
  verification_id: string;
  analysis_id: string;
  claim_id: string;
  classified_at: string;
  total_final_savings: number;

  engine_metadata: {
    engine_name: string;
    engine_version?: string;
    classification_rules_version?: string;
  };

  claim_classification_summary: {
    final_bill_health_score: number | null;
    bill_health_state: BillHealthState;
    primary_classification: FinalClassification;
    payment_recommendation_final: PaymentRecommendationFinal;
    employee_app_status: EmployeeAppStatus;
    overall_rationale: string;
  };

  classified_findings: ClassifiedFinding[];

  classification_counts: {
    red_count: number;
    yellow_count: number;
    green_count: number;
    shadow_count: number;
  };

  aggregate_outputs: {
    total_red_savings: number;
    total_yellow_savings: number;
    total_green_savings: number;
    dispute_ready_count: number;
    truth_layer_required_count: number;
    manual_review_count: number;
  };

  routing_recommendations: {
    next_step: NextStep;
    employee_notification_recommended: boolean;
    employer_dashboard_publish: boolean;
    recommended_dispute_channel: RecommendedDisputeChannel;
  };

  error_handling: {
    shadow_state: boolean;
    shadow_reason: string | null;
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function safeNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function deriveTrack(value?: Track | null): Track {
  return value ?? "billing_accuracy";
}

function deriveDisputeTarget(
  ruleFamily: string,
  provided?: DisputeTargetFinal | null
): DisputeTargetFinal {
  if (provided) return provided;

  const rf = ruleFamily.toLowerCase();

  if (
    rf.includes("network") ||
    rf.includes("authorization") ||
    rf.includes("adjudication")
  ) {
    return "payer";
  }

  if (
    rf.includes("duplicate") ||
    rf.includes("pricing") ||
    rf.includes("coding") ||
    rf.includes("upcoding")
  ) {
    return "provider";
  }

  return "provider";
}

function normalizeConfidence(value?: number | null): number {
  const n = safeNumber(value, 0);
  return clamp(n, 0, 0.98);
}

function classifyFinding(
  input: CandidateFindingForClassification
): ClassifiedFinding {
  const estimatedSavings = Math.max(0, safeNumber(input.estimated_savings, 0));
  const confidence = normalizeConfidence(input.final_confidence);
  const severity = input.severity_final ?? null;
  const requiresTruthLayer = Boolean(input.requires_truth_layer_final);
  const agreementStatus = input.agreement_status ?? "confirmed";
  const shadowCandidate = Boolean(input.shadow_candidate);
  const criticalFieldsMissing = Boolean(input.critical_fields_missing);
  const duplicateDisputeInProgress = Boolean(
    input.duplicate_dispute_in_progress
  );
  const collectionsRiskFlag = Boolean(input.collections_risk_flag);
  const patientPaidAmount = safeNumber(input.patient_paid_amount, 0);

  let finalClassification: FinalClassification = "green";
  let disputeStatus: DisputeStatus = "not_needed";
  let truthLayerStatus: TruthLayerStatus = "not_required";
  let classificationReason = "Finding cleared.";
  let recoveryProbabilityFinal: number | null = null;

  if (shadowCandidate || criticalFieldsMissing) {
    finalClassification = "shadow";
    disputeStatus = "shadow";
    truthLayerStatus = "manual_review";
    classificationReason =
      "Critical evidence missing or finding marked as shadow candidate.";
  } else if (
    agreementStatus === "rejected" ||
    agreementStatus === "insufficient_evidence"
  ) {
    finalClassification = "green";
    disputeStatus = "not_needed";
    truthLayerStatus = "not_required";
    classificationReason = "Finding was reviewed and cleared.";
  } else {
    const dynamicThreshold = getConfidenceThreshold(estimatedSavings);
    const mediumThreshold = dynamicThreshold - 0.2;

    if (requiresTruthLayer) {
      finalClassification = "yellow";
      disputeStatus = "pending_truth_layer";
      truthLayerStatus = "eligible";
      classificationReason =
        "Requires employee confirmation before dispute.";
    } else if (
      confidence >= dynamicThreshold &&
      (severity === "high" || severity === "critical")
    ) {
      finalClassification = "red";
      disputeStatus = duplicateDisputeInProgress ? "blocked" : "ready";
      truthLayerStatus = "not_required";
      classificationReason = duplicateDisputeInProgress
        ? "High-confidence error, but an existing dispute is already in progress."
        : "High-confidence error ready for dispute.";
    } else if (
      (confidence >= mediumThreshold && confidence < dynamicThreshold) ||
      severity === "medium"
    ) {
      finalClassification = "yellow";
      disputeStatus = "manual_review_required";
      truthLayerStatus = "manual_review";
      classificationReason =
        "Medium-confidence finding requires review before action.";
    } else {
      finalClassification = "green";
      disputeStatus = "not_needed";
      truthLayerStatus = "not_required";
      classificationReason =
        "Confidence too low for action; finding cleared for MVP.";
    }
  }

  if (finalClassification === "red") {
    recoveryProbabilityFinal = clamp(confidence, 0, 1);
  } else if (finalClassification === "yellow") {
    recoveryProbabilityFinal = clamp(confidence * 0.8, 0, 1);
  } else {
    recoveryProbabilityFinal = 0;
  }

  const disputeTarget =
    finalClassification === "green" || finalClassification === "shadow"
      ? "none"
      : deriveDisputeTarget(input.rule_family, input.dispute_target_final);

  const holdRequestRequired = finalClassification === "red";
  const employeeRefundEligible = patientPaidAmount > 0;
  const participationRewardEligible = false;

  const plainLanguageExplanationFinal =
    input.plain_language_explanation?.trim() ||
    buildPlainLanguageExplanation(
      finalClassification,
      input.rule_family,
      estimatedSavings
    );

  return {
    classified_finding_id: makeId("classified_finding"),
    review_id: input.review_id ?? makeId("review"),
    finding_id: input.finding_id,
    rule_family: input.rule_family,
    track: deriveTrack(input.track),
    line_item_refs: input.line_item_refs ?? [],

    final_classification: finalClassification,
    final_confidence: confidence,
    classification_reason: classificationReason,
    severity_final: severity,

    estimated_savings_final: estimatedSavings,
    recovery_probability_final: recoveryProbabilityFinal,

    dispute_target_final: disputeTarget,
    dispute_status: disputeStatus,
    hold_request_required: holdRequestRequired,
    collections_risk_flag: collectionsRiskFlag,

    requires_truth_layer_final: requiresTruthLayer,
    truth_layer_status: truthLayerStatus,

    employee_refund_eligible: employeeRefundEligible,
    participation_reward_eligible: participationRewardEligible,
    plain_language_explanation_final: plainLanguageExplanationFinal,
  };
}

function buildPlainLanguageExplanation(
  finalClassification: FinalClassification,
  ruleFamily: string,
  estimatedSavings: number
): string {
  const issue = ruleFamily.replace(/_/g, " ");

  if (finalClassification === "red") {
    return `We found a likely ${issue} issue on this bill. Do not pay yet while we prepare a correction request. Estimated savings: $${estimatedSavings.toFixed(
      2
    )}.`;
  }

  if (finalClassification === "yellow") {
    return `We found a possible ${issue} issue on this bill. Please review before paying while we confirm next steps. Estimated savings: $${estimatedSavings.toFixed(
      2
    )}.`;
  }

  if (finalClassification === "shadow") {
    return `We need a better document or more information before we can classify this bill reliably.`;
  }

  return `This bill appears safe to pay based on the information available.`;
}

function derivePrimaryClassification(
  findings: ClassifiedFinding[],
  shadowState: boolean
): FinalClassification {
  if (shadowState) return "shadow";
  if (findings.some((f) => f.final_classification === "red")) return "red";
  if (findings.some((f) => f.final_classification === "yellow")) return "yellow";
  if (findings.some((f) => f.final_classification === "green")) return "green";
  return "shadow";
}

function mapBillHealthState(primary: FinalClassification): BillHealthState {
  if (primary === "red") return "red";
  if (primary === "yellow") return "amber";
  if (primary === "green") return "green";
  return "shadow";
}

function mapPaymentRecommendation(
  primary: FinalClassification
): PaymentRecommendationFinal {
  if (primary === "red") return "do_not_pay_yet";
  if (primary === "yellow") return "review_before_paying";
  if (primary === "green") return "safe_to_pay";
  return "insufficient_data";
}

function mapEmployeeAppStatus(primary: FinalClassification): EmployeeAppStatus {
  if (primary === "red") return "do_not_pay_yet";
  if (primary === "yellow") return "review_before_paying";
  return "safe_to_pay";
}

function computeBillHealthScore(
  findings: ClassifiedFinding[],
  shadowState: boolean
): number | null {
  if (shadowState) return null;
  if (!findings.length) return 100;

  let score = 100;

  for (const finding of findings) {
    if (finding.final_classification === "red") {
      score -= 30;
    } else if (finding.final_classification === "yellow") {
      score -= 15;
    } else if (finding.final_classification === "shadow") {
      score -= 20;
    }
  }

  return clamp(score, 0, 100);
}

function buildOverallRationale(
  primary: FinalClassification,
  redCount: number,
  yellowCount: number,
  shadowState: boolean
): string {
  if (shadowState) {
    return "We need a better document or more information before we can classify this bill reliably.";
  }

  if (primary === "red") {
    return `We found ${redCount} confirmed billing issue${
      redCount === 1 ? "" : "s"
    } on this bill. Do not pay yet while XILO prepares corrective action.`;
  }

  if (primary === "yellow") {
    return `We found ${yellowCount} bill issue${
      yellowCount === 1 ? "" : "s"
    } that need confirmation or review before payment.`;
  }

  return "This bill appears safe to pay based on the information currently available.";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function classifyClaim(
  input: ClassificationEngineInput
): ClassificationOutput {
  const shadowState = Boolean(input.inherited_shadow_state);

  let classifiedFindings: ClassifiedFinding[] = [];

  if (!shadowState) {
    classifiedFindings = input.findings.map(classifyFinding);
  }

  const redCount = classifiedFindings.filter(
    (f) => f.final_classification === "red"
  ).length;
  const yellowCount = classifiedFindings.filter(
    (f) => f.final_classification === "yellow"
  ).length;
  const greenCount = classifiedFindings.filter(
    (f) => f.final_classification === "green"
  ).length;
  const shadowCount = shadowState
    ? input.findings.length || 1
    : classifiedFindings.filter((f) => f.final_classification === "shadow")
        .length;

  const totalRedSavings = round2(
    classifiedFindings
      .filter(
        (f) =>
          f.final_classification === "red" && f.dispute_status === "ready"
      )
      .reduce((sum, f) => sum + f.estimated_savings_final, 0)
  );

  const totalYellowSavings = round2(
    classifiedFindings
      .filter((f) => f.final_classification === "yellow")
      .reduce((sum, f) => sum + f.estimated_savings_final, 0)
  );

  const totalGreenSavings = round2(
    classifiedFindings
      .filter((f) => f.final_classification === "green")
      .reduce((sum, f) => sum + f.estimated_savings_final, 0)
  );

  const totalFinalSavings = round2(
    classifiedFindings
      .filter(
        (f) =>
          f.final_classification === "red" ||
          f.final_classification === "yellow"
      )
      .reduce((sum, f) => sum + f.estimated_savings_final, 0)
  );

  const disputeReadyCount = classifiedFindings.filter(
    (f) => f.dispute_status === "ready"
  ).length;
  const truthLayerRequiredCount = classifiedFindings.filter(
    (f) =>
      f.truth_layer_status === "eligible" || f.truth_layer_status === "queued"
  ).length;
  const manualReviewCount = classifiedFindings.filter(
    (f) =>
      f.dispute_status === "manual_review_required" ||
      f.dispute_status === "shadow"
  ).length;

  const primaryClassification = derivePrimaryClassification(
    classifiedFindings,
    shadowState
  );
  const billHealthState = mapBillHealthState(primaryClassification);
  const paymentRecommendationFinal =
    mapPaymentRecommendation(primaryClassification);
  const employeeAppStatus = mapEmployeeAppStatus(primaryClassification);
  const finalBillHealthScore = computeBillHealthScore(
    classifiedFindings,
    shadowState
  );

  let nextStep: NextStep = "close_as_clear";
  if (shadowState) {
    nextStep = "shadow_hold";
  } else if (disputeReadyCount > 0) {
    nextStep = "dispatch_dispute";
  } else if (truthLayerRequiredCount > 0) {
    nextStep = "send_truth_layer";
  } else if (manualReviewCount > 0) {
    nextStep = "manual_review";
  }

  const employeeNotificationRecommended =
    paymentRecommendationFinal === "do_not_pay_yet";

  const employerDashboardPublish =
    !shadowState && (redCount > 0 || yellowCount > 0);

  const output: ClassificationOutput = {
    schema_version: "1.1",
    classification_id: makeId("classification"),
    verification_id: input.verification_id,
    analysis_id: input.analysis_id,
    claim_id: input.claim_id,
    classified_at: nowIso(),
    total_final_savings: totalFinalSavings,

    engine_metadata: {
      engine_name: "xilo-classification-v1",
      engine_version: "1.1",
      classification_rules_version: "1.1-mvp",
    },

    claim_classification_summary: {
      final_bill_health_score: finalBillHealthScore,
      bill_health_state: billHealthState,
      primary_classification: primaryClassification,
      payment_recommendation_final: paymentRecommendationFinal,
      employee_app_status: employeeAppStatus,
      overall_rationale: buildOverallRationale(
        primaryClassification,
        redCount,
        yellowCount,
        shadowState
      ),
    },

    classified_findings: classifiedFindings,

    classification_counts: {
      red_count: redCount,
      yellow_count: yellowCount,
      green_count: greenCount,
      shadow_count: shadowCount,
    },

    aggregate_outputs: {
      total_red_savings: totalRedSavings,
      total_yellow_savings: totalYellowSavings,
      total_green_savings: totalGreenSavings,
      dispute_ready_count: disputeReadyCount,
      truth_layer_required_count: truthLayerRequiredCount,
      manual_review_count: manualReviewCount,
    },

    routing_recommendations: {
      next_step: nextStep,
      employee_notification_recommended: employeeNotificationRecommended,
      employer_dashboard_publish: employerDashboardPublish,
      recommended_dispute_channel: disputeReadyCount > 0 ? "email" : "none",
    },

    error_handling: {
      shadow_state: shadowState,
      shadow_reason: shadowState
        ? input.inherited_shadow_reason ??
          "Inherited shadow state from upstream verification."
        : null,
    },
  };

  const totalCount =
    output.classification_counts.red_count +
    output.classification_counts.yellow_count +
    output.classification_counts.green_count +
    output.classification_counts.shadow_count;

  const expectedLength = shadowState
    ? Math.max(input.findings.length, 1)
    : output.classified_findings.length;

  if (totalCount !== expectedLength) {
    throw new Error("Classification count mismatch.");
  }

  for (const finding of output.classified_findings) {
    if (
      finding.employee_refund_eligible &&
      finding.participation_reward_eligible
    ) {
      throw new Error(
        "A finding cannot have both refund and reward eligibility."
      );
    }

    if (
      finding.requires_truth_layer_final &&
      finding.dispute_status !== "pending_truth_layer"
    ) {
      throw new Error(
        "Truth-layer-required finding must have dispute_status = 'pending_truth_layer'."
      );
    }
  }

  return output;
}
