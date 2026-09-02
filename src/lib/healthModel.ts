import { MedicineEvent, Medication, SicknessEpisode, TempReading, TimelineEvent } from '../types/models';

/**
 * The links between what a baby takes, each dose of it, and the illness it was
 * for — plus the temperature readings that used to have nowhere to live.
 *
 * Health held three unconnected lists, so the app could not produce the one
 * sentence a parent actually says to a doctor: *"fever Tuesday to Thursday,
 * peaked at 38.1, Calpol three times."* Every part of that sentence was
 * captured. None of it was connected.
 */

/** Pulls a temperature out of a title like `Fever · 38.1°C`.
 *
 * The sickness form captured a temperature and glued it into the title, so
 * every episode logged before v5 carries its reading as text. Throwing that
 * away at migration would lose real measurements a parent took, so it is
 * parsed back out — the same instinct as matching seeded records by exact id
 * rather than prefix: recover what is genuinely theirs, drop nothing. */
export function tempFromTitle(title: string): { title: string; tempC?: number } {
  const m = title.match(/^(.*?)\s*·\s*([0-9]{2}(?:\.[0-9])?)\s*°?C?$/i);
  if (!m) return { title: title.trim() };
  const tempC = Number(m[2]);
  // A plausible body temperature. Anything else is part of the name, not a
  // measurement — better to leave a title alone than invent a reading.
  if (!Number.isFinite(tempC) || tempC < 30 || tempC > 45) return { title: title.trim() };
  return { title: (m[1] || 'Symptom').trim(), tempC };
}

export function sortedReadings(episode: SicknessEpisode): TempReading[] {
  return [...(episode.readings ?? [])].sort((a, b) => a.at.localeCompare(b.at));
}

/** The highest temperature recorded, which is the number a doctor asks for. */
export function peakTemp(episode: SicknessEpisode): TempReading | undefined {
  return sortedReadings(episode).reduce<TempReading | undefined>(
    (hi, r) => (!hi || r.tempC > hi.tempC ? r : hi),
    undefined
  );
}

/** A fever by the usual clinical threshold. Used only to colour a reading, not
 * to advise — the app is a record, not a diagnosis. */
export const FEVER_THRESHOLD_C = 38;

export function isFeverish(tempC: number): boolean {
  return tempC >= FEVER_THRESHOLD_C;
}

/** Doses of one medicine, most recent first. */
export function dosesOf(events: TimelineEvent[], medicationId: string): MedicineEvent[] {
  return events
    .filter((e): e is MedicineEvent => e.type === 'medicine' && (e as MedicineEvent).medicationId === medicationId)
    .sort((a, b) => b.time.localeCompare(a.time));
}

/** Doses given during one illness, most recent first. */
export function dosesFor(events: TimelineEvent[], sicknessId: string): MedicineEvent[] {
  return events
    .filter((e): e is MedicineEvent => e.type === 'medicine' && (e as MedicineEvent).sicknessId === sicknessId)
    .sort((a, b) => b.time.localeCompare(a.time));
}

/** "Calpol ×3", or nothing when no dose was linked. Both ends of the same link
 * read from the same helper so they cannot drift apart. */
export function doseSummary(events: TimelineEvent[], sicknessId: string): string {
  const byName = new Map<string, number>();
  for (const d of dosesFor(events, sicknessId)) byName.set(d.name, (byName.get(d.name) ?? 0) + 1);
  return [...byName.entries()].map(([name, n]) => (n > 1 ? `${name} ×${n}` : name)).join(' · ');
}

/** The illness a dose logged now should attach itself to: an episode that has
 * started and has not been marked better. With more than one open, the most
 * recently started wins — that is the one being treated. */
export function openEpisode(sickness: SicknessEpisode[], babyId: string, now: Date): SicknessEpisode | undefined {
  return sickness
    .filter((s) => s.babyId === babyId && !s.resolved && new Date(s.startDate) <= now)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
}

/** Matches a dose to the medicine it was of, by id where the caller knew it and
 * by name otherwise. Name matching is what the pre-v5 backfill relies on and
 * is deliberately forgiving about case and surrounding space; it is not
 * forgiving about anything else, because a wrong link is worse than none. */
export function medicationFor(
  medications: Medication[],
  babyId: string,
  opts: { medicationId?: string; name?: string }
): Medication | undefined {
  const mine = medications.filter((m) => m.babyId === babyId);
  if (opts.medicationId) return mine.find((m) => m.id === opts.medicationId);
  if (!opts.name) return undefined;
  const key = opts.name.trim().toLowerCase();
  return mine.find((m) => m.name.trim().toLowerCase() === key);
}

/** "last given today 6:04 PM" — the sentence a parent actually wants on a
 * medicine row. Health showed either nothing or every dose; after a week of
 * vitamins the second is unreadable, so individual doses stay on the Home
 * timeline where a chronological list belongs. */
export function lastGivenLabel(events: TimelineEvent[], med: Medication, now = new Date()): string | null {
  const last = dosesOf(events, med.id)[0];
  const iso = last?.time ?? med.lastGiven;
  if (!iso) return med.ongoing ? 'not given yet' : null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const sameDay =
    at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth() && at.getDate() === now.getDate();
  const when = sameDay
    ? `today ${at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : at.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `last given ${when}`;
}
