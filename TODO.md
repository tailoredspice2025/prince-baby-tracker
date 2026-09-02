# DenBaby — open work, by theme

Summary only. Detail lives in `FEEDBACK.md` (build-15 items) and
`BACKLOG.md` (voice + carried items).

---

## 0 · Where things actually are — 3 Aug 2026

| | Build | State |
| --- | --- | --- |
| **LIVE on the App Store** | 1.0.1 **build 21** | Approved and released 3 Aug |
| **Ready to build** | 1.0.2 **build 22** | Stops the app inventing what you logged — §11 |

**Version must be 1.0.2 for build 22.** 1.0.1 is released, and a released
version cannot take another build — the next release needs its own version
record, created in App Store Connect via **+ Version**.

Everything in §1–§6 is now live. Builds 17–20 were superseded before reaching
anyone; the detail is in git history and `BUILD_RELEASE.md`'s landmine table,
which is where it belongs now that it is no longer the current state.

### What 1.0.1 fixed, and what it cost to learn

Five defects, four builds, because the first three attempts each fixed the
reported instance rather than the class:

1. **Seeded sample data reached real parents** — 1,565 fabricated records
   including two vaccines marked *given* and a fever episode, all of which fed
   "Export for pediatrician". Stripped at onboarding, and removed from existing
   installs by the v3→v4 migration.
2. **A daily 18:00 notification nobody set**, armed at every launch from the
   seeded Vitamin D. Nothing at launch now reads persisted state before
   `persist.hasHydrated()`, and a seeded id is never armed.
3. **The reminder kept firing after the dose was logged.** It was one
   `repeats: true` alarm, and iOS runs no code when a local notification is
   delivered — so "already given" has to be decided when scheduling. Reminders
   are dated one-shots in a rolling window now.
4. **A newly added medicine reminded tomorrow, not today**, because the form
   defaulted `lastGiven` to `Date.now()` and stamped a dose nobody gave.
5. Plus: a way out of every modal, readable date pickers, editable records
   throughout, and a real iPad layout.

**The two rules that came out of it**, both now mechanical rather than
remembered — see `.claude/skills/cdse/` and `npm run cdse`:

- A rule written inside a component has exactly one caller. `isDueToday` was
  correct and unreachable, so the banner cleared and the alarm did not.
- A record must contain what happened, not what the app assumed. Three builds
  shipped a value nobody entered.

---

## 1 · Dates & correcting mistakes — ✅ live in 1.0.1
*Detail: `FEEDBACK.md` #2, #4*

- `DateField` now on all five add forms, floored at DOB and capped at today
- Update + delete added for measurement, sickness, medication, milestone
- Growth has a History list — tap to edit, delete with undo
- Still open: should quick-log tiles let you set a past time **at log time**?
  (today you log then edit — recoverable, but logging after the fact is normal)

## 2 · Forms & input — ✅ live in 1.0.1
*Detail: `FEEDBACK.md` #1, #3*

- Shared `FormScreen` scaffold; every screen with an input is now covered
- Tapping anywhere in a field opens the keypad

## 3 · Getting out of screens — ✅ live in 1.0.1
*Detail: `FEEDBACK.md` #6*

- Shared `ModalHeader` (back chevron + title) on all nine modal screens

## 4 · Theming third-party controls — ✅ live in 1.0.1
*Detail: `FEEDBACK.md` #5*

- `ThemedDateTimePicker` wrapper always passes `themeVariant`; no bare
  `DateTimePicker` remains in the codebase

## 5 · Reminders — ✅ live in 1.0.1
*Detail: `FEEDBACK.md` #7–#9*

- "due today" banner clears once logged; bell opens Health
- "Remind me daily" toggle + time picker; medicines tappable to edit or delete
- Reminders now cancel when switched off, not just reschedule

## 6 · Health entry points & iPad — ✅ live in 1.0.1
*Everything build 18 has, plus the items below.*

Build 18 strips the sample data, which exposed gaps that were previously
hidden by a seeded Vitamin D medicine always existing.

0. ✅ **Launch no longer arms a reminder nobody set** — see §0. The item that
   makes 19 rather than 18 the release worth submitting.
1. ✅ **"Add an illness" and "Add a medicine" buttons on Health.** Vaccines had
   two ways in and the other two sections had none; after the strip those
   sections are empty with no visible route out. All three now share one
   `AddButton`, and each section has an empty state that says so.
2. ✅ **Home tile stops inventing a medicine.** `defaultMedicine()` repeats the
   last dose given, or a single ongoing medicine — and with nothing to repeat
   the tile opens the form instead of logging a hardcoded Vitamin D.
3. ✅ **Long-press picker lists YOUR medicines**, ongoing first, with "Add a
   medicine" underneath. A parent giving B, C and D separately can now choose;
   the tile refuses to guess between them.
