import { NextResponse } from "next/server"

import { mockClaims } from "@/lib/brain/mock-claims"
import { classifyClaims } from "@/lib/brain/mock-classifier"
import { buildTruthLayerDecision } from "@/lib/brain/truth-layer"

export async function POST() {
  try {
    // Step 1 — Load mock claims
    const claims = mockClaims

    // Step 2 — Run classifier
    const classifications = classifyClaims(claims)

    // Step 3 — Build truth layer decisions
    const truthLayerDecisions = classifications.map((classification) =>
      buildTruthLayerDecision(classification)
    )

    // Step 4 — Combine per-claim outputs
    const results = classifications.map((classification) => {
      const truthLayer = truthLayerDecisions.find(
        (decision) => decision.claim_id === classification.claim_id
      )

      return {
        claim_id: classification.claim_id,
        classification,
        truth_layer: truthLayer,
      }
    })

    // Step 5 — Build summary metrics for dashboard / insights
    const summary = {
      scanned_claims: results.length,
      total_claims: results.length,
      red_flags: classifications.filter(
        (c) => c.final_classification === "red"
      ).length,
      yellow_flags: classifications.filter(
        (c) => c.final_classification === "yellow"
      ).length,
      green: classifications.filter(
        (c) => c.final_classification === "green"
      ).length,
      shadow: classifications.filter(
        (c) => c.final_classification === "shadow"
      ).length,
      requires_truth_layer: classifications.filter(
        (c) => c.requires_truth_layer
      ).length,
      estimated_savings: classifications.reduce(
        (sum, c) => sum + (c.estimated_savings_total || 0),
        0
      ),
    }

    return NextResponse.json({
      success: true,
      scanned_at: new Date().toISOString(),
      summary,
      results,
    })
  } catch (error) {
    console.error("Scan error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Scan failed",
      },
      { status: 500 }
    )
  }
}
