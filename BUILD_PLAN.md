# DenBaby — fix plan for the feedback backlog

Source of items: `FEEDBACK.md`. Fixed **one at a time**, each committed
separately with an impact check. **One TestFlight build at the end** (not per
fix) delivered as an update to the existing internal tester setup.

---

## Impact check — run before every commit

For each fix I confirm and record:

1. **Other features** — does this touch code shared with something already
   built (Family Sync, reminders, PDF export, Trends, Growth, voice)?
2. **Flow** — does any screen-to-screen path change (onboarding, logging,
   editing, joining a family)?
3. **Data model / backend** — does a persisted or Firestore field change
   shape? If yes → **store `migrate` bump** so existing installs don't break,
   and check Firestore read/write + the sync merge still line up.
4. **Typecheck green** (`npx tsc --noEmit`).

Anything with a data-model change gets called out explicitly to you before I
build it.

---

## Order and impact assessment

Data-model items first (so migrations settle), then shared components, then
pure UI, then assets.

### 1. Who am I — caregiver identity  ⚠️ DATA MODEL
Ask the caregiver's name at onboarding (and editable in Profile); attribute
entries to them. Works solo, not just with Family Sync.
- **Other features:** touches `loggedBy` consumers — Home timeline,
  DayTimeline, eventRow, Trends attribution, **Family Sync** (its
  `createFamilyAndLink` already remaps `loggedBy` → uid; must verify still
  correct), PDF export.
- **Flow:** adds a name step/field to onboarding.
- **Data model:** replaces the demo caregiver default (`currentCaregiverId:
  'cg-mom'`). Persisted `caregivers[]` + `currentCaregiverId` change →
  **migration v2 → v3** required so existing installs stop showing demo
  mum/dad/nanny. Firestore caregiver docs unaffected in shape.
- **Risk:** highest of the batch — do first, test hardest.

### 2. Event time picker (shared)  — no data change
Replace typed time with a native time picker; default to current phone time.
- **Other features:** builds the shared picker used by items 3 and 4.
- **Flow:** unchanged (same sheets, better input).
- **Data model:** none — times stay ISO strings. Must preserve the
  `time` vs `startTime` split (sleep events use `startTime`).
- **Dependency:** `@react-native-community/datetimepicker` **already
  installed** (added for vaccine appointments) → no new native module, no
  extra build risk.

### 3. Edit-entry sheet usable  — no data change
Keyboard-avoiding layout, always-visible Save, no discard-on-outside-tap.
- **Other features:** `EventEditSheet` writes via `updateEvent` →
  `syncWrite('events')` → Family Sync. Keep that path intact.
- **Flow:** editing becomes completable (currently it isn't).
- **Data model:** none.

### 4. Onboarding date of birth → date picker  — no data change
- **Other features:** DOB feeds age display, Growth chart x-axis, WHO data.
- **Flow:** onboarding input method only.
- **Data model:** none — `dob` stays an ISO date string. Removes the
  free-text parse that previously dropped the entered date.

### 5. Sex selector clarity  — no data change
Unmistakable selected/unselected state; tapping either selects just that one.
- **Other features:** `Baby.sex` feeds WHO percentile lookups (hidden in v1).
- **Flow / data model:** unchanged.

### 6. Bottle amount — default + editability  — no data change
Make the amount adjustable at log time (surface the existing long-press
picker) rather than silently defaulting to 120 ml.
- **Other features:** `logQuickEvent` defaults; feed reminder reschedules off
  bottle logs — keep that firing.
- **Data model:** none.

### 7. Make it obvious where entries land  — no data change
Clearer "Today" timeline presence/affordance after logging.
- Pure UI. No flow or data change.

### 8. App icon — scale the bottle/baby up  — assets only
- **Other features / flow / data:** none. Regenerates
  `assets/icon.png` + the three Android layers.
- Takes effect only in a native build — arrives with the batch build.

---

## Delivery

- Each fix: separate commit + impact check + typecheck.
- After the last one: **one production build, build number 11**
  (bump `ios.buildNumber` in app.json, per `BUILD_RELEASE.md`), submit, then
  it appears in TestFlight as an update on your phone — install and run the
  `RELEASE_QA.md` smoke pass.
- Only after that TestFlight launch check do we resubmit 1.0 for review.
