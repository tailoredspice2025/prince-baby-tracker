# DenBaby — open work, by theme

Summary only. Detail lives in `FEEDBACK.md` (build-15 items) and
`BACKLOG.md` (voice + carried items).

---

## 0 · Where things actually are — re-baselined 3 Aug 2026

| | Build | State |
| --- | --- | --- |
| **On the App Store** | 1.0.0 **build 16** | What every user has today |
| **Uploaded, not submitted** | 1.0.1 **build 18** | Sitting in App Store Connect, never released |
| **In the repo, not built** | — | Screenshot tool, and the launch-reminder fix below |

**Build 17 was superseded, not shipped.** Two commits titled "Build 17"
(`a6b13b3`, `6d5e19b` — the banner clearing and settable medicine reminders)
actually landed *after* the build-17 bump, so they are in build 18. Nothing in
build 17 reached anyone; treat 16 → 18 as the real jump.

**Everything below §1–§5 that says "done" or "staged" is done in code and NOT
on any phone.** The live build is 16. That is why the Vitamin D reminder still
behaves the way it did before those fixes.

### The Vitamin D reminder, precisely

Three separate defects, one symptom:

1. **The banner never clears.** Build 16 asks `medications.find(m => m.ongoing
   && m.reminderTime)` with no reference to `lastGiven`, so it shows on every
   launch forever. *Fixed in build 18 — not released.*
2. **The banner logged the wrong thing.** Its tap called `logQuickEvent
   ('medicine')` bare, which reuses the previous event's name. *Fixed in build
   18 — not released.*
3. **A real 18:00 iOS notification is armed at every launch**, from the seeded
   `med-1` "Vitamin D drops" nobody created. **Build 18 does NOT fix this** —
   see below.

### Found while re-baselining: build 18 does not close #3

`App.tsx` armed reminders in a `useEffect` that read `medications` at first
render. The store's initial state *is* the demo seed and `persist` fills it in
from AsyncStorage asynchronously, so that snapshot always contains `med-1`,
whatever is actually stored. Build 18's v3→v4 migration cancels it — but the
migration runs once, on the version bump, and this effect runs every launch.
So build 18 cancels the notification on the first launch after updating and
re-arms it on the second.

Fixed now in `src/lib/bootReminders.ts` + `App.tsx`: nothing is armed until
`persist.hasHydrated()`, and a seeded id is never armed at all. Three tests in
`regression.test.ts`. The same gate also fixes family sync failing to
reconnect on launch, which had the same cause (`familyId` still null).

**This has to go into build 19.** Releasing build 18 alone would not stop the
6pm alarm.

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

## 6 · Build 19 — the one to actually release
*Half a day. Carries everything in build 18 plus the launch-reminder fix.*

Build 18 strips the sample data, which exposes gaps that were previously
hidden by a seeded Vitamin D medicine always existing.

0. ✅ **Launch no longer arms a reminder nobody set** — done, see §0. This is
   the item that makes 19 rather than 18 the release worth submitting.

1. **"Add a medicine" and "Log an illness" buttons on Health.** Vaccines have
   two add buttons; the other two sections have none. After the strip those
   sections are empty with no way in — the only route is the **+** tab button,
   which nobody looks for while standing in the section.
2. **Home tile stops inventing a medicine.** `logQuickEvent('medicine')` falls
   back to a hardcoded `'Vitamin D drops' / '400 IU'` when no dose has been
   logged before. A new user who adds "Paracetamol" then taps the tile gets a
   vitamin they never mentioned.
3. **Long-press picker lists YOUR medicines**, not the hardcoded five. This is
   what makes multiple vitamins usable — a parent giving B, C and D separately
   currently cannot choose between them.
4. **Sickness rows tappable to edit and delete.** `updateSicknessEpisode` and
   `deleteSicknessEpisode` exist in the store with no screen calling them.
5. **`+` sheet labels match the screens they open.** It currently reads "Add
   measurement · Log vaccine · Log sickness · Log medicine · Add memory" —
   mixed verbs, and "Log medicine" opens the screen that *creates* a medicine.
6. **iPad layout.** `supportsTablet` is on, so the listing needs iPad
   screenshots, but the app just stretches the phone layout: each tile becomes
   ~480pt wide, the text stays phone-sized, and half the screen is empty. Fix
   is small — cap the content at ~776pt centred and scale type and spacing by
   ~1.25 above the tablet breakpoint. Until it ships, only the
   `ipad-13-current` screenshots can be uploaded (see
   `tools/store-screenshots/README.md`).

