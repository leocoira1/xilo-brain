export type IssueType =
  | "duplicate_billing"
  | "coding_error"
  | "pricing_anomaly"
  | "out_of_network"
  | "prior_auth"
  | "unknown"

export interface ClassificationResult {
  issues: IssueType[]
}
