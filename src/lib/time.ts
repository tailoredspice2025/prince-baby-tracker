export function ageString(dob: string, now: Date = new Date()): string {
  const start = new Date(dob);
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  const anchor = new Date(start);
  anchor.setMonth(anchor.getMonth() + months);
  if (anchor > now) {
    months -= 1;
    anchor.setMonth(anchor.getMonth() - 1);
  }
  const days = Math.floor((now.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
  if (months <= 0 && days === 0) return 'newborn';
  const monthLabel = `${months} month${months === 1 ? '' : 's'}`;
  return days > 0 ? `${monthLabel}, ${days} day${days === 1 ? '' : 's'}` : monthLabel;
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function durationLabel(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
