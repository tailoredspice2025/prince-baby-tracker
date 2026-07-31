# DenBaby — open work, by theme

Summary only. Detail lives in `FEEDBACK.md` (build-15 items) and
`BACKLOG.md` (voice + carried items).

---

## 1 · Dates & correcting mistakes — ✅ done in build 16
*Detail: `FEEDBACK.md` #2, #4*

- `DateField` now on all five add forms, floored at DOB and capped at today
- Update + delete added for measurement, sickness, medication, milestone
- Growth has a History list — tap to edit, delete with undo
- Still open: should quick-log tiles let you set a past time **at log time**?
  (today you log then edit — recoverable, but logging after the fact is normal)

## 2 · Forms & input — ✅ done in build 16
*Detail: `FEEDBACK.md` #1, #3*

- Shared `FormScreen` scaffold; every screen with an input is now covered
- Tapping anywhere in a field opens the keypad

## 3 · Voice logging — v1.1
*Detail: `BACKLOG.md`. Hidden in v1.0 behind `FEATURES.voiceLogging`*

- **Capture doesn't work on device** — fix first, alone, nothing else counts
  until a spoken phrase reaches the parser
- Then: open-ended sleep poisons Trends · time parsing wrong · spoken values
  dropped · "Edit" button dead · no undo · silent permission failures

## 4 · Loose ends
- Night-feeding screen: hidden in v1.0, needs its own honest control if it
  returns (`FEATURES.nightFeedingView`)
- `SleepEvent.wokeCount` — modelled, never used: surface it or delete it
- Sleep sessions count on the start day while minutes split across midnight —
  document the choice
- At v1.1: update the App Store privacy label (Family Sync collects data)

## 5 · Yours, outside the repo
- App Store description: "coming soon" line for voice
- What's New: note the launch crash fix
- Privacy policy site: check it doesn't describe voice logging

---

## Shipped in build 16 (pending your device test)
Everything below, plus: dates on every record · measurement history with edit
and delete · keyboard never covers a save button · tap-anywhere fields

## Shipped in build 15
Sleep crash fix · sleep start/end shown and editable · edit sheet field-aware
for all six event types · night view removed · moon = light/dark · voice hidden
· `UIBackgroundModes` removed · App Lock Face ID loop fixed · ESLint +
`rules-of-hooks` · root error boundary
