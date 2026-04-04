import { runXiloMVPWorkflow } from "./orchestrator";

const sampleClaim = {
  claim_id: "claim_001",
  patient_id: "patient_tok_001",
  date_of_service: "2026-04-01",
  provider_npi: "1234567890",
  provider_name: "Metro Radiology Center",
  payer_name: "Aetna",
  provider_specialty: "Radiology",
  provider_specialty_nucc: "2085R0202X",
  place_of_service: "22",
  claim_status: "paid",

  line_items: [
    {
      line_id: "line_1",
      cpt_code: "71046",
      modifiers: [],
      units: 1,
      billed_amount: 4250,
      allowed_amount: 2100,
      patient_responsibility: 350,
      visit_duration_minutes: 15,
      primary_icd10: "R07.9",
      icd10_codes: ["R07.9"],
    },
    {
      line_id: "line_2",
      cpt_code: "71046",
      modifiers: [],
      units: 1,
      billed_amount: 4250,
      allowed_amount: 2100,
      patient_responsibility: 350,
      visit_duration_minutes: 15,
      primary_icd10: "R07.9",
      icd10_codes: ["R07.9"],
    },
  ],

  claim_totals: {
    total_billed_amount: 8500,
    total_allowed_amount: 4200,
    total_patient_responsibility: 700,
  },

  patient_history_summary: {
    historical_avg_duration: 20,
    historical_visit_frequency_per_month: 0.5,
    typical_e_m_level: "3",
  },

  employer_plan_details: {
    deductible_met: false,
    oop_max_met: false,
    coinsurance_percent: 20,
    plan_liability_percent: 80,
  },

  visit_context: {
    is_emergency: false,
    network_tier: "out_of_network",
    has_prior_authorization: false,
    prior_auth_reference: null,
  },

  appeal_context: {
    appeal_deadline: "2026-05-01",
    days_to_deadline: 30,
    denial_reason_code: null,
  },

  source_metadata: {
    source_type: "provider_bill",
    ocr_confidence: 0.92,
    document_id: "doc_001",
    ingested_at: "2026-04-03T13:00:00.000Z",
  },

  privacy_context: {
    patient_id_tokenized: true,
    phi_minimized: true,
    retention_class: "tokenized_long_term",
  },
};

const result = runXiloMVPWorkflow(sampleClaim, {
  workflow_type: "employee_bill_review",
  employee_id: "emp_001",
  employer_id: "employer_001",
  duplicate_dispute_in_progress: false,
  actor_role_for_manual_actions: "operations_reviewer",
});

console.log("=== XILO MVP WORKFLOW RESULT ===");
console.log(JSON.stringify(result, null, 2));
