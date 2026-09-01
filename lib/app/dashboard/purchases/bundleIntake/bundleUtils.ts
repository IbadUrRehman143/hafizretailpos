export function parseBundleInput(value: string): number[] {
  return String(value || "")
    .split(/[+,;\s]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

export function serializeBundleWeights(weights: number[]): string {
  return weights
    .filter((weight) => Number.isFinite(weight) && weight > 0)
    .join("+");
}

export function sumBundleWeights(weights: number[]): number {
  return weights.reduce((total, weight) => total + weight, 0);
}

export function averageBundleWeight(weights: number[]): number {
  if (weights.length === 0) return 0;
  return sumBundleWeights(weights) / weights.length;
}
