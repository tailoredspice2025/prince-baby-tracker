import { DiaperEvent, FeedEvent, TimelineEvent } from '../types/models';
import { eventTime } from './eventRow';

export type QuickLogType = 'bottle' | 'diaper' | 'solids' | 'pump';

export interface QuickLogValues {
  quantityMl?: number;
  kind?: DiaperEvent['kind'];
  food?: string;
  side?: FeedEvent['side'];
}

/**
 * What a bare tap on a quick-log tile should record — or `null` when there is
 * nothing the parent has actually done to repeat.
 *
 * One rule for all five tiles: **a tap repeats what you did last; with nothing
 * to repeat, the picker opens rather than the app guessing.**
 *
 * It replaces five invented defaults, each of which wrote something nobody
 * entered into a record that "Export for pediatrician" prints:
 *
 *   solids   `food ?? 'pear'`      a specific food, possibly never eaten —
 *                                  the worst of them, since food history is
 *                                  what an allergy question turns on
 *   pump     `side: 'left'`        hardcoded on every pump, never asked, not
 *                                  even offered in the picker
 *   bottle   `notes: 'Formula'`    a note the parent never wrote, on a bottle
 *                                  that may well have been breastmilk
 *   diaper   `kind ?? 'wet'`       wet is the common case, which is exactly
 *                                  why the wrong one goes unnoticed
 *   bottle   `?? 120`, pump `?? 90`  a volume for a baby nobody has measured
 *
 * Repeating the last value is different in kind: that number came from the
 * parent, so the app is echoing them rather than inventing. The first tap of
 * each type costs one extra tap, once, and buys a record that only contains
 * things that happened.
 */
export function repeatLast(type: QuickLogType, events: TimelineEvent[], babyId: string): QuickLogValues | null {
  const last = events
    .filter((e) => e.babyId === babyId && e.type === type)
    .sort((a, b) => eventTime(b).localeCompare(eventTime(a)))[0];
  if (!last) return null;

  if (type === 'diaper') {
    const kind = (last as DiaperEvent).kind;
    return kind ? { kind } : null;
  }
  if (type === 'solids') {
    const food = (last as FeedEvent).food;
    return food ? { food } : null;
  }
  // bottle and pump repeat the volume; pump also repeats the side, which is
  // only ever set when the parent chose it.
  const feed = last as FeedEvent;
  if (feed.quantityMl == null) return null;
  return type === 'pump' ? { quantityMl: feed.quantityMl, side: feed.side } : { quantityMl: feed.quantityMl };
}

/** True when a bare tap has something honest to log. The tile uses this to
 * decide between logging and opening the picker, so the two never disagree. */
export function canQuickLog(type: QuickLogType, events: TimelineEvent[], babyId: string): boolean {
  return repeatLast(type, events, babyId) !== null;
}
