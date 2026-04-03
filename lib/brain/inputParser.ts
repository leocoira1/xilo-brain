export type ClaimStatus = "paid" | "denied" | "partially_paid" | "pending"
export type NetworkTier = "tier_1" | "tier_2" | "preferred" | "out_of_network"
export type SourceType = "EOB" | "provider_bill" | "claims_export" | "manual_upload"
export type RetentionClass = "raw_30d" | "tokenized_long_term"

export interface RawLineItem {
  line_id?: string | number
  cpt_code?: string
  modifiers?: string[] | string | null
  units?: number | string | null
  billed_amount?: number | string | null
  allowed_amount?: number | string | null
  patient_responsibility?: number | string | null
  visit_duration_minutes?: number | string | null
  primary_icd10?: string | null
  icd10_codes?: string[] | string | null
}

export interface RawClaimInput {
  claim_id?: string
  patient_id?: string
  date_of_service?: string
  provider_npi?: string
  provider_name?: string
  payer_name?: string
  provider_specialty?: string
  provider_specialty_nucc?: string
  place_of_service?: string
  claim_status?: string
  line_items?: RawLineItem[]

  claim_totals?: {
    total_billed_amount?: number | string | null
    total_allowed_amount?: number | string | null
    total_patient_responsibility?: number | string | null
  }

  patient_history_summary?: {
    historical_avg_duration?: number | string | null
    historical_visit_frequency_per_month?: number | string | null
    typical_e_m_level?: string | null
  }

  employer_plan_details?: {
    deductible_met?: boolean | null
    oop_max_met?: boolean | null
    coinsurance_percent?: number | string | null
    plan_liability_percent?: number | string | null
  }

  visit_context?: {
    is_emergency?: boolean | null
    network_tier?: string | null
    has_prior_authorization?: boolean | null
    prior_auth_reference?: string | null
  }

  appeal_context?: {
    appeal_deadline?: string | null
    days_to_deadline?: number | string | null
    denial_reason_code?: string | null
  }

  source_metadata?: {
    source_type?: string
    ocr_confidence?: number | string | null
    document_id?: string
    ingested_at?: string
  }

  privacy_context?: {
    patient_id_tokenized?: boolean | null
    phi_minimized?: boolean | null
    retention_class?: string | null
  }
}

export interface ParsedLineItem {
  line_id: string
  cpt_code: string
  modifiers: string[]
  units: number
  billed_amount: number
  allowed_amount: number | null
  patient_responsibility: number
  visit_duration_minutes: number | null
  primary_icd10: string | null
  icd10_codes: string[]
}

export interface ParsedClaimInput {
  schema_version: "2.2"
  claim_id: string
  patient_id: string | null
  date_of_service: string
  provider_npi: string
  provider_name: string | null
  payer_name: string | null
  provider_specialty: string
  provider_specialty_nucc: string
  place_of_service: string | null
  claim_status: ClaimStatus
  line_items: ParsedLineItem[]

  claim_totals: {
    total_billed_amount: number
    total_allowed_amount: number
    total_patient_responsibility: number
    validation_flag: boolean
  }

  patient_history_summary: {
    historical_avg_duration: number | null
    historical_visit_frequency_per_month: number | null
    typical_e_m_level: string | null
  }

  employer_plan_details: {
    deductible_met: boolean | null
    oop_max_met: boolean | null
    coinsurance_percent: number | null
    plan_liability_percent: number | null
  }

  visit_context: {
    is_emergency: boolean | null
    network_tier: NetworkTier | null
    has_prior_authorization: boolean | null
    prior_auth_reference: string | null
  }

  appeal_context: {
    appeal_deadline: string | null
    days_to_deadline: number | null
    denial_reason_code: string | null
  }

  source_metadata: {
    source_type: SourceType
    ocr_confidence: number | null
    document_id: string
    ingested_at: string
    ingestion_flags: string[]
    manual_review_required: boolean
  }

  privacy_context: {
    patient_id_tokenized: boolean
    phi_minimized: boolean
    retention_class: RetentionClass
  }
}

export interface ParseResult {
  parsed: ParsedClaimInput
  errors: string[]
  warnings: string[]
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  const cleaned = String(value).replace(/[$,%\s,]/g, "")
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function toInteger(value: unknown): number | null {
  const n = toNumber(value)
  return n === null ? null : Math.trunc(n)
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  return s.length ? s : null
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean)
  }
  if (typeof value === "string") {
    return value.split(/[|,;]/).map(v => v.trim()).filter(Boolean)
  }
  return []
}

