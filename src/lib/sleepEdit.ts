/**
 * Resolving the two ends of an edited sleep.
 *
 * Lives here rather than inside `EventEditSheet` because it is the piece that
 * has broken twice and it is pure logic — a component can't be unit-tested,
 * a function can. The duration it produces feeds the daily sleep total and the
 * trend chart, so getting it wrong rewrites history silently.
 */
export function resolveSleepRange(startIso: string, startPick: Date, endPick: Date): { start: Date; end: Date } {
  const start = new Date(startIso);
  start.setHours(startPick.getHours(), startPick.getMinutes(), 0, 0);

  // The end is always rebuilt from the START's date, never from its own.
  //
  // The first version kept the end on whatever date it already had and added
  // 24h whenever it landed before the start. That ratcheted: drag the wake
  // time earlier once, the end jumped to the next day and stayed there, and
  // every later edit changed only the time of day — so an 8-minute nap was
  // stuck reading "24h 8m" with no way back from inside the sheet.
  const end = new Date(start);
  end.setHours(endPick.getHours(), endPick.getMinutes(), 0, 0);
  if (end <= start) end.setDate(end.getDate() + 1); // genuinely crossed midnight

  return { start, end };
}

/** Over this, the times are almost certainly wrong rather than a long night. */
export const IMPLAUSIBLE_SLEEP_MS = 18 * 3600 * 1000;
