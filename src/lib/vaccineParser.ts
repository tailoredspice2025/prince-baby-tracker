const VACCINE_NAMES: Record<string, string> = {
  dtap: 'DTaP (diphtheria, tetanus, pertussis)',
  mmr: 'MMR (measles, mumps, rubella)',
  rotavirus: 'Rotavirus',
  hepatitis: 'Hepatitis B',
  'hep b': 'Hepatitis B',
  polio: 'Polio (IPV)',
  ipv: 'Polio (IPV)',
  hib: 'Hib (Haemophilus influenzae type b)',
  pcv: 'PCV (pneumococcal conjugate)',
  flu: 'Influenza',
  varicella: 'Varicella (chickenpox)',
};

const ORDINALS: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5 };

export interface VaccineDraft {
  name?: string;
  doseLabel?: string;
  date?: string;
  fields: { name: boolean; doseLabel: boolean; date: boolean };
}

export function parseVaccineDraft(transcript: string, now: Date = new Date()): VaccineDraft {
  const lower = transcript.toLowerCase();
  const fields = { name: false, doseLabel: false, date: false };
  let name: string | undefined;
  let doseLabel: string | undefined;
  let date: string | undefined;

  for (const [key, full] of Object.entries(VACCINE_NAMES)) {
    if (lower.includes(key)) {
      name = full;
      fields.name = true;
      break;
    }
  }

  const ordinalMatch = Object.keys(ORDINALS).find((k) => lower.includes(k));
  const numericDose = lower.match(/dose\s*(\d+)/);
  if (ordinalMatch) {
    doseLabel = `${ORDINALS[ordinalMatch]} of 5`;
    fields.doseLabel = true;
  } else if (numericDose) {
    doseLabel = `${numericDose[1]} of 5`;
    fields.doseLabel = true;
  }

  if (/\btoday\b/.test(lower)) {
    date = now.toISOString();
    fields.date = true;
  } else if (/\byesterday\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    date = d.toISOString();
    fields.date = true;
  }

  return { name, doseLabel, date, fields };
}
