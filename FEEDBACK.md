# DenBaby — testing feedback & fix backlog

Real-world testing notes. Newest first.

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
