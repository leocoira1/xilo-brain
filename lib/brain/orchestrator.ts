import { parseClaimInput, type RawClaimInput, type ParseResult } from "./inputParser"
import { runReasoning, type ReasoningOutput } from "./reasoning"
import { classifyClaim, type ClassificationOutput } from "./classifier"

type WorkflowType =
  | "employee_bill_review"
  | "claims_audit_batch"
  | "manual_review_case"
  | "hybrid_case"

type WorkflowStatus =
  | "created"
  | "ingestion_in_progress"
  | "reasoning_in_progress"
  | "classification_in_progress"
  | "truth_layer_pending"
  | "dispute_in_progress"
  | "savings_pending"
  | "reporting_pending"
  | "completed"
  | "partially_completed"
  | "manual_review_required"
  | "failed"
  | "shadow"

type PrimaryPath =
  | "clear_claim_path"
  | "truth_layer_path"
  | "dispute_path"
  | "manual_review_path"
  | "shadow_path"

type HumanTouchpointType =
  | "manual_review"
  | "classification_override"
  | "truth_layer_override"
  | "dispute_approval"
  | "support_intervention"
  | "financial_override"
  | "reporting_override"

type ActorRole =
  | "operations_reviewer"
  | "support_agent"
  | "finance_reviewer"
  | "compliance_reviewer"
  | "admin_user"

interface HumanTouchpoint {
  touchpoint_id: string
  touchpoint_type: HumanTouchpointType
  actor_role: ActorRole
  timestamp: string
  note: string | null
}

interface WorkflowStepState {
  status: "pending" | "running" | "completed" | "failed" | "skipped" | "not_required"
  started_at: string | null
  completed_at: string | null
  note?: string | null
}

interface StepExecution {
  input_ingestion_step: WorkflowStepState
  reasoning_step: WorkflowStepState
  classification_step: WorkflowStepState
  truth_layer_step: WorkflowStepState
  dispute_step: WorkflowStepState
  savings_step: WorkflowStepState
  employer_reporting_step: WorkflowStepState
}

interface PerformanceMetrics {
  ingestion_duration_ms: number | null
  reasoning_duration_ms: number | null
  classification_duration_ms: number | null
  truth_layer_send_to_response_ms: number | null
  dispute_generation_duration_ms: number | null
  savings_validation_duration_ms: number | null
  reporting_duration_ms: number | null
  end_to_end_duration_ms: number | null
}

interface OrchestratorOptions {
  workflow_type?: WorkflowType
  employee_id?: string | null
  employer_id?: string | null
  duplicate_dispute_in_progress?: boolean
  actor_role_for_manual_actions?: ActorRole
}

interface MVPDisputeRecord {
  dispute_required: boolean
  dispute_mode: "manual_email" | "not_required"
  dispute_status: "not_started" | "ready_for_founder" | "pending_truth_layer" | "not_required"
  note: string
}

interface MVPSavingsPreview {
  total_red_savings: number
  total_yellow_savings: number
  xilo_fee_estimated_on_red: number
  employer_benefit_estimated_before_fee: number
  note: string
}

interface MVPReportingSnapshot {
  dashboard_publish: boolean
  potential_savings: number
  claims_flagged: number
  red_count: number
  yellow_count: number
  green_count: number
  shadow_count: number
}

export interface MVPWorkflowResult {
  schema_version: "1.2-mvp"
  workflow_id: string
  workflow_type: WorkflowType
  claim_id: string | null
  employee_id: string | null
  employer_id: string | null

  workflow_created_at: string
  workflow_updated_at: string
  workflow_status: WorkflowStatus

  workflow_summary: {
    primary_path: PrimaryPath
    final_payment_recommendation:
      | "safe_to_pay"
      | "review_before_paying"
      | "do_not_pay_yet"
      | "insufficient_data"
      | null
    final_primary_classification: "red" | "yellow" | "green" | "shadow" | null
    total_estimated_savings: number | null
    total_verified_savings: number | null
    workflow_summary_narrative: string | null
  }

  step_execution: StepExecution
  performance_metrics: PerformanceMetrics
  decision_gates: {
    truth_layer_gate_triggered: boolean
    dispute_gate_triggered: boolean
    manual_review_gate_triggered: boolean
    shadow_gate_triggered: boolean
  }

