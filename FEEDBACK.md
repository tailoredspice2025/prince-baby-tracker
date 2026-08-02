# DenBaby — testing feedback & fix backlog

Real-world testing notes. Newest first.

---

## From TestFlight build 16 testing — 30 Jul 2026 → fixed, staged in **build 17**

| # | Issue | Status |
|---|---|---|
| 5 | Vaccine appointment picker: the time is invisible in light mode | ✅ `ThemedDateTimePicker` wrapper passes `themeVariant`; all six pickers swapped, zero bare ones left |
| 6 | No back/cancel on Add memory — had to close the app or swipe by chance | ✅ shared `ModalHeader` (back chevron + title) on all nine modal screens, built into `FormScreen` |
| 7 | Vitamin D "due today" banner reappears even after logging it | ✅ **build 18** — banner now logs the medicine it *names*; build 17's fix was incomplete |
| 8 | Bell icon top-right does nothing | ✅ opens Health, where reminders live |
| 9 | No way to set, edit or add a medicine reminder | ✅ "Remind me daily" toggle + time picker on the medicine form; tap any medicine on Health to edit or delete it |

**#5 diagnosis.** The app has **six** `DateTimePicker`
instances and **`themeVariant` is set on none of them**:

`DateField.tsx` ×2 · `EventEditSheet.tsx` ×2 · `VaccineFormScreen.tsx` ×2

On iOS the picker colours its own text from the **device's** appearance, while
the card behind it is coloured by the **app's** Appearance setting. Phone in
dark mode + app in Light = light text on a white card, i.e. invisible. The
reverse (phone light, app Dark) hides it too.

This is the same root cause as build 11's "says Boy and blank" — a control
coloured by one system sitting inside a container coloured by another. Fixed
then for the segmented control only, not swept. **Fourth time this
instance-not-class pattern has cost a build.**

**Fix once:** wrap `DateTimePicker` in a small themed component that always
passes `themeVariant={theme.mode === 'night' ? 'dark' : 'light'}` (iOS-only
prop; Android ignores it), and use that wrapper everywhere so a raw
`DateTimePicker` can't be added without theming. Worth a lint rule or at least
a note in `AUDIT.md` — **any third-party control that renders its own text must
be told which theme it's in.**

**#6 diagnosis.** `RootNavigator.tsx:25` sets
`headerShown: false` for the whole stack, and **none of the nine modal screens
draw their own exit control**:

`AddMeasurement` · `AddMilestone` · `AddBaby` · `VaccineForm` ·
`MedicineForm` · `SicknessForm` · `InviteCaregiver` · `JoinFamily` ·
`VoicePermissions`

The only ways out are completing the action (each `save()` calls `goBack()`) or
the iOS drag-down gesture on a modal sheet. Not literally trapped — the gesture
works, and Android has system back — but undiscoverable, which is the same
thing for most people. Nobody should have to find their way out by accident.

The codebase already has the right pattern: `DayTimelineScreen` draws a
`ChevronLeftIcon` back control. It was simply never applied to the modals.

**Fix once:** add a header row (title + Cancel/close) to the shared
`FormScreen` so every form gets one for free, and give the two non-form modals
(`VoicePermissions`, `InviteCaregiver`) the same treatment. Not per screen.

**Severity note:** of the open items this is the most likely to affect a
reviewer — someone who opens "Add measurement", decides not to add one, and
looks for a way back. Worth pulling forward if build 16 needs a respin for any
other reason.

**#7 reopened in build 17, fixed in build 18.** Build 17 made the banner check
`lastGiven` and made logging stamp it — but the banner's own tap called
`logQuickEvent('medicine')` **bare**, and that reuses the *most recent medicine
event's* name (`store.ts:321`). So once any other medicine had been logged —
the long-press picker offers five — tapping a banner that said "Vitamin D
drops" logged that other medicine instead. The name never matched, `lastGiven`
was never stamped on the due medication, and the banner stayed exactly as
before. The banner now passes its own `name` and `dose`.

