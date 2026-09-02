#!/usr/bin/env node
/**
 * CDSE sweep — mechanical check for the bug class that keeps costing builds.
 *
 * Capture → Derive → Surface → Editable. Almost every defect that reached a
 * real DenBaby build was a break in that chain rather than wrong logic:
 *
 *   sleep      end time captured, duration never derived into the row
 *   medicine   lastGiven captured, the notification never read it
 *   sickness   temperature captured, folded into a title string
 *   solids     food captured, folded into a display string
 *
 * Reading code cannot be relied on to find these — they are absences, and an
 * absence is invisible in a diff. So grep for them instead.
 *
 * The important subtlety: **the demo seed does not count as a capture path.**
 * A field the seed fills looks alive on screen while no user can ever produce
 * it. Build 18 strips the seed, which turns every one of those into a blank.
 * That is why demoData.ts is excluded from writes below.
 *
 * Usage:  node tools/cdse-sweep.mjs [--json]
 * Exit 0 always — this is a report, not a gate. Judgement is still required:
 * some fields are legitimately internal, and the ALLOWED list records which,
 * with the reason. Anything not on that list wants a human decision.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const MODELS = 'src/types/models.ts';
const EXCLUDE_FROM_WRITES = ['src/types/models.ts', 'src/lib/demoData.ts'];
const EXCLUDE_ALWAYS = ['__tests__'];

/** Fields that are genuinely internal or intentionally one-way, and why.
 * Keeping the reason here is the point — an unexplained exemption is how a
 * real gap gets silenced. */
const ALLOWED = {
  id: 'identity',
  babyId: 'identity',
  familyId: 'identity',
  type: 'discriminant',
  loggedBy: 'attribution, shown as a name via caregivers[]',
  inputMethod: 'provenance, not user-facing',
  active: 'which baby is selected',
  raw: 'voice parser internals',
  recognized: 'voice parser internals',
  address: 'deliberately one-way: shown in the vaccine reminder body, not in-app',
  fromVoice: 'provenance flag, drives a hint chip',
  voiceFields: 'provenance flag, drives per-field hint chips',
  colorKey: 'presentation, assigned not entered',
  online: 'derived from sync presence',
  emoji: 'presentation, assigned not entered',
  typicalAgeRange: 'catalogue metadata on the upcoming-milestone suggestions, not user data',
  // Family Sync (v1.1) writes both of these; they are dead in the v1.0 line
  // and must not be surfaced until they carry a real value.
  loggedCount: 'Family Sync v1.1 — see RELEASE_v1.1.md',
  lastActive: 'Family Sync v1.1 — see RELEASE_v1.1.md',
};

function grep(pattern) {
  try {
    return execFileSync('grep', ['-rn', '-E', pattern, 'src/', '--include=*.ts', '--include=*.tsx'], {
      encoding: 'utf8',
    }).split('\n').filter(Boolean);
  } catch {
    return []; // grep exits 1 on no matches
  }
}

// Pull every field name out of the interfaces, keeping which interface it came
// from so the report reads like the model rather than a flat list.
const src = fs.readFileSync(MODELS, 'utf8');
const interfaces = [...src.matchAll(/export interface (\w+) \{([\s\S]*?)\n\}/g)].map(([, name, body]) => ({
  name,
  fields: [...body.matchAll(/^\s{2}(\w+)\??:/gm)].map((m) => m[1]),
}));

const findings = [];
const ambiguous = [];

// grep cannot tell `Medication.schedule` from `Caregiver.schedule`, so a name
// used by more than one interface is reported as needing a human rather than
// as a result that looks authoritative and is not.
const nameCounts = {};
for (const iface of interfaces) for (const f of iface.fields) nameCounts[f] = (nameCounts[f] ?? 0) + 1;

for (const iface of interfaces) {
  for (const field of iface.fields) {
    if (ALLOWED[field]) continue;
    if (nameCounts[field] > 1) {
      if (!ambiguous.includes(field)) ambiguous.push(field);
      continue;
    }

    // A write is any of: an object-literal value (`food: x`), the shorthand
    // form (`resolved,`), or a direct assignment (`patch.food = x`). The first
    // pass only looked for `field:` and so called `food` and `resolved`
    // uncaptured when both are written every day — a sweep that cries wolf
    // gets switched off, which would cost more than the bugs it finds.
    const writes = grep(`(\\b${field}\\s*:|\\.${field}\\s*=[^=]|^\\s*${field},\\s*$)`).filter(
      (l) => !EXCLUDE_FROM_WRITES.some((f) => l.startsWith(f)) && !EXCLUDE_ALWAYS.some((f) => l.includes(f))
    );
    const reads = grep(`\\.${field}\\b`).filter(
      (l) => !l.startsWith(MODELS) && !EXCLUDE_ALWAYS.some((f) => l.includes(f))
    );

    // A field only its own interface mentions is modelled and nothing else.
    if (writes.length === 0 && reads.length === 0) {
      findings.push({ iface: iface.name, field, kind: 'modelled-only', writes: [], reads: [] });
      continue;
    }
    if (writes.length > 0 && reads.length === 0) {
      findings.push({ iface: iface.name, field, kind: 'captured-never-surfaced', writes, reads: [] });
      continue;
    }
    if (reads.length > 0 && writes.length === 0) {
      findings.push({ iface: iface.name, field, kind: 'surfaced-never-captured', writes: [], reads });
    }
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(findings, null, 2));
  process.exit(0);
}

