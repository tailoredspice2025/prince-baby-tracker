import { ageInMonths, cvFor, medianFor, Measure, Sex } from './whoData';

// Standard normal CDF via Abramowitz & Stegun erf approximation.
function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

export interface PercentileResult {
  zScore: number;
  percentile: number; // 1-99, rounded
  median: number;
}

/** Cole LMS method with L=0 (log-normal skew), see whoData.ts for rationale. */
export function computePercentile(
  measure: Measure,
  sex: Sex,
  value: number,
  dob: string,
  onDate: string
): PercentileResult {
  const m = medianFor(measure, sex, dob, onDate);
  const s = cvFor(measure, sex);
  const z = Math.log(value / m) / s;
  const p = Math.max(1, Math.min(99, Math.round(normalCdf(z) * 100)));
  return { zScore: z, percentile: p, median: m };
}

/** Value (in the measure's native unit) at a given percentile band, for chart guide lines. */
export function valueAtPercentile(
  measure: Measure,
  sex: Sex,
  percentile: number,
  dob: string,
  onDate: string
): number {
  const m = medianFor(measure, sex, dob, onDate);
  const s = cvFor(measure, sex);
  // invert normalCdf via a lookup of common z-scores for the bands we draw (15th/50th/85th)
  const zTable: Record<number, number> = { 3: -1.88, 15: -1.036, 50: 0, 85: 1.036, 97: 1.88 };
  const z = zTable[percentile] ?? 0;
  return m * Math.exp(z * s);
}

export { ageInMonths };
export type { Measure, Sex };
