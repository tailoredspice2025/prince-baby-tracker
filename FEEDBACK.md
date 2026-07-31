# DenBaby — testing feedback & fix backlog

Real-world testing notes. Newest first.

---

## From TestFlight build 15 testing — 30 Jul 2026 → **open, to fix as a batch**

| # | Issue | Status |
|---|---|---|
| 1 | Add-measurement fields are clunky — the keypad only opens if you tap a narrow strip at the far left of the box | ⬜ open |
| 2 | No way to add a measurement for a specific date — and no way to edit or delete one afterwards | ⬜ open |

**#1 diagnosis (done, fix pending).** `AddMeasurementScreen.tsx:20`: the
`TextInput` sits in a `flexDirection: 'row'` with **no `flex: 1`** and
`padding: 0`. A row lays children out at their content width, and an empty
input whose placeholder is a single `0` is about one character wide — so the
only touchable region is a sliver on the left. The label, the unit suffix and
all the surrounding white space aren't touchable at all, which is why tapping
the obvious target does nothing.

Fix it as a **class, not an instance** — this is the same mistake as fixing the
120 ml bottle default while solids, nappy and medicine kept theirs:

- `flex: 1` on the input plus real vertical padding, so the hit area fills the
  row and is tall enough to hit.
- Wrap the whole card in a `Pressable` that focuses the input through a ref, so
  tapping **anywhere** in the field opens the keypad.
- Do it once in a shared field component and adopt it everywhere.

Candidates to re-check when fixing (a `TextInput` only shrinks like this when
it's inside a **row** — the ones laid out in a column are already full width,
so this list needs filtering, not blanket editing): `FormField.tsx`,
`EventEditSheet.tsx`, `ProfileScreen.tsx`, `OnboardingScreen.tsx`.

**#2 diagnosis (done, fix pending).** `AddMeasurementScreen.tsx:47` hardcodes
`date: new Date().toISOString()`. There is no date field on the form. Traced
through the chain, the damage is bigger than the missing control:

| Link | State |
|---|---|
| Capture | ❌ date never captured — every entry is stamped "today" |
| Derive | ❌ `GrowthChart` plots against **age** (`date − dob`), so a backdated weight lands at the wrong age |
| Surface | ❌ the point sits at the wrong place on the WHO curve, so **the percentile shown is wrong** — the whole purpose of the screen. The "+X g since last measurement" caption is also meaningless when everything shares one timestamp. |
| Editable | ❌ the store has `addMeasurement` only — **no update, no delete** — and nothing in Growth is tappable. A mistyped 65 kg is in the chart permanently. |

Backdating is the primary use case, not an edge case: weights come from clinic
and health-visitor appointments and get typed up later from the red book. As
built, the feature only works if you're holding the phone at the scales.

**Fix:**
- Put the existing `DateField` (already built for date of birth) on the form,
  defaulting to today, **capped at today and floored at the baby's date of
  birth** — a measurement before birth or in the future is always wrong.
  `addMeasurement` already takes a `date`, so only the UI needs adding.
- Add `updateMeasurement` and `deleteMeasurement` to the store, with the same
  `syncWrite` / `syncDelete` treatment the events get.
- Make the Growth screen list measurements and open an edit sheet on tap,
  mirroring `EventEditSheet` — every stored field visible and correctable.
- Re-check that the chart re-sorts correctly once dates can be out of order:
  `GrowthScreen.tsx:31` sorts by date, so backdated entries must land in the
  right place in the curve, not just at the end.

_(Add further build-15 feedback under this table as it comes in.)_

---

## From TestFlight build 11 — 30 Jul 2026 → all fixed in **build 12**

| # | Issue | Status |
|---|---|---|
| 10 | **App crashed on sleep start/stop** | ✅ `HomeScreen` called four `useMemo`s *below* an early `return` for the night view. Starting a sleep after 20:00 flipped that flag, the hook count changed mid-render, React threw. Now a pure switch between `DayHomeView` / `NightHomeView`. |
| 11 | Sleep record showed only one time, not start **and** end | ✅ rows read `Sleep · 1h 20m` / end time / `9:15 PM – 10:35 PM · logged by you` |
| 12 | Sleep entry could not be edited properly | ✅ edit sheet now has **Fell asleep** + **Woke up** with a live duration; both ends save together |
| 13 | Nothing appeared in Today while a sleep was running | ✅ live "Sleeping · 12m · started 9:15 PM" row, tap to end |
| 14 | *(found by audit, not reported)* solids/diaper/medicine had hardcoded defaults and **no way to correct them** | ✅ edit sheet is field-aware for all six types: food, nappy kind, pump side, medicine name + dose |
| 15 | *(found by audit)* medicine dose stored but never displayed | ✅ shown on the row |
| 16 | Night view took over the screen on its own | ✅ opt-in only — moon button on Home, **Exit** inside it; forces night colours |

