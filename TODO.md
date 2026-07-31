# DenBaby — open work, by theme

Summary only. Detail lives in `FEEDBACK.md` (build-15 items) and
`BACKLOG.md` (voice + carried items).

---

## 1 · Dates & correcting mistakes  ← biggest theme
*Detail: `FEEDBACK.md` #4*

- Measurements, vaccines-given, sickness, medication and milestones all stamp
  **today** and can't be backdated
- Measurements are worst: the growth chart derives age from that date, so the
  **WHO percentile is wrong**
- No update/delete for measurement, sickness, medication, milestone
- `DateField` exists but is used by **none** of the five add forms
- Decide: should quick-log tiles let you set a past time at log time?
- ✅ Trends themselves are correct — events carry real timestamps

## 2 · Forms & input
*Detail: `FEEDBACK.md` #1, #3*

- Save button sits behind the keyboard on **10 of 11 forms** (Onboarding
  included — first screen a reviewer sees)
- Measurement fields: keypad only opens on a sliver at the far left
- Fix once via a shared form wrapper + shared field, not per screen

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

## Shipped in build 15 (pending your device test)
Sleep crash fix · sleep start/end shown and editable · edit sheet field-aware
for all six event types · night view removed · moon = light/dark · voice hidden
· `UIBackgroundModes` removed · App Lock Face ID loop fixed · ESLint +
`rules-of-hooks` · root error boundary
