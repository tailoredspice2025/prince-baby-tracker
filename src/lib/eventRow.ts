import { Caregiver, DiaperEvent, FeedEvent, MedicineEvent, SleepEvent, TimelineEvent } from '../types/models';
import { clockTime, durationLabel } from './time';

/** The timestamp an event sorts/displays by (sleep uses its end, then start). */
export function eventTime(e: TimelineEvent): string {
  return 'time' in e ? e.time : e.endTime ?? e.startTime;
}

/** Title / time / byline used by timeline rows on Home and the day log.
 * Pass `meId` (this device's caregiver id) so your own entries read
 * "logged by you" rather than a name you have to disambiguate. */
export function eventRowFor(e: TimelineEvent, caregivers: Caregiver[], meId?: string) {
  const caregiverName = (id: string) =>
    id && id === meId ? 'you' : caregivers.find((c) => c.id === id)?.name.split(' · ')[0] ?? 'you';
  let title = '';
  if (e.type === 'bottle') title = `Bottle · ${(e as FeedEvent).quantityMl ?? ''} ml`;
  else if (e.type === 'solids') title = `Solids${(e as FeedEvent).food ? ` · ${(e as FeedEvent).food}` : ''}`;
  else if (e.type === 'pump') title = `Pump · ${(e as FeedEvent).quantityMl ?? ''} ml`;
  else if (e.type === 'diaper') title = `Diaper · ${(e as DiaperEvent).kind}`;
  else if (e.type === 'medicine') title = (e as MedicineEvent).name;
  else if (e.type === 'sleep') {
    const se = e as SleepEvent;
    title = se.endTime
      ? `Sleep · ${durationLabel(new Date(se.endTime).getTime() - new Date(se.startTime).getTime())}`
      : 'Sleep started';
  }
  const voiceTag = e.inputMethod === 'voice' ? ' 🎙️ voice' : '';
  return { title, time: clockTime(eventTime(e)), subLine: `logged by ${caregiverName(e.loggedBy)}${voiceTag}` };
}
