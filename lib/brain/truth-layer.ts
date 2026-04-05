import {
  ClassificationOutput,
  TruthLayerDecision,
  TruthAnswer,
} from "./schemas"

/**
 * Builds the Truth Layer decision payload for a classified claim.
 * Returns a no-op decision for claims that do not require employee confirmation.
 */
export function buildTruthLayerDecision(
  classification: ClassificationOutput
): TruthLayerDecision {
  const timestamp = new Date().toISOString()

  // Neutral fallback question (improved)
  let question =
    "Does this description match what happened during your visit?"

  if (!classification.requires_truth_layer) {
    return {
      created_at: timestamp,
      updated_at: timestamp,
      processed_by: "truth_layer_helper",
      claim_id: classification.claim_id,
      should_send: false,
      reason: "High-confidence or no-action case",
      question: "",
      answer_choices: ["yes", "no", "not_sure"] as TruthAnswer[],
      delivery_channel: "email",
      response_deadline_days: 3,
    }
  }

  // Dynamic question selection
  switch (classification.primary_error_category) {
    case "upcoding":
      question =
        "Was this a quick follow-up visit, or did the doctor spend significant time on a complex issue?"
      break

    case "duplicate_charge":
      question =
        "Did you receive this same service on two separate occasions?"
      break

    case "phantom_service":
      question =
        "Did this service actually occur on the billed date?"
      break

    case "adjacent_duplicate":
      question =
        "Did you have two similar services close together on these dates?"
      break

    case "balance_billing":
      question =
        "Was this service part of an emergency visit or urgent treatment?"
      break

    case "incorrect_denial":
      question =
        "Were you told this service had already been approved or covered?"
      break

    case "deductible_error":
      question =
        "Were you expecting this bill to count toward your deductible?"
      break

    case "oop_max_error":
      question =
        "Had you already reached your out-of-pocket maximum before this bill?"
      break

    case "preventive_care_error":
      question =
        "Was this visit intended to be preventive or routine care?"
      break

    case "bundling_error":
      question =
        "Did these billed services feel like part of one visit rather than separate procedures?"
      break

    case "modifier_issue":
      question =
        "Did you receive multiple distinct procedures during this visit?"
      break

    default:
      // fallback already set
      break
  }

  return {
    created_at: timestamp,
    updated_at: timestamp,
    processed_by: "truth_layer_helper",
    claim_id: classification.claim_id,
    should_send: true,
    reason: `Ambiguous ${classification.primary_error_category} case requiring confirmation`,
    question,
    answer_choices: ["yes", "no", "not_sure"] as TruthAnswer[],
    delivery_channel: "email",
    response_deadline_days: 3,
  }
}