4. ✅ **Sickness rows tappable to edit and delete.** `SicknessFormScreen` takes
   an `episodeId`, and gained a "Better now" toggle that closes the episode.
   `updateSicknessEpisode`/`deleteSicknessEpisode` finally have a caller.
5. ✅ **`+` sheet labels match the screens they open** — all five read "Add …",
   and the two form titles were changed to match rather than the other way
   round.
6. ✅ **iPad layout.** `src/theme/layout.ts`: at or above 768pt every scroll
   view is capped at 700pt and centred. Tiles were stretching to ~480pt each
   with the text still phone-sized. Store screenshots re-rendered to match —
   `tools/store-screenshots/`.

**Not done, deliberately:** temperature is still glued into the sickness title
string. That is a model change and belongs with §7, not a UI build.

## 6b · Build 22 — the app stops inventing what you logged
*✅ done, ready to build. 1.0.2.*

Five values were written into records nobody entered, all in `logQuickEvent`:

| | was | now |
| --- | --- | --- |
| solids | `food ?? 'pear'` | repeat your last food, else ask |
| pump | `side: 'left'` on every pump | only when chosen; offered in the picker |
| bottle | `notes: 'Formula'` on every bottle | removed — many are breastmilk |
| diaper | `kind ?? 'wet'` | repeat your last, else ask |
| bottle / pump | `?? 120` / `?? 90` | repeat your last, else ask |

**One rule across all five tiles:** a tap repeats what you actually did last;
with nothing to repeat, the picker opens instead of the app guessing. Repeating
your own last value is not invention — that number came from you. The first tap
of each type costs one extra tap, once.

`side` is now genuinely chosen, so it is shown on the timeline row. Before, the
only place it appeared was the edit sheet — the screen you go to in order to
correct it.

**The sweep now catches this class.** `npm run cdse` gained an *invented
default* check: any model field written with a hardcoded literal in `store.ts`
or a form screen. Verified by reintroducing the three real bugs
(`?? 'pear'`, `side: 'left'`, `notes: 'Formula'`) and confirming each is
flagged. Nine legitimate literals are exempted with their reasons — `status`,
`role`, `id`, `colorKey`, `loggedCount`.

**Still open:** a quick-log tile stamps `new Date()`, so a feed logged forty
minutes late records the wrong time. Recoverable by tapping the row, but
logging after the fact is the normal case. Deciding between a time control in
the picker and an Edit action on the toast — see §1.

## 7 · Health redesign — the model change
*After 1.0.2. Do this BEFORE Family Sync — sync carries whatever model exists, and
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
*Detail: `RELEASE_v1.1.md`. Order: 1.0.2 → Health redesign → Family Sync (1.1)*

- Code complete and Firebase-verified; runbook corrected for the v1.0 cycle
- ✅ **Blocker cleared in build 18** — seeded data is stripped at onboarding,
  so there is nothing fabricated to upload
- **Order: 1.0.2 (build 22) → Health redesign → Family Sync (1.1)**

## 10 · Loose ends
- **Sickness date range reads "30 Jun – 1" across a month boundary.**
  `HealthScreen` prints the end date as `{ day: 'numeric' }` only, which is
  fine inside one month ("12 Jul – 18") and nonsense across two. Found while
  re-rendering the store screenshots for build 21 — the sample had to be moved
  inside a single month to avoid showcasing it. Fix with the Health redesign.
- Night-feeding screen: hidden in v1.0, needs its own honest control if it
  returns (`FEATURES.nightFeedingView`)
- ~~`SleepEvent.wokeCount` — modelled, never used~~ — deleted in build 20,
  along with `Milestone.achieved` (milestones live in two arrays, so the flag
  was redundant). Both found by `npm run cdse`.
- Sleep sessions count on the start day while minutes split across midnight —
  document the choice
- At v1.1: update the App Store privacy label (Family Sync collects data)

## 11 · Yours, outside the repo
- ~~App Store description: "coming soon" line for voice~~ — dropped by
  decision; the listing now makes no forward-looking claims at all
- ~~Resolution Center: reply explaining the crash fix~~ — moot, 1.0.1 was
  approved without a further query
- Keywords say `diaper` on an English (U.K.) listing; `nappy` is the term a UK
  parent searches. 12 of 100 characters used — free to add. Product decision,
  since the app's own UI says "Diaper".
- ✅ Privacy policy: voice and Family Sync marked "not in the current
  version" (docs/index.html, live via GitHub Pages)

---

---

## Release history
Per-build detail lives in git history and in `BUILD_RELEASE.md`'s landmine
table. Keeping a running list here went stale the moment a build was
superseded, and a stale status table is what made "is this fixed?" take four
exchanges to answer.

- **1.0.1 (build 21)** — live 3 Aug 2026. See §0.
- **1.0.0 (build 16)** — the first release.
