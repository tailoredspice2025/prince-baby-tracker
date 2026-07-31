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

## 3 · Getting out of screens — ✅ staged in build 17
*Detail: `FEEDBACK.md` #6*

- Shared `ModalHeader` (back chevron + title) on all nine modal screens

## 4 · Theming third-party controls — ✅ staged in build 17
*Detail: `FEEDBACK.md` #5*

- `ThemedDateTimePicker` wrapper always passes `themeVariant`; no bare
  `DateTimePicker` remains in the codebase

## 5 · Reminders — ✅ staged in build 17
*Detail: `FEEDBACK.md` #7–#9*

- "due today" banner clears once logged; bell opens Health
- "Remind me daily" toggle + time picker; medicines tappable to edit or delete
- Reminders now cancel when switched off, not just reschedule

## 6 · Voice logging — UNSCHEDULED, not a priority
*Detail: `BACKLOG.md`. Hidden behind `FEATURES.voiceLogging`*

- **Capture doesn't work on device** — fix first, alone, nothing else counts
  until a spoken phrase reaches the parser
- Then: open-ended sleep poisons Trends · time parsing wrong · spoken values
  dropped · "Edit" button dead · no undo · silent permission failures

## 7 · Family Sync (v1.1)
*Detail: `RELEASE_v1.1.md`*

- Code complete and Firebase-verified; runbook corrected for the v1.0 cycle
- ⛔ **Blocker:** seeded demo data would upload and sync to both parents —
  clear it on completing onboarding first
- Order: 1.0 approved → 1.0.1 (build 17) → 1.1

## 8 · Loose ends
- Night-feeding screen: hidden in v1.0, needs its own honest control if it
  returns (`FEATURES.nightFeedingView`)
- `SleepEvent.wokeCount` — modelled, never used: surface it or delete it
- Sleep sessions count on the start day while minutes split across midnight —
  document the choice
- At v1.1: update the App Store privacy label (Family Sync collects data)

## 9 · Yours, outside the repo
- ~~App Store description: "coming soon" line for voice~~ — dropped by
  decision; the listing now makes no forward-looking claims at all
- Resolution Center: reply explaining the crash fix (NOT "What's New" —
  that field only shows on updates, not a first release)
- ✅ Privacy policy: voice and Family Sync marked "not in the current
  version" (docs/index.html, live via GitHub Pages)

---

## Staged in build 17 — built and verified, NOT submitted
Back control on every modal screen · date pickers readable whatever the phone
theme · vitamin banner clears once logged · bell opens Health · medicine
reminders can be set, retimed, added and deleted.
Ready whenever you want to ship 1.0.1.

## Shipped in build 16
Everything below, plus: dates on every record · measurement history with edit
and delete · keyboard never covers a save button · tap-anywhere fields

## Shipped in build 15
Sleep crash fix · sleep start/end shown and editable · edit sheet field-aware
for all six event types · night view removed · moon = light/dark · voice hidden
· `UIBackgroundModes` removed · App Lock Face ID loop fixed · ESLint +
`rules-of-hooks` · root error boundary