Worth naming the pattern: the fix was verified by reading the two functions I
changed, not by asking what the button actually does. The button had a third
behaviour neither function revealed on its own.

**#7 + #8 original diagnosis.** `DayHomeView.tsx:103` selected the due medicine with
`ongoing && reminderTime` and never looked at `lastGiven`, so the banner
returned on every launch no matter how many doses were logged. The other half:
`logQuickEvent('medicine')` wrote a medicine *event* and never touched
`medication.lastGiven`, so the field that would clear the banner was never
written. Both fixed. The bell had no `onPress` — a styled circle.

**#9 diagnosis.** `reminderTime` is **read** in three places
(`HealthScreen` displays it, `notifications.ts` schedules from it, the Home
banner reads it) and **written in none**. `MedicineFormScreen` doesn't capture
it. The only medications with reminders are the demo-seeded ones, so a user
cannot create a reminder, change its time, or add a second.

`updateMedication` / `deleteMedication` were added to the store in build 16 and
**no screen references them** — medications are add-only in the UI, exactly as
measurements were.

Note the App Store description says "medicines with daily reminders". The
reminders do fire, but only for seeded data — worth closing this gap before
anyone reads that line and goes looking.

**Fixed in build 17:** "Remind me daily" toggle plus a time picker on the
medicine form; medicines on Health are tappable and open for editing or
deletion, finally calling the `updateMedication`/`deleteMedication` the store
has had since build 16. Asking for a reminder marks the medicine ongoing, since
a daily reminder on a PRN medicine makes no sense.

Rescheduling was already safe — `scheduleMedicationReminder` uses a stable
`med-{id}` identifier, so a retime overwrites rather than stacking. But nothing
cancelled when a reminder was switched **off**: the old notification would have
kept firing forever. Added `cancelMedicationReminder`, called on delete and
whenever a medicine loses its reminder or stops being ongoing.

_(Add new build-16 feedback above this line.)_

---

## From TestFlight build 15 testing — 30 Jul 2026 → all fixed in **build 16**

| # | Issue | Status |
|---|---|---|
| 1 | Add-measurement fields clunky — keypad only opened on a strip at the far left | ✅ tap anywhere in the field; `flex: 1` + real padding, fixed in the shared `FormField` too |
| 2 | No date on measurements; no edit or delete | ✅ date picker (floored at DOB, capped at today), History list on Growth, tap to edit, delete with undo |
| 3 | Save button hidden behind the keyboard on 10 of 11 forms | ✅ shared `FormScreen` scaffold + `KeyboardAvoidingView` everywhere; verified 0 screens left uncovered |
| 4 | Every dated record except events stamped "today" | ✅ `DateField` adopted in all five forms; update+delete added for measurement, sickness, medication, milestone |

**#1 diagnosis.** `AddMeasurementScreen.tsx:20`: the
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

**#2 diagnosis.** `AddMeasurementScreen.tsx:47` hardcodes
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

**#3 diagnosis. This was build 10's issue #6 again.**
That was reported as "edit sheet unusable, keyboard hid Save". It was fixed in
`EventEditSheet` and **never swept for elsewhere** — the same mistake as fixing
the 120 ml bottle default while solids, nappy and medicine kept theirs. Third
time this pattern has cost a build.

Swept properly. Before the fix, `KeyboardAvoidingView` was present in exactly one file:

| Screen | KeyboardAvoidingView |
|---|---|
| `components/EventEditSheet.tsx` | ✅ |
| `screens/growth/AddMeasurementScreen.tsx` | ❌ *(reported)* |
| `screens/onboarding/OnboardingScreen.tsx` | ❌ **← reviewer-facing, do first** |
| `screens/profile/ProfileScreen.tsx` | ❌ |
| `screens/health/MedicineFormScreen.tsx` | ❌ |
| `screens/health/SicknessFormScreen.tsx` | ❌ |
| `screens/milestones/AddMilestoneScreen.tsx` | ❌ |
| `screens/onboarding/JoinFamilyScreen.tsx` | ❌ |
| `screens/profile/AddBabyScreen.tsx` | ❌ |
| `screens/profile/InviteCaregiverScreen.tsx` | ❌ |
| `screens/voice/VaccineFormScreen.tsx` | ❌ |