  human_touchpoints: HumanTouchpoint[]
  retry_and_recovery: {
    retry_count: number
    last_retry_at: string | null
    recovery_mode:
      | "none"
      | "retry_same_step"
      | "fallback_model"
      | "manual_review_fallback"
      | "shadow_close"
  }

  error_handling: {
    partial_failure: boolean
    failure_step: string | null
    error_reason: string | null
  }

  parse_result: ParseResult
  reasoning_output: ReasoningOutput | null
  classification_output: ClassificationOutput | null

  mvp_dispute_record: MVPDisputeRecord
  mvp_savings_preview: MVPSavingsPreview
  mvp_reporting_snapshot: MVPReportingSnapshot
}

function nowIso(): string {
  return new Date().toISOString()
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function elapsedMs(start: number | null, end: number | null): number | null {
  if (start === null || end === null) return null
  return Math.max(0, end - start)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function makeStepState(): WorkflowStepState {
  return {
    status: "pending",
    started_at: null,
    completed_at: null,
    note: null,
  }
}

function buildWorkflowNarrative(
  workflowStatus: WorkflowStatus,
  primaryPath: PrimaryPath,
  classificationOutput: ClassificationOutput | null
): string {
  if (!classificationOutput) {
    if (workflowStatus === "shadow") {
      return "The bill could not be processed reliably and requires a better document or manual review."
    }
    if (workflowStatus === "failed") {
      return "The workflow failed before classification could complete."
    }
    return "The workflow is still in progress."
  }

  const summary = classificationOutput.claim_classification_summary

  if (primaryPath === "dispute_path") {
    return `XILO identified an actionable billing issue. Payment recommendation: ${summary.payment_recommendation_final}.`
  }

  if (primaryPath === "truth_layer_path") {
    return `XILO identified a bill issue that requires employee confirmation before next action.`
  }

  if (primaryPath === "manual_review_path") {
    return `XILO identified a bill issue that requires manual review before action.`
  }

  if (primaryPath === "shadow_path") {
    return `XILO could not classify this bill reliably and needs a better document or manual review.`
  }

  return `XILO did not find an actionable bill issue requiring further action at this stage.`
}

function mapReasoningToClassifierInput(
  reasoningOutput: ReasoningOutput,
  duplicateDisputeInProgress: boolean
) {
  return {
    claim_id: reasoningOutput.claim_id,
    analysis_id: reasoningOutput.analysis_id,
    verification_id: `mvp_verification_${reasoningOutput.analysis_id}`,
    inherited_shadow_state: reasoningOutput.error_handling.shadow_state,
    inherited_shadow_reason: reasoningOutput.error_handling.shadow_reason,
    findings: reasoningOutput.candidate_findings.map((finding) => ({
      finding_id: finding.finding_id,
      review_id: `mvp_review_${finding.finding_id}`,
      rule_family: finding.rule_family,
      track: finding.track,
      line_item_refs: finding.line_item_refs,

      estimated_savings: finding.estimated_savings,
      final_confidence: finding.preliminary_confidence,
      severity_final: finding.severity,
      requires_truth_layer_final: finding.requires_truth_layer,
      agreement_status: "confirmed" as const,
      shadow_candidate: false,
      critical_fields_missing: false,

      dispute_target_final: finding.dispute_target,
      duplicate_dispute_in_progress: duplicateDisputeInProgress,
      collections_risk_flag: false,
      patient_paid_amount: null,
      plain_language_explanation: finding.plain_language_explanation,
    })),
  }
}

function derivePrimaryPath(
  workflowStatus: WorkflowStatus,
  classificationOutput: ClassificationOutput | null
): PrimaryPath {
  if (workflowStatus === "shadow") return "shadow_path"
  if (!classificationOutput) return "manual_review_path"

  const nextStep = classificationOutput.routing_recommendations.next_step

  if (nextStep === "dispatch_dispute") return "dispute_path"
  if (nextStep === "send_truth_layer") return "truth_layer_path"
  if (nextStep === "manual_review") return "manual_review_path"
  if (nextStep === "shadow_hold") return "shadow_path"
  return "clear_claim_path"
}

function buildDisputeRecord(
  classificationOutput: ClassificationOutput | null
): MVPDisputeRecord {
  if (!classificationOutput) {
    return {
      dispute_required: false,
      dispute_mode: "not_required",
      dispute_status: "not_required",
      note: "No classification output available.",
    }
  }

  const disputeReady = classificationOutput.aggregate_outputs.dispute_ready_count > 0
  const truthPending = classificationOutput.aggregate_outputs.truth_layer_required_count > 0

  if (truthPending && !disputeReady) {
    return {
      dispute_required: false,
      dispute_mode: "not_required",
      dispute_status: "pending_truth_layer",
      note: "Dispute is deferred until Truth Layer confirmation is complete.",
    }
  }

  if (disputeReady) {
    return {
      dispute_required: true,
      dispute_mode: "manual_email",
      dispute_status: "ready_for_founder",
      note: "Founder will manually send initial disputes via email and log outcomes until the Dispute Engine is automated.",
    }
  }

  return {
    dispute_required: false,
    dispute_mode: "not_required",
    dispute_status: "not_required",
    note: "No dispute is currently required.",
  }
}

function buildSavingsPreview(
  classificationOutput: ClassificationOutput | null
): MVPSavingsPreview {
  if (!classificationOutput) {
    return {
      total_red_savings: 0,
      total_yellow_savings: 0,
      xilo_fee_estimated_on_red: 0,
      employer_benefit_estimated_before_fee: 0,
      note: "No classification output available for savings preview.",
    }
  }

  const totalRed = classificationOutput.aggregate_outputs.total_red_savings
  const totalYellow = classificationOutput.aggregate_outputs.total_yellow_savings

  return {
    total_red_savings: totalRed,
    total_yellow_savings: totalYellow,
    xilo_fee_estimated_on_red: round2(totalRed * 0.3),
    employer_benefit_estimated_before_fee: round2(totalRed),
    note: "MVP preview only. Final verified savings and fee calculation occur after dispute outcome and savings validation.",
  }
}

function buildReportingSnapshot(
  classificationOutput: ClassificationOutput | null
): MVPReportingSnapshot {
  if (!classificationOutput) {
    return {
      dashboard_publish: false,
      potential_savings: 0,
      claims_flagged: 0,
      red_count: 0,
      yellow_count: 0,
      green_count: 0,
      shadow_count: 0,
    }
  }

  const counts = classificationOutput.classification_counts

  return {
    dashboard_publish: classificationOutput.routing_recommendations.employer_dashboard_publish,
    potential_savings: classificationOutput.total_final_savings,
    claims_flagged: counts.red_count + counts.yellow_count,
    red_count: counts.red_count,
    yellow_count: counts.yellow_count,
    green_count: counts.green_count,
    shadow_count: counts.shadow_count,
  }
}

export function runXiloMVPWorkflow(
  rawInput: RawClaimInput,
  options: OrchestratorOptions = {}
): MVPWorkflowResult {
  const workflowCreatedAt = nowIso()
  const workflowId = makeId("workflow")

  const stepExecution: StepExecution = {
    input_ingestion_step: makeStepState(),
    reasoning_step: makeStepState(),
    classification_step: makeStepState(),
    truth_layer_step: makeStepState(),
    dispute_step: makeStepState(),
    savings_step: makeStepState(),
    employer_reporting_step: makeStepState(),
  }

  const performanceMetrics: PerformanceMetrics = {
    ingestion_duration_ms: null,
    reasoning_duration_ms: null,
    classification_duration_ms: null,
    truth_layer_send_to_response_ms: null,
    dispute_generation_duration_ms: null,
    savings_validation_duration_ms: null,
    reporting_duration_ms: null,
    end_to_end_duration_ms: null,
  }

  const humanTouchpoints: HumanTouchpoint[] = []

  let workflowStatus: WorkflowStatus = "created"
  let parseResult: ParseResult
  let reasoningOutput: ReasoningOutput | null = null
  let classificationOutput: ClassificationOutput | null = null

  let failureStep: string | null = null
  let errorReason: string | null = null
  let partialFailure = false

  const overallStart = Date.now()

  try {
    // STEP 1: INGESTION / PARSING
    workflowStatus = "ingestion_in_progress"
    stepExecution.input_ingestion_step.status = "running"
    stepExecution.input_ingestion_step.started_at = nowIso()
    const ingestStart = Date.now()

    parseResult = parseClaimInput(rawInput)

    stepExecution.input_ingestion_step.completed_at = nowIso()
    stepExecution.input_ingestion_step.status = parseResult.errors.length ? "failed" : "completed"
    stepExecution.input_ingestion_step.note =
      parseResult.warnings.length > 0 ? parseResult.warnings.join(" | ") : null
    performanceMetrics.ingestion_duration_ms = elapsedMs(ingestStart, Date.now())

    if (parseResult.errors.length > 0) {
      workflowStatus = "failed"
      failureStep = "input_ingestion_step"
      errorReason = parseResult.errors.join(" | ")

      return {
        schema_version: "1.2-mvp",
        workflow_id: workflowId,
        workflow_type: options.workflow_type ?? "employee_bill_review",
        claim_id: null,
        employee_id: options.employee_id ?? null,
        employer_id: options.employer_id ?? null,
        workflow_created_at: workflowCreatedAt,
        workflow_updated_at: nowIso(),
        workflow_status: workflowStatus,
        workflow_summary: {
          primary_path: "manual_review_path",
          final_payment_recommendation: null,
          final_primary_classification: null,
          total_estimated_savings: null,
          total_verified_savings: null,
          workflow_summary_narrative: "Input parsing failed before the workflow could continue.",
        },
        step_execution: stepExecution,
        performance_metrics: {
          ...performanceMetrics,
          end_to_end_duration_ms: elapsedMs(overallStart, Date.now()),
        },
        decision_gates: {
          truth_layer_gate_triggered: false,
          dispute_gate_triggered: false,
          manual_review_gate_triggered: true,
          shadow_gate_triggered: false,
        },
        human_touchpoints: [
          {
            touchpoint_id: makeId("touchpoint"),
            touchpoint_type: "manual_review",
            actor_role: options.actor_role_for_manual_actions ?? "operations_reviewer",
            timestamp: nowIso(),
            note: "Input parsing failed and requires manual review.",
          },
        ],
        retry_and_recovery: {
          retry_count: 0,
          last_retry_at: null,
          recovery_mode: "manual_review_fallback",
        },
        error_handling: {
          partial_failure: false,
          failure_step: failureStep,
          error_reason: errorReason,
        },
        parse_result: parseResult,
        reasoning_output: null,
        classification_output: null,
        mvp_dispute_record: {
          dispute_required: false,
          dispute_mode: "not_required",
          dispute_status: "not_required",
          note: "Workflow stopped before dispute evaluation.",
        },
        mvp_savings_preview: {
          total_red_savings: 0,
          total_yellow_savings: 0,
          xilo_fee_estimated_on_red: 0,
          employer_benefit_estimated_before_fee: 0,
          note: "Workflow stopped before savings preview.",
        },
        mvp_reporting_snapshot: {
          dashboard_publish: false,
          potential_savings: 0,
          claims_flagged: 0,
          red_count: 0,
          yellow_count: 0,
          green_count: 0,
          shadow_count: 0,
        },
      }
    }

    // STEP 2: REASONING
    workflowStatus = "reasoning_in_progress"
    stepExecution.reasoning_step.status = "running"
    stepExecution.reasoning_step.started_at = nowIso()
    const reasoningStart = Date.now()

    reasoningOutput = runReasoning(parseResult.parsed)

    stepExecution.reasoning_step.completed_at = nowIso()
    stepExecution.reasoning_step.status = "completed"
    performanceMetrics.reasoning_duration_ms = elapsedMs(reasoningStart, Date.now())

    // STEP 3: CLASSIFICATION
    workflowStatus = "classification_in_progress"
    stepExecution.classification_step.status = "running"
    stepExecution.classification_step.started_at = nowIso()
    const classificationStart = Date.now()

    classificationOutput = classifyClaim(
      mapReasoningToClassifierInput(
        reasoningOutput,
        options.duplicate_dispute_in_progress ?? false
      )
    )

    stepExecution.classification_step.completed_at = nowIso()
    stepExecution.classification_step.status = "completed"
    performanceMetrics.classification_duration_ms = elapsedMs(classificationStart, Date.now())

    // STEP 4: TRUTH LAYER (OPTIONAL / MVP THIN)
    const truthNeeded =
      classificationOutput.aggregate_outputs.truth_layer_required_count > 0

    if (truthNeeded) {
      workflowStatus = "truth_layer_pending"
      stepExecution.truth_layer_step.status = "running"
      stepExecution.truth_layer_step.started_at = nowIso()
      stepExecution.truth_layer_step.completed_at = nowIso()
      stepExecution.truth_layer_step.status = "completed"
      stepExecution.truth_layer_step.note =
        "Truth Layer required. MVP uses thin email/SMS-first employee confirmation flow."
    } else {
      stepExecution.truth_layer_step.status = "not_required"
      stepExecution.truth_layer_step.started_at = nowIso()
      stepExecution.truth_layer_step.completed_at = nowIso()
    }

    // STEP 5: DISPUTE (MVP = MANUAL EMAIL)
    const disputeRecord = buildDisputeRecord(classificationOutput)

    if (disputeRecord.dispute_required) {
      workflowStatus = "dispute_in_progress"
      stepExecution.dispute_step.status = "completed"
      stepExecution.dispute_step.started_at = nowIso()
      stepExecution.dispute_step.completed_at = nowIso()
      stepExecution.dispute_step.note = disputeRecord.note

      humanTouchpoints.push({
        touchpoint_id: makeId("touchpoint"),
        touchpoint_type: "dispute_approval",
        actor_role: options.actor_role_for_manual_actions ?? "operations_reviewer",
        timestamp: nowIso(),
        note: "Founder manually sends initial disputes via email and logs outcomes until the Dispute Engine is automated.",
      })
    } else {
      stepExecution.dispute_step.status = truthNeeded ? "not_required" : "completed"
      stepExecution.dispute_step.started_at = nowIso()
      stepExecution.dispute_step.completed_at = nowIso()
      stepExecution.dispute_step.note = disputeRecord.note
    }

    // STEP 6: SAVINGS PREVIEW
    workflowStatus = "savings_pending"
    stepExecution.savings_step.status = "completed"
    stepExecution.savings_step.started_at = nowIso()
    stepExecution.savings_step.completed_at = nowIso()
    stepExecution.savings_step.note =
      "MVP savings step creates a preview only. Verified savings occur after dispute outcome."
    const savingsPreview = buildSavingsPreview(classificationOutput)

    // STEP 7: REPORTING SNAPSHOT
    workflowStatus = "reporting_pending"
    stepExecution.employer_reporting_step.status = "completed"
    stepExecution.employer_reporting_step.started_at = nowIso()
    stepExecution.employer_reporting_step.completed_at = nowIso()
    const reportingSnapshot = buildReportingSnapshot(classificationOutput)

    // FINAL WORKFLOW STATUS
    if (classificationOutput.error_handling.shadow_state) {
      workflowStatus = "shadow"
      humanTouchpoints.push({
        touchpoint_id: makeId("touchpoint"),
        touchpoint_type: "manual_review",
        actor_role: options.actor_role_for_manual_actions ?? "operations_reviewer",
        timestamp: nowIso(),
        note: "Workflow entered shadow state and requires a better document or manual review.",
      })
    } else if (classificationOutput.aggregate_outputs.manual_review_count > 0) {
      workflowStatus = "manual_review_required"
      humanTouchpoints.push({
        touchpoint_id: makeId("touchpoint"),
        touchpoint_type: "manual_review",
        actor_role: options.actor_role_for_manual_actions ?? "operations_reviewer",
        timestamp: nowIso(),
        note: "One or more findings require manual review before action.",
      })
    } else if (truthNeeded || disputeRecord.dispute_required) {
      workflowStatus = "partially_completed"
    } else {
      workflowStatus = "completed"
    }

    const primaryPath = derivePrimaryPath(workflowStatus, classificationOutput)

    performanceMetrics.end_to_end_duration_ms = elapsedMs(overallStart, Date.now())

    return {
      schema_version: "1.2-mvp",
      workflow_id: workflowId,
      workflow_type: options.workflow_type ?? "employee_bill_review",
      claim_id: parseResult.parsed.claim_id,
      employee_id: options.employee_id ?? null,
      employer_id: options.employer_id ?? null,

      workflow_created_at: workflowCreatedAt,
      workflow_updated_at: nowIso(),
      workflow_status: workflowStatus,

      workflow_summary: {
        primary_path: primaryPath,
        final_payment_recommendation:
          classificationOutput.claim_classification_summary.payment_recommendation_final,
        final_primary_classification:
          classificationOutput.claim_classification_summary.primary_classification,
        total_estimated_savings: classificationOutput.total_final_savings,
        total_verified_savings: null,
        workflow_summary_narrative: buildWorkflowNarrative(
          workflowStatus,
          primaryPath,
          classificationOutput
        ),
      },

      step_execution: stepExecution,

      performance_metrics: performanceMetrics,

      decision_gates: {
        truth_layer_gate_triggered: truthNeeded,
        dispute_gate_triggered: classificationOutput.aggregate_outputs.dispute_ready_count > 0,
        manual_review_gate_triggered:
          workflowStatus === "manual_review_required" ||
          classificationOutput.aggregate_outputs.manual_review_count > 0,
        shadow_gate_triggered: classificationOutput.error_handling.shadow_state,
      },

      human_touchpoints: humanTouchpoints,

      retry_and_recovery: {
        retry_count: 0,
        last_retry_at: null,
        recovery_mode:
          workflowStatus === "shadow"
            ? "shadow_close"
            : workflowStatus === "manual_review_required"
            ? "manual_review_fallback"
            : "none",
      },

      error_handling: {
        partial_failure: partialFailure,
        failure_step: failureStep,
        error_reason: errorReason,
      },

      parse_result: parseResult,
      reasoning_output: reasoningOutput,
      classification_output: classificationOutput,

      mvp_dispute_record: disputeRecord,
      mvp_savings_preview: savingsPreview,
      mvp_reporting_snapshot: reportingSnapshot,
    }
  } catch (error) {
    failureStep =
      stepExecution.classification_step.status === "running"
        ? "classification_step"
        : stepExecution.reasoning_step.status === "running"
        ? "reasoning_step"
        : "workflow"

    errorReason = error instanceof Error ? error.message : "Unknown workflow error"
    partialFailure = true
    workflowStatus = "failed"
    performanceMetrics.end_to_end_duration_ms = elapsedMs(overallStart, Date.now())

    return {
      schema_version: "1.2-mvp",
      workflow_id: workflowId,
      workflow_type: options.workflow_type ?? "employee_bill_review",
      claim_id: null,
      employee_id: options.employee_id ?? null,
      employer_id: options.employer_id ?? null,

      workflow_created_at: workflowCreatedAt,
      workflow_updated_at: nowIso(),
      workflow_status: workflowStatus,

      workflow_summary: {
        primary_path: "manual_review_path",
        final_payment_recommendation: null,
        final_primary_classification: null,
        total_estimated_savings: null,
        total_verified_savings: null,
        workflow_summary_narrative: "The workflow failed and requires manual review.",
      },

      step_execution: stepExecution,
      performance_metrics: performanceMetrics,

      decision_gates: {
        truth_layer_gate_triggered: false,
        dispute_gate_triggered: false,
        manual_review_gate_triggered: true,
        shadow_gate_triggered: false,
      },

      human_touchpoints: [
        {
          touchpoint_id: makeId("touchpoint"),
          touchpoint_type: "manual_review",
          actor_role: options.actor_role_for_manual_actions ?? "operations_reviewer",
          timestamp: nowIso(),
          note: "Workflow failed and requires manual review fallback.",
        },
      ],

      retry_and_recovery: {
        retry_count: 0,
        last_retry_at: null,
        recovery_mode: "manual_review_fallback",
      },

      error_handling: {
        partial_failure: partialFailure,
        failure_step: failureStep,
        error_reason: errorReason,
      },

      parse_result:
        typeof parseResult !== "undefined"
          ? parseResult
          : {
              parsed: undefined as never,
              errors: ["Workflow failed before parse result was available."],
              warnings: [],
            },
      reasoning_output: reasoningOutput,
      classification_output: classificationOutput,

      mvp_dispute_record: {
        dispute_required: false,
        dispute_mode: "not_required",
        dispute_status: "not_required",
        note: "Workflow failed before dispute handling.",
      },

      mvp_savings_preview: {
        total_red_savings: 0,
        total_yellow_savings: 0,
        xilo_fee_estimated_on_red: 0,
        employer_benefit_estimated_before_fee: 0,
        note: "Workflow failed before savings preview.",
      },

      mvp_reporting_snapshot: {
        dashboard_publish: false,
        potential_savings: 0,
        claims_flagged: 0,
        red_count: 0,
        yellow_count: 0,
        green_count: 0,
        shadow_count: 0,
      },
    }
  }
}