function normalizeClaimStatus(value: unknown): ClaimStatus {
  const v = String(value ?? "").trim().toLowerCase()
  if (v === "paid") return "paid"
  if (v === "denied") return "denied"
  if (v === "partially_paid" || v === "partially paid") return "partially_paid"
  return "pending"
}

function normalizeNetworkTier(value: unknown): NetworkTier | null {
  const v = String(value ?? "").trim().toLowerCase()
  if (["tier_1", "tier 1"].includes(v)) return "tier_1"
  if (["tier_2", "tier 2"].includes(v)) return "tier_2"
  if (v === "preferred") return "preferred"
  if (["out_of_network", "out of network", "oon"].includes(v)) return "out_of_network"
  return null
}

function normalizeSourceType(value: unknown): SourceType {
  const v = String(value ?? "").trim().toLowerCase()
  if (v === "eob") return "EOB"
  if (v === "provider_bill" || v === "provider bill") return "provider_bill"
  if (v === "claims_export" || v === "claims export") return "claims_export"
  return "manual_upload"
}

function isISODate(value: string | null): boolean {
  if (!value) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function nowIso(): string {
  return new Date().toISOString()
}

function sum(nums: Array<number | null | undefined>): number {
  return nums.reduce((acc, n) => acc + (n ?? 0), 0)
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function parseClaimInput(raw: RawClaimInput): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  const ingestion_flags: string[] = []

  const parsedLineItems: ParsedLineItem[] = (raw.line_items ?? []).map((item, idx) => {
    const line_id = toStringOrNull(item.line_id) ?? `line_${idx + 1}`
    const cpt_code = toStringOrNull(item.cpt_code) ?? "UNKNOWN"
    const billed_amount = toNumber(item.billed_amount) ?? 0
    const allowed_amount = toNumber(item.allowed_amount)
    const patient_responsibility = toNumber(item.patient_responsibility) ?? 0
    const units = toInteger(item.units) ?? 1
    const visit_duration_minutes = toInteger(item.visit_duration_minutes)
    const primary_icd10 = toStringOrNull(item.primary_icd10)
    const icd10_codes = toStringArray(item.icd10_codes)
    const modifiers = toStringArray(item.modifiers)

    if (allowed_amount === null) {
      warnings.push(`line_items[${idx}] missing allowed_amount`)
      ingestion_flags.push(`missing_allowed_amount:${line_id}`)
    }

    if (!primary_icd10) {
      warnings.push(`line_items[${idx}] missing primary_icd10`)
      ingestion_flags.push(`missing_primary_icd10:${line_id}`)
    }

    return {
      line_id,
      cpt_code,
      modifiers,
      units,
      billed_amount,
      allowed_amount,
      patient_responsibility,
      visit_duration_minutes,
      primary_icd10,
      icd10_codes,
    }
  })

  if (!parsedLineItems.length) {
    errors.push("line_items is required and must contain at least one line item")
  }

  const totalBilledFromLines = sum(parsedLineItems.map(li => li.billed_amount))
  const totalAllowedFromLines = sum(parsedLineItems.map(li => li.allowed_amount))
  const totalPatientRespFromLines = sum(parsedLineItems.map(li => li.patient_responsibility))

  const declaredBilled = toNumber(raw.claim_totals?.total_billed_amount)
  const declaredAllowed = toNumber(raw.claim_totals?.total_allowed_amount)
  const declaredPatientResp = toNumber(raw.claim_totals?.total_patient_responsibility)

  const total_billed_amount = declaredBilled ?? totalBilledFromLines
  const total_allowed_amount = declaredAllowed ?? totalAllowedFromLines
  const total_patient_responsibility = declaredPatientResp ?? totalPatientRespFromLines

  const validation_flag =
    (declaredBilled !== null && Math.abs(declaredBilled - totalBilledFromLines) > 0.01) ||
    (declaredAllowed !== null && Math.abs(declaredAllowed - totalAllowedFromLines) > 0.01) ||
    (declaredPatientResp !== null && Math.abs(declaredPatientResp - totalPatientRespFromLines) > 0.01)

  if (validation_flag) {
    warnings.push("claim_totals.validation_flag = true due to mismatch with summed line items")
    ingestion_flags.push("claim_totals_mismatch")
  }

  const ocr_confidence = toNumber(raw.source_metadata?.ocr_confidence)
  let manual_review_required = false

  if (ocr_confidence !== null) {
    if (ocr_confidence < 0.7) {
      manual_review_required = true
      warnings.push("OCR confidence below 0.70; manual review required")
      ingestion_flags.push("low_ocr_confidence_manual_review")
    } else if (ocr_confidence < 0.85) {
      warnings.push("OCR confidence between 0.70 and 0.85; reduce downstream confidence")
      ingestion_flags.push("medium_ocr_confidence_reduce_downstream_confidence")
    }
  }

  if (parsedLineItems.some(li => li.allowed_amount === null)) {
    manual_review_required = true
    warnings.push("Missing allowed_amount on one or more line items")
    ingestion_flags.push("manual_review_missing_allowed_amount")
  }

  const claim_id = toStringOrNull(raw.claim_id)
  const date_of_service = toStringOrNull(raw.date_of_service)
  const provider_npi = toStringOrNull(raw.provider_npi)
  const provider_specialty = toStringOrNull(raw.provider_specialty)
  const provider_specialty_nucc = toStringOrNull(raw.provider_specialty_nucc)

  if (!claim_id) errors.push("claim_id is required")
  if (!date_of_service || !isISODate(date_of_service)) {
    errors.push("date_of_service is required and must be YYYY-MM-DD")
  }
  if (!provider_npi) errors.push("provider_npi is required")
  if (!provider_specialty) errors.push("provider_specialty is required")
  if (!provider_specialty_nucc) errors.push("provider_specialty_nucc is required")

  const parsed: ParsedClaimInput = {
    schema_version: "2.2",
    claim_id: claim_id ?? makeId("claim"),
    patient_id: toStringOrNull(raw.patient_id),
    date_of_service: date_of_service ?? "1900-01-01",
    provider_npi: provider_npi ?? "UNKNOWN_NPI",
    provider_name: toStringOrNull(raw.provider_name),
    payer_name: toStringOrNull(raw.payer_name),
    provider_specialty: provider_specialty ?? "UNKNOWN_SPECIALTY",
    provider_specialty_nucc: provider_specialty_nucc ?? "UNKNOWN_NUCC",
    place_of_service: toStringOrNull(raw.place_of_service),
    claim_status: normalizeClaimStatus(raw.claim_status),
    line_items: parsedLineItems,

    claim_totals: {
      total_billed_amount,
      total_allowed_amount,
      total_patient_responsibility,
      validation_flag,
    },

    patient_history_summary: {
      historical_avg_duration: toNumber(raw.patient_history_summary?.historical_avg_duration),
      historical_visit_frequency_per_month: toNumber(raw.patient_history_summary?.historical_visit_frequency_per_month),
      typical_e_m_level: toStringOrNull(raw.patient_history_summary?.typical_e_m_level),
    },

    employer_plan_details: {
      deductible_met: raw.employer_plan_details?.deductible_met ?? null,
      oop_max_met: raw.employer_plan_details?.oop_max_met ?? null,
      coinsurance_percent: toNumber(raw.employer_plan_details?.coinsurance_percent),
      plan_liability_percent: toNumber(raw.employer_plan_details?.plan_liability_percent),
    },

    visit_context: {
      is_emergency: raw.visit_context?.is_emergency ?? null,
      network_tier: normalizeNetworkTier(raw.visit_context?.network_tier),
      has_prior_authorization: raw.visit_context?.has_prior_authorization ?? null,
      prior_auth_reference: toStringOrNull(raw.visit_context?.prior_auth_reference),
    },

    appeal_context: {
      appeal_deadline: toStringOrNull(raw.appeal_context?.appeal_deadline),
      days_to_deadline: toInteger(raw.appeal_context?.days_to_deadline),
      denial_reason_code: toStringOrNull(raw.appeal_context?.denial_reason_code),
    },

    source_metadata: {
      source_type: normalizeSourceType(raw.source_metadata?.source_type),
      ocr_confidence,
      document_id: toStringOrNull(raw.source_metadata?.document_id) ?? makeId("doc"),
      ingested_at: toStringOrNull(raw.source_metadata?.ingested_at) ?? nowIso(),
      ingestion_flags: Array.from(new Set(ingestion_flags)),
      manual_review_required,
    },

    privacy_context: {
      patient_id_tokenized: raw.privacy_context?.patient_id_tokenized ?? true,
      phi_minimized: raw.privacy_context?.phi_minimized ?? true,
      retention_class:
        raw.privacy_context?.retention_class === "raw_30d"
          ? "raw_30d"
          : "tokenized_long_term",
    },
  }

  return { parsed, errors, warnings }
}