**Onboarding is the one that matters most** — it's the first screen an App
Store reviewer sees, and a Continue button behind the keyboard is how a review
stalls. Not fatal (tapping elsewhere dismisses the keyboard) but it's the worst
possible place for it.

**A sweep for the raw `TextInput` component finds only 5 of these.** The other
seven use the shared `FormField`, so they're invisible to the obvious grep.
When sweeping for a class, follow the abstraction as well as the primitive.

**Fix — once, not eleven times:**
- Build a `FormScreen` wrapper (`KeyboardAvoidingView` + `ScrollView` with
  `keyboardShouldPersistTaps="handled"` + a pinned action row) modelled on what
  `EventEditSheet` already does, and adopt it across all ten screens.
- Add `KeyboardAvoidingView`/`keyboardShouldPersistTaps` to the pre-merge
  checklist for any new screen containing an input.

**#4 — full CDSE audit of every dated record.** Prompted by "I want to make
sure all stats have a date for trends to be correct". Supersedes #2, which is
one row of this table.

**Trends themselves are correct.** `computeDailyStats` reads only
`TimelineEvent`s, which do capture real timestamps and are editable. The date
problem is in every *other* dated record.

| Record | Capture | Derive → Surface | Editable |
|---|---|---|---|
| Bottle / solids / pump / nappy / medicine events | ⚠️ stamps *now*; no backdating in the log flow | ✅ daily buckets → Trends | ✅ time editable |
| Sleep | ✅ real start + end | ✅ duration, midnight split | ✅ (build 14) |
| **Measurement** | ❌ `new Date()` | ❌ age = `date − dob` → **wrong WHO percentile** | ❌ no update/delete |
| **Vaccine (given)** | ❌ `VaccineFormScreen:128` stamps today | ❌ wrong date in the history | ✅ |
| Vaccine (appointment) | ✅ picker, `minimumDate` = now — correct for a future booking | ✅ drives the 48h/24h/2h reminders | ✅ |
| **Sickness episode** | ❌ `startDate: new Date()`, and `endDate` is never captured | ❌ episode length unknowable | ❌ no update/delete |
| **Medication** | ❌ `lastGiven: new Date()` | ❌ | ❌ no update/delete |
| **Milestone** | ❌ `date: new Date()` | ❌ "achieved" is always today | ❌ no update/delete |

**Two systemic causes, both worth fixing once rather than per screen:**

1. **`DateField` is used by ZERO of the five add forms.** The component exists
   — built for date of birth — and its only consumers are Onboarding and
   Add-baby. Every form here hardcodes `new Date()` instead. The control was
   built and never adopted.
2. **Four of eight record types have no update or delete path at all**
   (measurement, sickness, medication, milestone). Only events and vaccines can
   be corrected. Same rule as `AUDIT.md`: a stored field that can't be
   corrected is a bug.

**Priority within this item:** vaccines and measurements first — both are
records parents transcribe from the red book *after the fact*, which is the
primary use case, and measurements additionally produce a **wrong percentile**
rather than merely a wrong date.

**Also worth deciding:** timeline events can't be backdated at log time either
(tap now → stamped now, correctable only afterwards in the edit sheet). For a
baby app that's a real gap — you log the 3am feed at 7am. Consider a "time"
row in the quick-log long-press picker.

**All four fixed in build 16.** Post-fix sweep confirms every screen with an
input is now covered by `FormScreen` or `KeyboardAvoidingView`, and `DateField`
is adopted in all five add forms.

_(Add new testing feedback above this line as it comes in.)_

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
