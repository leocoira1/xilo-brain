import {
  CanonicalClaimInput,
  Classification,
  ClassificationOutput,
  ErrorCategory,
  classifyPaymentStatus,
  deriveClaimStatus,
  shouldTriggerTruthLayer,
} from "./schemas"

function now(): string {
  return new Date().toISOString()
}

function hasCpt(claim: CanonicalClaimInput, code: string): boolean {
  return claim.cpt_codes.includes(code)
}

function isPreventiveVisit(claim: CanonicalClaimInput): boolean {
  return (
    hasCpt(claim, "99396") ||
    hasCpt(claim, "99393") ||
    hasCpt(claim, "99395") ||
    claim.icd10_codes?.includes("Z00.00") ||
    claim.icd10_codes?.includes("Z00.129")
  )
}

function isEmergencyVisit(claim: CanonicalClaimInput): boolean {
  return (
    claim.place_of_service === "23" ||
    hasCpt(claim, "99284") ||
    hasCpt(claim, "99285")
  )
}

function roundConfidence(value: number): number {
  return Math.max(0, Math.min(0.99, Number(value.toFixed(2))))
}

function buildOutput(
  claim: CanonicalClaimInput,
  finalClassification: Classification,
  primaryErrorCategory: ErrorCategory,
  estimatedSavingsTotal: number,
  finalConfidence: number,
  rationale: string
): ClassificationOutput {
  const requiresTruthLayer = shouldTriggerTruthLayer(
    finalConfidence,
    finalClassification,
    false,
    estimatedSavingsTotal
  )

  return {
    created_at: now(),
    updated_at: now(),
    processed_by: "mock_classifier",
    claim_id: claim.claim_id,
    final_classification: finalClassification,
    final_confidence: roundConfidence(finalConfidence),
    payment_status: classifyPaymentStatus(finalClassification),
    primary_error_category: primaryErrorCategory,
    estimated_savings_total: estimatedSavingsTotal,
    requires_truth_layer: requiresTruthLayer,
    status_after_classification: deriveClaimStatus(
      finalClassification,
      requiresTruthLayer
    ),
    rationale,
  }
}

function countPossibleDuplicates(
  claim: CanonicalClaimInput,
  allClaims: CanonicalClaimInput[]
): number {
  return allClaims.filter((other) => {
    if (other.claim_id === claim.claim_id) return false

    return (
      other.provider_name === claim.provider_name &&
      other.service_date === claim.service_date &&
      JSON.stringify(other.cpt_codes) === JSON.stringify(claim.cpt_codes)
    )
  }).length
}

export function classifyMockClaim(
  claim: CanonicalClaimInput,
  allClaims: CanonicalClaimInput[] = []
): ClassificationOutput {
  const billed = claim.billed_amount ?? 0
  const allowed = claim.allowed_amount ?? 0
  const patientResponsibility = claim.patient_responsibility ?? 0
  const duplicates = countPossibleDuplicates(claim, allClaims)

  // Duplicate billing (high confidence)
  if (duplicates >= 2) {
    return buildOutput(
      claim,
      "red",
      "duplicate_charge",
      Math.max(allowed, billed * 0.25),
      0.94,
      "Same provider, date, and CPT combination appears multiple times indicating duplicate billing."
    )
  }

  // Possible duplicate
  if (duplicates === 1) {
    return buildOutput(
      claim,
      "yellow",
      "adjacent_duplicate",
      Math.max(allowed * 0.6, 75),
      0.67,
      "Similar claim exists requiring confirmation for duplicate billing."
    )
  }

  // Preventive incorrectly charged
  if (
    isPreventiveVisit(claim) &&
    patientResponsibility > 0 &&
    claim.denial_reason === "cost_share_applied"
  ) {
    return buildOutput(
      claim,
      "yellow",
      "preventive_care_error",
      Math.max(patientResponsibility, 50),
      0.64,
      "Preventive visit appears to have cost-sharing applied incorrectly."
    )
  }

  // Preventive clean
  if (isPreventiveVisit(claim) && patientResponsibility === 0) {
    return buildOutput(
      claim,
      "green",
      "unknown",
      0,
      0.18,
      "Preventive visit appears correctly covered."
    )
  }

  // Out-of-network emergency
  if (claim.network_status === "out_of_network" && isEmergencyVisit(claim)) {
    const classification: Classification =
      patientResponsibility >= 600 ? "red" : "yellow"

    return buildOutput(
      claim,
      classification,
      "balance_billing",
      Math.max(patientResponsibility * 0.7, 120),
      classification === "red" ? 0.83 : 0.71,
      "Out-of-network emergency claim may violate No Surprises protections."
    )
  }

  // Deductible error
  if (claim.denial_reason === "deductible_not_met" && patientResponsibility === 0) {
    return buildOutput(
      claim,
      "yellow",
      "deductible_error",
      Math.max(allowed * 0.5, 40),
      0.61,
      "Possible deductible adjudication inconsistency."
    )
  }

  // Upcoding candidate
  if (hasCpt(claim, "99215")) {
    return buildOutput(
      claim,
      "yellow",
      "upcoding",
      Math.max(billed - allowed, 60),
      0.66,
      "High complexity visit flagged as potential upcoding."
    )
  }

  // Therapy phantom candidate
  if (
    claim.provider_name?.includes("Rehab") ||
    hasCpt(claim, "97110") ||
    hasCpt(claim, "97140")
  ) {
    return buildOutput(
      claim,
      "yellow",
      "phantom_service",
      Math.max(allowed * 0.35, 50),
      0.58,
      "Therapy billing pattern may indicate phantom service."
    )
  }

  // Shadow monitoring
  if (billed > 0 && allowed > 0 && billed / allowed >= 3.2) {
    return buildOutput(
      claim,
      "shadow",
      "unknown",
      0,
      0.41,
      "Large billed-to-allowed spread; monitor only."
    )
  }

  // Default no issue
  return buildOutput(
    claim,
    "green",
    "unknown",
    0,
    0.14,
    "No anomaly detected."
  )
}

export function classifyMockClaims(
  claims: CanonicalClaimInput[]
): ClassificationOutput[] {
  return claims.map((claim) => classifyMockClaim(claim, claims))
}
