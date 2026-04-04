// /lib/confidenceThreshold.ts

export function getConfidenceThreshold(estimatedSavings: number): number {
  if (estimatedSavings >= 1000) return 0.50;
  if (estimatedSavings >= 500) return 0.60;
  if (estimatedSavings >= 250) return 0.70;
  if (estimatedSavings >= 100) return 0.85;
  return 0.95; // below $100 very strict
}