## 7 · Health redesign — the model change
*After 19. Do this BEFORE Family Sync — sync carries whatever model exists, and
changing it afterwards means migrating the cloud copy too.*

**The problem.** Three unlinked concepts: a `Medication` (what they take), a
`MedicineEvent` (one dose), a `SicknessEpisode` (a period of illness). Nothing
connects them, so the app can't produce the sentence a parent would say to a
doctor: *"fever Tuesday to Thursday, peaked at 38.1, Calpol three times."*

1. **Temperature becomes real data.** `SicknessFormScreen` has a Temperature
   field, and `save()` glues it into a *title string* — `Fever · 38.1°C`. The
   model has no temperature field at all, so nothing can chart it and you can't
   add a second reading. Needs `readings: { at, tempC }[]` and a way to add one
   to an open episode. Third instance of "captured from the user, then folded
   into a display string" — see solids food and pump side in `BACKLOG.md`.
2. **A dose links to its medicine.** Health then shows one row per medicine
   with *"last given today 6:04 PM"* — **not** a list of every dose, which
   after a week of vitamins would be unreadable. Individual doses stay on the
   Home timeline and day log, where a chronological list belongs.
3. **A dose can attach to an open illness.** The fever reads "Calpol ×3"; the
   Calpol row reads "3 doses for Mild fever". Same link, read from either end.
4. **Group reminders by time.** Three vitamins at 6pm currently schedule three
   separate notifications — three buzzes for one moment in the evening, which
   is how people end up turning reminders off. One notification per slot:
   *"3 medicines due: Vitamin B, C, D"*, with the Home banner logging all three
   in one tap.

**Naming decisions already made:** the Home tile stays **"Medicine"** (it means
*gave a dose*, and works for Calpol at 2am as well as vitamins — "Daily
vitamins" would be wrong the moment the baby is ill). No new Home tile for
sickness — an illness is entered once and edited once, so it belongs in Health;
if it needs presence on Home it's a contextual banner, not a seventh tile.

**Mockup:** `docs/health-redesign-mockup.html` (open in a browser) — illness at the top with the open episode
outlined, temperature strip, medicines with "last given", vaccines with the
scheduled one first.

## 8 · Voice logging — UNSCHEDULED, not a priority
*Detail: `BACKLOG.md`. Hidden behind `FEATURES.voiceLogging`*

- **Capture doesn't work on device** — fix first, alone, nothing else counts
  until a spoken phrase reaches the parser
- Then: open-ended sleep poisons Trends · time parsing wrong · spoken values
  dropped · "Edit" button dead · no undo · silent permission failures

## 9 · Family Sync
*Detail: `RELEASE_v1.1.md`*

- Code complete and Firebase-verified; runbook corrected for the v1.0 cycle
- ✅ **Blocker cleared in build 18** — seeded data is stripped at onboarding,
  so there is nothing fabricated to upload
- **Order: 1.0.1 (build 18) → 1.0.2 (build 19) → Health redesign → Family Sync**

## 10 · Loose ends
- Night-feeding screen: hidden in v1.0, needs its own honest control if it
  returns (`FEATURES.nightFeedingView`)
- `SleepEvent.wokeCount` — modelled, never used: surface it or delete it
- Sleep sessions count on the start day while minutes split across midnight —
  document the choice
- At v1.1: update the App Store privacy label (Family Sync collects data)

## 11 · Yours, outside the repo
- ~~App Store description: "coming soon" line for voice~~ — dropped by
  decision; the listing now makes no forward-looking claims at all
- Resolution Center: reply explaining the crash fix (NOT "What's New" —
  that field only shows on updates, not a first release)
- ✅ Privacy policy: voice and Family Sync marked "not in the current
  version" (docs/index.html, live via GitHub Pages)

---

## Uploaded as 1.0.1 build 18 — NOT released
Back control on every modal screen · date pickers readable whatever the phone
theme · vitamin banner clears once logged · bell opens Health · medicine
reminders can be set, retimed, added and deleted · 1,565 seeded records
stripped, including two vaccines marked *given*.

Still sitting in App Store Connect. See §0 — shipping it alone leaves the 6pm
Vitamin D notification in place, so build 19 is the one to release.

## Shipped in build 16
Everything below, plus: dates on every record · measurement history with edit
and delete · keyboard never covers a save button · tap-anywhere fields

## Shipped in build 15
Sleep crash fix · sleep start/end shown and editable · edit sheet field-aware
for all six event types · night view removed · moon = light/dark · voice hidden
· `UIBackgroundModes` removed · App Lock Face ID loop fixed · ESLint +
`rules-of-hooks` · root error boundary