**Root-cause notes.**

*Why the crash reached a build.* The illegal early return had been there a
while, but the flag above it used to come from the system colour scheme, which
never changes mid-session — so the hook count never actually varied. Fix #3 in
build 11 re-pointed that flag at `runningSleepSession`, which flips at runtime,
turning a dormant bug into a guaranteed crash. It also only fires between 20:00
and 06:00, so daytime testing could never see it. Both gaps are now closed:
ESLint's `react-hooks/rules-of-hooks` catches the pattern statically (it flags
the exact line with "did you accidentally call a React Hook after an early
return?"), and `RELEASE_QA.md` §1b requires clock-gated behaviour to be tested
inside its window.

*The one that mattered more than the crash.* Sleep stores two timestamps and
derives a duration from the pair. The edit sheet wrote `startTime` and left
`endTime` untouched — so correcting a mis-tapped start silently rewrote the
duration feeding the daily total, the trend chart and the weekly average. Data
corruption behind a clean UI, and nobody would have noticed. Hence the rule now
in §1b: *any edit path touching one input of a derived value must touch all of
them.*

*Why items 14–15 were found late.* Build 10's item #4 was reported as "bottle
defaults to 120 ml with no way to change it". That was fixed for bottle alone,
when the same bug sat in solids (`'pear'`), diaper (`'wet'`), pump side
(`'left'`) and medicine (`'Vitamin D drops'`) the whole time. Fixing the
reported instance instead of the class is what put the tester back in the QA
seat. §1b's matrix is per-type for exactly this reason.

---

## From TestFlight build 10 — 30 Jul 2026 → all fixed in **build 11**

| # | Issue | Status |
|---|---|---|
| 1 | Onboarding date of birth was free text | ✅ date picker (capped at today), also in Add-baby |
| 2 | Sex selector ambiguous — "says Boy and blank" | ✅ root cause was selected-chip white-on-white in dark mode; new themed Segmented control |
| 3 | System dark mode forced the stripped Night screen | ✅ in-app Appearance toggle (Light/Dark/Auto, default Light); night screen decoupled |
| 4 | Bottle defaulted to 120 ml, no way to change | ✅ now repeats the last amount logged; long-press picker advertised on tiles |
| 5 | Unclear where logged entries appear | ✅ "Today · N" list is genuinely today's entries, with empty state + edit hint |
| 6 | Edit-entry sheet unusable (keyboard hid Save; tapping away discarded) | ✅ keyboard-avoiding layout, pinned Save, Cancel, no discard once edited |
| 7 | Event time was typed text | ✅ tap-to-pick time picker; amount has −/+ steppers |
| 8 | App icon bottle/baby too small | ✅ scaled to ~73% of the canvas (was ~52%) |
| 9 | No way to say who you are; entries showed a random caregiver | ✅ "Your name" at onboarding + editable in Profile; own entries read "logged by you" |

Bonus found while fixing #2: the same white-on-white bug also hid the
selected option on the **Growth** (weight/height/head) and **Trends**
(day/week/month/year) selectors in dark mode — fixed in the shared control.

---

## Details on the notable ones

**#3 dark mode → night screen.** `useComputedNightMode()` treated
`systemScheme === 'dark'` as "it's night", so any phone in dark appearance
was permanently shown `NightHomeView` (feed + diaper only, no timeline).
Colour theme is now user-controlled and separate; the minimal night screen
appears only during an active sleep session in night hours.

**#9 caregiver identity.** Solo installs defaulted to the demo caregiver
(`currentCaregiverId: 'cg-mom'`). Now this device has its own caregiver
(`cg-me`), named by you. Persist migration **v2 → v3** re-points existing
solo installs and re-attributes anything logged as a demo caregiver;
family-linked installs are untouched (their id is the Firebase uid).

---

_(Add new testing feedback above this line as it comes in.)_
