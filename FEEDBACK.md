# DenBaby — testing feedback & fix backlog

Real-world testing notes. Newest first.

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
