import { ParsedVoiceDraft } from '../types/models';

// Lightweight rule-based parser for the voice-logging feature. Matches the
// example utterances from the 2a/2b spec: "feed done, 120 ml bottle at 12
// o'clock", "pee diaper now", "slept 2 to 4", "gave vitamin D", "wet diaper
// just now", "pumped 90 ml left side", "DTaP third dose today at the
// clinic". This is intentionally simple keyword/regex matching rather than
// a full NLU model — good enough for a hands-free quick-log, and every
// auto-loggable result still goes through the 3-second undo window.

function fmtHourMeridiem(hour: number, meridiem: 'am' | 'pm' | null, now: Date): Date {
  const d = new Date(now);
  let h = hour % 12;
  if (meridiem === 'pm') h += 12;
  if (meridiem === null) {
    // no am/pm spoken — pick whichever reading is closest to "now" and not in the future
    const candidateAm = hour % 12;
    const candidatePm = (hour % 12) + 12;
    const nowH = now.getHours() + now.getMinutes() / 60;
    const distAm = Math.abs(nowH - candidateAm);
    const distPm = Math.abs(nowH - candidatePm);
    h = distPm < distAm ? candidatePm : candidateAm;
  }
  d.setHours(h, 0, 0, 0);
  return d;
}

function parseQuantityMl(text: string): number | undefined {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(ml|milliliters?|oz|ounces?)/i);
  if (!m) return undefined;
  const val = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  return unit.startsWith('oz') || unit.startsWith('ounce') ? Math.round(val * 29.5735) : Math.round(val);
}

function parseClockTime(text: string, now: Date): Date | null {
  if (/\bjust now\b|\bnow\b/i.test(text)) return now;
  const m = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|o'?clock)?/i);
  if (m) {
    const hour = parseInt(m[1], 10);
    const meridiemRaw = m[3]?.toLowerCase();
    const meridiem = meridiemRaw === 'am' ? 'am' : meridiemRaw === 'pm' ? 'pm' : null;
    const d = fmtHourMeridiem(hour, meridiem, now);
    if (m[2]) d.setMinutes(parseInt(m[2], 10));
    return d;
  }
  return null;
}

function parseSleepRange(text: string, now: Date): { start: Date; end: Date } | null {
  const m = text.match(/(\d{1,2})\s*(?:to|-|until)\s*(\d{1,2})/i);
  if (!m) return null;
  const startHour = parseInt(m[1], 10);
  const endHour = parseInt(m[2], 10);
  // sleep windows are usually PM->AM or contextual; assume the pair closest together chronologically
  const start = fmtHourMeridiem(startHour, null, now);
  let end = fmtHourMeridiem(endHour, null, now);
  if (end.getTime() <= start.getTime()) end = new Date(end.getTime() + 12 * 60 * 60 * 1000);
  return { start, end };
}

export function parseVoiceTranscript(transcript: string, now: Date = new Date()): ParsedVoiceDraft {
  const text = transcript.trim();
  const lower = text.toLowerCase();
  const base: ParsedVoiceDraft = {
    transcript: text,
    eventType: null,
    title: '',
    detail: '',
    icon: '🎙️',
    time: now.toISOString(),
    raw: {},
    recognized: false,
  };

  if (!text) return base;

  // health records — always open a form, never auto-logged
  if (/\bvaccine|dtap|mmr|rotavirus|hepatitis|polio|dose\b/i.test(lower) && /\bdose|vaccine|shot\b/i.test(lower)) {
    return {
      ...base,
      eventType: 'vaccine',
      title: 'Vaccine detected',
      detail: 'Opens the vaccine form to confirm',
      icon: '💉',
      recognized: true,
    };
  }
  if (/\b(gave|give|dose of)\b.*\b(medicine|syrup|drops|vitamin|paracetamol|tylenol|calpol)\b/i.test(lower)) {
    return {
      ...base,
      eventType: 'medicine-form',
      title: 'Medicine detected',
      detail: 'Opens a form to confirm the dose',
      icon: '💊',
      recognized: true,
    };
  }
  if (/\bfever|rash|sick|vomit|cough|temperature\b/i.test(lower)) {
    return {
      ...base,
      eventType: 'sickness-form',
      title: 'Symptom detected',
      detail: 'Opens a form to record it',
      icon: '🌡️',
      recognized: true,
    };
  }

  // sleep
  if (/\bslept|sleep|nap(?:ped)?\b/i.test(lower)) {
    const range = parseSleepRange(lower, now);
    const start = range?.start ?? parseClockTime(lower, now) ?? now;
    const end = range?.end;
    const timeLabel = end
      ? `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return {
      ...base,
      eventType: 'sleep',
      title: end ? 'Sleep' : 'Sleep started',
      detail: timeLabel,
      icon: '🌙',
      time: start.toISOString(),
      raw: { startTime: start.toISOString(), endTime: end?.toISOString() },
      recognized: true,
    };
  }

  // diaper
  if (/\bdiaper|wet|dirty|poo|pee|wee\b/i.test(lower)) {
    const kind = /\bpoo|dirty\b/i.test(lower) ? 'dirty' : /\bwet|pee|wee\b/i.test(lower) ? 'wet' : 'wet';
    const time = parseClockTime(lower, now) ?? now;
    return {
      ...base,
      eventType: 'diaper',
      title: `Diaper · ${kind}`,
      detail: time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      icon: '💧',
      time: time.toISOString(),
      raw: { kind },
      recognized: true,
    };
  }

  // pump
  if (/\bpump(?:ed|ing)?\b/i.test(lower)) {
    const ml = parseQuantityMl(lower);
    const side = /\bleft\b/i.test(lower) ? 'left' : /\bright\b/i.test(lower) ? 'right' : /\bboth\b/i.test(lower) ? 'both' : undefined;
    const time = parseClockTime(lower, now) ?? now;
    return {
      ...base,
      eventType: 'pump',
      title: ml ? `Pump · ${ml} ml` : 'Pump',
      detail: `${time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}${side ? ` · ${side} side` : ''}`,
      icon: '🤱',
      time: time.toISOString(),
      quantityMl: ml,
      raw: { side },
      recognized: true,
    };
  }

  // solids
  if (/\bsolids?|ate|puree|pear|banana|cereal\b/i.test(lower)) {
    const time = parseClockTime(lower, now) ?? now;
    return {
      ...base,
      eventType: 'solids',
      title: 'Solids',
      detail: time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      icon: '🥄',
      time: time.toISOString(),
      recognized: true,
    };
  }

  // bottle / feed (default feed category — matches "feed done, 120 ml bottle at 12")
  if (/\bfeed|bottle|formula|drank|drink\b/i.test(lower)) {
    const ml = parseQuantityMl(lower);
    const time = parseClockTime(lower, now) ?? now;
    return {
      ...base,
      eventType: 'bottle',
      title: ml ? `Bottle · ${ml} ml` : 'Bottle',
      detail: `Today, ${time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · formula`,
      icon: '🍼',
      time: time.toISOString(),
      quantityMl: ml,
      recognized: true,
    };
  }

  return base;
}