const EXPLAIN = {
  'captured-never-surfaced':
    'The parent types it and never sees it again. Asking for something and swallowing it is worse than not asking.',
  'surfaced-never-captured':
    'A screen renders it but nothing can ever fill it. Usually the demo seed was the only writer — so it goes blank the moment the seed is stripped.',
  'modelled-only':
    'In the type and nowhere else. Either wire it up or delete it; a dead field reads as a feature that exists.',
};

/**
 * Second check: a model field written with a hardcoded literal.
 *
 * The first check finds fields that are never captured or never shown. It is
 * blind to the opposite failure — a field captured with a value the user never
 * gave — which has now cost three builds: a seeded Vitamin D that rang at 6pm,
 * `lastGiven` defaulting to now so a new medicine was already "taken", and
 * five invented quick-log values including a food (`'pear'`) and a note
 * (`'Formula'`) that print in the pediatrician PDF.
 *
 * Repeating the parent's own last value is fine — that came from them. A
 * literal in the source is the app deciding on their behalf.
 */
// Only where records are actually constructed. Scanning every screen matched
// style maps keyed by event type (`bottle: 'peach'`) against the identically
// named VoicePermissions fields — noise that would have got this switched off.
const DEFAULT_SCAN = (f) => f === 'src/lib/store.ts' || /Form.*\.tsx$/.test(f);
const DEFAULT_ALLOWED = {
  familyId: 'internal placeholder before a family is linked',
  schedule: "form default 'as needed', shown in the field and editable before save",
  emoji: 'presentation, not a record of anything',
  type: 'discriminant',
  inputMethod: 'provenance',
  loggedBy: 'attribution',
  title: "falls back to 'Symptom' only when the user left it blank",
  name: "falls back to 'Medicine'/'Vaccine' only when the user left it blank",
  dose: "falls back to '—' only when the user left it blank",
  kind: 'voice path only, unreachable while FEATURES.voiceLogging is false',
  // Determined by which action the user took, not chosen for them:
  status: "'due' from the appointment branch, 'done' from the given branch",
  role: "'owner' for whoever creates the family, 'editor' for an invitee",
  id: "'pending' placeholder, replaced with the auth uid by createFamily",
  colorKey: 'assigned so caregivers are distinguishable; not a record',
  loggedCount: 'a caregiver who has just joined has genuinely logged nothing',
};

const fieldNames = new Set(Object.keys(nameCounts));
const invented = [];
for (const line of grep(`(\\w+: '[^']+'|\\w+: [0-9]+|\\?\\? '[^']+'|\\?\\? [0-9]+)`)) {
  const [file, no, ...rest] = line.split(':');
  const code = rest.join(':');
  if (!DEFAULT_SCAN(file)) continue;
  if (EXCLUDE_ALWAYS.some((f) => file.includes(f))) continue;
  // Two shapes, because the bugs that prompted this used both:
  //   `side: 'left'`                     written straight into the record
  //   `const food = opts?.food ?? 'pear'` a fallback that lands in one
  const matches = [
    ...code.matchAll(/(\w+)\s*:\s*('[^']+'|[0-9]+)/g),
    ...code.matchAll(/(?:const|let)\s+(\w+)\s*=[^;]*\?\?\s*('[^']+'|[0-9]+)/g),
  ];
  for (const m of matches) {
    const [, field, value] = m;
    if (!fieldNames.has(field) || DEFAULT_ALLOWED[field]) continue;
    if (invented.some((i) => i.file === file && i.no === no && i.field === field)) continue;
    invented.push({ file, no, field, value, code: code.trim() });
  }
}

const reportInvented = () => {
  if (!invented.length) {
    console.log('\nNo model field is written with a hardcoded literal.');
    return;
  }
  console.log(`\nPOSSIBLE INVENTED DEFAULTS  (${invented.length})`);
  console.log('A record should contain what happened, not what the app assumed. Repeating the');
  console.log("parent's own last value is fine; a literal here is the app deciding for them.");
  for (const i of invented) console.log(`\n  ${i.field} = ${i.value}\n    ${i.file}:${i.no}  ${i.code.slice(0, 110)}`);
};

const reportAmbiguous = () => {
  if (!ambiguous.length) return;
  console.log(`\nSHARED NAMES — check by hand  (${ambiguous.length})`);
  console.log('Used by more than one interface, so grep cannot attribute them: ' + ambiguous.join(', '));
};

if (findings.length === 0) {
  console.log('CDSE sweep: no capture/surface gaps found.');
  reportInvented();
  reportAmbiguous();
  process.exit(0);
}

for (const kind of ['surfaced-never-captured', 'captured-never-surfaced', 'modelled-only']) {
  const group = findings.filter((f) => f.kind === kind);
  if (!group.length) continue;
  console.log(`\n${kind.toUpperCase().replace(/-/g, ' ')}  (${group.length})`);
  console.log(EXPLAIN[kind]);
  for (const f of group) {
    console.log(`\n  ${f.iface}.${f.field}`);
    for (const l of [...f.writes, ...f.reads].slice(0, 4)) console.log(`    ${l.trim()}`);
  }
}
reportInvented();
reportAmbiguous();
console.log(`\n${findings.length} field(s) need a decision. Each is either a gap to close or an entry in ALLOWED with a reason.`);
