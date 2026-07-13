// WHO Child Growth Standards reference points (0-24 months), median (M) values
// transcribed from the published WHO tables, with an approximate constant
// coefficient-of-variation (S) per measure/sex used for percentile math.
//
// This uses the Cole LMS method with L=0 (log-normal), which is the standard
// simplification when the WHO skewness parameter is close to zero — accurate
// enough for an app growth chart. It is NOT a substitute for the official WHO
// LMS CSVs in a clinical setting; swap in the exact L/M/S tables from
// https://www.who.int/tools/child-growth-standards/standards if this ships
// as a medical product.

export type Sex = 'male' | 'female';
export type Measure = 'weight' | 'height' | 'head';

// month -> median value, for months 0..24 (piecewise-linear interpolated between points)
const WEIGHT_KG: Record<Sex, number[]> = {
  male: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 9.9, 10.3, 10.6, 10.9, 11.2, 11.5, 11.8, 12.2, 12.5, 12.7, 13.0, 13.3],
  female: [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9, 9.2, 9.6, 9.9, 10.2, 10.6, 10.9, 11.2, 11.5, 11.8, 12.1, 12.4, 12.6],
};

const HEIGHT_CM: Record<Sex, number[]> = {
  male: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 76.9, 78.0, 79.1, 80.2, 81.2, 82.3, 83.2, 84.2, 85.1, 86.0, 86.9, 87.8],
  female: [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0, 75.2, 76.4, 77.5, 78.6, 79.7, 80.7, 81.7, 82.7, 83.7, 84.6, 85.5, 86.4],
};

const HEAD_CM: Record<Sex, number[]> = {
  male: [34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3, 44.0, 44.5, 45.0, 45.4, 45.8, 46.1, 46.4, 46.6, 46.9, 47.1, 47.3, 47.4, 47.6, 47.8, 47.9, 48.1, 48.2, 48.3],
  female: [33.9, 36.5, 38.3, 39.5, 40.6, 41.5, 42.2, 42.8, 43.4, 43.8, 44.2, 44.6, 44.9, 45.2, 45.4, 45.7, 45.9, 46.1, 46.3, 46.5, 46.7, 46.9, 47.0, 47.1, 47.2],
};

// approximate, roughly-constant coefficients of variation
const CV: Record<Measure, Record<Sex, number>> = {
  weight: { male: 0.135, female: 0.138 },
  height: { male: 0.038, female: 0.039 },
  head: { male: 0.031, female: 0.032 },
};

const TABLES: Record<Measure, Record<Sex, number[]>> = {
  weight: WEIGHT_KG,
  height: HEIGHT_CM,
  head: HEAD_CM,
};

function medianAtMonths(measure: Measure, sex: Sex, ageMonths: number): number {
  const table = TABLES[measure][sex];
  const clamped = Math.max(0, Math.min(24, ageMonths));
  const lo = Math.floor(clamped);
  const hi = Math.min(24, lo + 1);
  const frac = clamped - lo;
  const loVal = table[lo];
  const hiVal = table[hi];
  return loVal + (hiVal - loVal) * frac;
}

export function ageInMonths(dob: string, onDate: string): number {
  const d0 = new Date(dob).getTime();
  const d1 = new Date(onDate).getTime();
  const days = (d1 - d0) / (1000 * 60 * 60 * 24);
  return days / 30.4368;
}

export function medianFor(measure: Measure, sex: Sex, dob: string, onDate: string): number {
  return medianAtMonths(measure, sex, ageInMonths(dob, onDate));
}

export function cvFor(measure: Measure, sex: Sex): number {
  return CV[measure][sex];
}
