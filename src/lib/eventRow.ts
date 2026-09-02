import { Caregiver, DiaperEvent, FeedEvent, MedicineEvent, SleepEvent, TimelineEvent } from '../types/models';
import { clockTime, durationLabel } from './time';

/** The timestamp an event sorts/displays by (sleep uses its end, then start). */
export function eventTime(e: TimelineEvent): string {
  return 'time' in e ? e.time : e.endTime ?? e.startTime;
}

/** Sleep is the only event with two timestamps and a derived duration, so it
 * needs all three shown — a lone timestamp on a sleep row reads as the start
 * when it is actually the end. */
export function sleepRange(e: SleepEvent): string {
  return e.endTime ? `${clockTime(e.startTime)} – ${clockTime(e.endTime)}` : `Started ${clockTime(e.startTime)}`;
}

export function sleepDurationMs(e: SleepEvent): number {
  if (!e.endTime) return 0;
  return new Date(e.endTime).getTime() - new Date(e.startTime).getTime();
}

/** Title / time / byline used by timeline rows on Home and the day log.
 * Pass `meId` (this device's caregiver id) so your own entries read
 * "logged by you" rather than a name you have to disambiguate. */
export function eventRowFor(e: TimelineEvent, caregivers: Caregiver[], meId?: string) {
  const caregiverName = (id: string) =>
    id && id === meId ? 'you' : caregivers.find((c) => c.id === id)?.name.split(' · ')[0] ?? 'you';
  let title = '';
  // Extra context shown before the byline — currently the sleep start/end
  // range, which otherwise has nowhere to appear.
  let detail = '';

  if (e.type === 'bottle') {
    const q = (e as FeedEvent).quantityMl;
    title = q != null ? `Bottle · ${q} ml` : 'Bottle';
  } else if (e.type === 'solids') {
    title = `Solids${(e as FeedEvent).food ? ` · ${(e as FeedEvent).food}` : ''}`;
  } else if (e.type === 'pump') {
    const f = e as FeedEvent;
    // Side is shown now that it is genuinely chosen. It used to be hardcoded
    // 'left' on every pump and read only by the edit sheet, so the one place
    // it appeared was the place you went to correct it.
    title = [f.quantityMl != null ? `Pump · ${f.quantityMl} ml` : 'Pump', f.side].filter(Boolean).join(' · ');
  } else if (e.type === 'diaper') {
    title = `Diaper · ${(e as DiaperEvent).kind}`;
  } else if (e.type === 'medicine') {
    const me = e as MedicineEvent;
    title = me.dose ? `${me.name} · ${me.dose}` : me.name;
  } else if (e.type === 'sleep') {
    const se = e as SleepEvent;
    title = se.endTime ? `Sleep · ${durationLabel(sleepDurationMs(se))}` : 'Sleep in progress';
    detail = sleepRange(se);
  }

  const voiceTag = e.inputMethod === 'voice' ? ' 🎙️ voice' : '';
  const byline = `logged by ${caregiverName(e.loggedBy)}${voiceTag}`;
  return {
    title,
    time: clockTime(eventTime(e)),
    subLine: detail ? `${detail} · ${byline}` : byline,
  };
}
