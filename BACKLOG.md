# DenBaby — backlog

Deferred work, with the reasoning kept so nobody has to rediscover it.

---

## Voice logging — deferred, UNSCHEDULED

**Not a priority until raised.** Explicitly kept out of 1.1, which is Family
Sync only. Nothing below is scheduled work.

**Status: hidden.** `FEATURES.voiceLogging = false` in
`src/lib/features.ts`. All screens, the parser and the store paths are still in
the tree and still compile; flipping that one boolean brings the UI back.

**Why it was pulled.** It does not work. Holding the mic captures nothing on
device, so every attempt falls through to the "Didn't catch that" screen —
whose shortcut chips then log hardcoded default entries, which reads as "the
app ignored me and logged something I didn't say". Everything below item 0 is
downstream of a transport that never delivers a word.

### 0. ⛔ Capture — fix first, alone

Nothing else in this list may be started until a device test shows a spoken
phrase reaching `parseVoiceTranscript` intact.

- Reproduce on hardware and identify which of these it is (ranked):
  1. **The modal steals the gesture.** `startVoiceHold()` opens
     `VoiceListeningSheet` as a `Modal` on `onPressIn`; the modal can take the
     touch responder, firing `onPressOut` milliseconds later — before `start()`
     has finished awaiting permissions.
  2. **Interim results are discarded.** `useVoiceRecognition.ts:15` writes
     `finalTranscriptRef` only when `isFinal === true`. With
     `continuous: true`, iOS may never emit a final result before release, so
     `stop()` resolves empty even though text was recognised.
  3. **The `stop()` race.** `isListening` is set after the `await` in
     `start()`, so an early `stop()` short-circuits and resolves empty. The
     effect also closes over a stale `stop` (deps `[visible, holdActive]` with
     an `exhaustive-deps` disable at `VoiceListeningSheet.tsx:57`).
- Add a hard timeout so the mic can't stay open if `onPressOut` is missed.
- **Acceptance: speak "bottle 120 ml" and see your own words on screen as you
  talk, then see them arrive in the parser.** Nothing below counts until this
  passes on a real phone.

### 1. Data integrity

- **Open-ended sleep credits 24 h/day to every subsequent day in Trends.**
  A voice sleep with no end writes `endTime: undefined`; `stats.ts:108` reads a
  missing end as "still asleep, count until now". Measured over ten days:
  `07-21=24.0h 07-22=24.0h … 07-29=24.0h`. Either require an end time or write
  a running session instead of an event. The tap flow can't do this —
  `toggleSleep` only writes an event when you stop it.

### 2. Parser

- **Time resolution is wrong.** `"slept 2 to 4"` returns 2 PM–4 PM whenever
  it's spoken — 09:00, 14:00, 22:00 all give the same answer — and that string
  is the app's own printed example (`VoiceListeningSheet.tsx:200`).
  `"bottle 120 ml at 11"` said at 10:00 logs 11:00, in the future; the comment
  at `voiceParser.ts:16` claims it avoids future readings and no such check
  exists. Needs "prefer the most recent past reading" plus overnight handling,
  and a **test table of ~30 utterances** — this part cannot be eyeballed.
- **Spoken values are parsed then dropped.** Solids never extracts the food at
  all; pump parses `side` into `raw` and `applyVoiceDraft` never reads it. Fix
  at the type level: put `food` and `side` on `ParsedVoiceDraft` rather than the
  untyped `raw` bag — that bag is what let sleep's `endTime` go missing too.
- Diaper `both` is unreachable (`dirty` is tested first, so "wet and dirty"
  logs dirty). Bottle drafts claim "· formula" but save no note.

### 3. Correction and feedback

- **The "Edit" button does nothing** — its handler only cancels the countdown
  (`VoiceListeningSheet.tsx:176`). There is no edit UI at all.
- **No undo on voice logs.** `applyVoiceDraft` pushes no toast; every tap-log
  gets one. The "3-second undo window" in the code comment is a delay *before*
  saving, not an undo *after*.
- **Permission denial and recognition errors are silent.** `start()` returns
  `false` when the mic is denied and the caller ignores it; the `error` handler
  resolves with partial text and surfaces nothing. Both dead-end at "Didn't
  catch that" — permanently, since iOS won't re-prompt.
- **The "Didn't catch that" chips log canned defaults.** They call
  `logQuickEvent(t)` with no options: bottle → 120 ml, diaper → wet, solids →
  pear. They should open the picker so the amount is chosen. The `sleep` chip
  calls `toggleSleep()`, so it silently starts — or ends — a sleep session from
  an error screen.

### 4. Presentation

- The voice sheet hardcodes `#fff` / `#43382F` and renders white in dark mode.
  It reads `theme` and never uses it (the linter flags the unused variable).
- Pump auto-log is off by default, yet the sheet still says "Got it — logging"
  with a green tick and then doesn't.

### 5. Re-enabling

- Flip `FEATURES.voiceLogging` to `true`.
- Restore the "Voice logging 📱" section in `RELEASE_QA.md` and the README
  notes at lines 10, 21 and 45.
- Re-check the App Store privacy nutrition label and the live privacy policy
  for microphone / voice data.
- `UIBackgroundModes: ["audio"]` was removed from app.json in build 12. Only
  add it back if v1.1 genuinely supports background listening — Apple asks
  apps to justify it (guideline 2.5.4), and it was declared-but-unused before.

---

## Carried over from the sleep audit

- **`SleepEvent.wokeCount`** is modelled, never written and never shown.
  Surface it or delete it from the model — per `AUDIT.md`, a stored field with
  no screen is a bug either way.
- **Sleep session attribution.** `stats.ts` splits sleep *minutes* across
  midnight into both days but counts the *session* on the start day. Defensible,
  but it should be a documented decision rather than an accident.
