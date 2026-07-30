# DenBaby — release QA checklist & user stories

Run this before every release. Check items off in the app on a real device.
Add new stories as features land — treat it as a living document.

## 0. ⛔ HARD GATE — do this before every submission (no exceptions)

**Never submit a build you have not launched yourself on a real device.**
"Build finished ✓" from EAS only means it *compiled* — it does NOT mean it
*launches*. A missing framework or bad native link only fails at launch, and
no build step checks that. (This is exactly what got build 3 rejected under
Guideline 2.1(a): it crashed on launch because a native framework wasn't
embedded — invisible in the dev/simulator build, fatal in the production one.)

- [ ] `eas build` + `eas submit` finished
- [ ] Installed the **exact production build** from **TestFlight** on a real
      iPhone/iPad
- [ ] Opened it and reached the **Home screen** (not a white/black screen, no
      instant close)
- [ ] Ran the smoke test below on that TestFlight build
- [ ] ONLY THEN: App Store Connect → select the build → Add for Review

Dev builds (`expo run:ios`, simulator, Expo Go) are a **different artifact**
than the shipped `.ipa` — passing in dev tells you nothing about the store
build. Test the thing you actually ship.

---

**Legend**
- 📱 = needs a **real device** (Face ID, notifications timing, voice, camera)
- 👥 = needs **two devices** (Family Sync)
- ☁️ = only applies when **Firebase is configured** (v1.1+); Family Sync UI is
  hidden without it
- ✅ positive (happy path) · ❌ negative (edge/failure the app must handle)

---

## 1. Fast smoke checklist (5-minute tap-through)

- [ ] App launches to Home without a crash; new **baby-face icon** on the home screen
- [ ] Log a **bottle** → appears at top of today's timeline with the amount
- [ ] Log a **nappy** → appears with the right type
- [ ] Start a **sleep** session, stop it → logs a duration
- [ ] Log **solids**, **pump**, **medicine** → each appears
- [ ] **Undo** a just-logged event from the toast → it disappears
- [ ] Open **Trends** → charts render for day/week/month
- [ ] Open **Growth** → curve renders; "not medical advice" disclaimer present
- [ ] Open **Health** → vaccines / sickness / medicine lists render
- [ ] Add a **vaccine appointment** → shows in the list with date+time 🔔
- [ ] **Profile** → switch units (ml/oz), toggles respond
- [ ] Add a **second baby** → switch between babies
- [ ] Export **PDF** → share sheet opens with a document
- [ ] 📱 Enable **App Lock**, background & reopen → Face ID prompt gates entry
- [ ] ☁️👥 **Invite caregiver** → code shown; second device **joins** → data appears

---

## 2. User stories

### Onboarding
- ✅ New user adds a baby (name, DOB, weight, length, sex) → **Given** a fresh
  install, **When** they fill the form and tap Continue, **Then** they land on
  Home with that baby active and the DOB correctly saved (not reset to today).
- ✅ 📷 Adds a baby photo → photo shows on the profile card.
- ❌ Leaves name blank → a sensible default is used, no crash.
- ❌ Enters a nonsense birth date ("hello") → the app keeps a valid date rather
  than storing an invalid one.
- ☁️ ✅ Second parent chooses **"Join your family"** instead of adding a baby →
  never has to enter baby details (see Family Sync).

### Quick logging (Home)
- ✅ Tap Bottle/Nappy/Sleep/Solids/Pump/Medicine → event logs instantly with a
  confirmation toast and correct "logged by".
- ✅ Long-press a quick-log tile → amount/kind picker appears; chosen value is
  saved.
- ✅ Undo from the toast within 3s → the event is removed.
- ✅ Sleep is a running session → start shows "Sleep started"; stop records the
  elapsed duration.
- ❌ Tap the same log twice quickly → two distinct entries (or intended single),
  no crash, no duplicate-key error.
- ❌ Delete an event → removed from timeline; **Undo** restores it.

### Voice logging 📱
- ✅ Hold the mic, say "feed done, 120 ml bottle at 12" → draft shows Bottle ·
  120 ml at 12:00; confirm logs it.
- ✅ Say "wet nappy now" → draft shows Nappy · wet.
- ✅ Say "gave vitamin D drops" → opens the medicine **form** (not auto-logged).
- ❌ Say something unrelated ("what's the weather") → "not recognized", nothing
  logged, no crash.
- ❌ Deny microphone permission → graceful message, app still usable by tapping.

### Trends
- ✅ Day/Week/Month/Year toggle → aggregates update; bars/totals match the logged
  data.
- ✅ Tap a day → day timeline opens with that day's events.
- ❌ A day with no events → empty state, not a broken/blank chart.

### Growth
- ✅ Add a weight/height/head measurement → point appears on the curve; latest
  value updates.
- ✅ Disclaimer "not medical advice" is visible; **no** percentile-vs-others
  shown (v1 scope).
- ❌ Add an out-of-range or empty measurement → handled without breaking the
  chart.

### Health — vaccines, sickness, medicine
- ✅ **Log a given vaccine** (name, dose, date, site, batch, clinic, address,
  notes) → saved to the record, shows "DONE".
- ✅ **Add a vaccine appointment** (date + time, clinic, address) → shows "DUE"
  with the booked date/time and 🔔.
- ✅ 📱 Appointment reminders fire at **48h / 24h / 2h** before — verify by
  booking one a few minutes out (temporarily) and confirming the near-term
  nudge arrives with vaccine, time, and clinic.
- ✅ Mark an appointment done / delete it → its reminders stop.
- ❌ Book an appointment **less than 48h away** → only the still-future reminders
  (24h/2h or just 2h) are set; no reminder fires for a time already passed.
- ❌ Book an appointment in the **past** → no reminders scheduled, no crash.
- ✅ Log a sickness episode and a medication with a reminder time → appear in
  their lists; 📱 medication reminder fires at the set time.

### Reminders / notifications 📱
- ✅ Enable the **feed reminder** (every 2/3/4h) → a reminder fires after that
  gap since the last feed; logging a new feed pushes it forward.
- ✅ Disable it → no more feed reminders.
- ❌ Deny notification permission → app still works; no crash when a reminder
  would have fired.

### App Lock 📱
- ✅ Toggle **App Lock** on (only shown if the device supports Face ID/passcode)
  → backgrounding and reopening requires Face ID/passcode.
- ✅ Toggle off → reopens without a prompt.
- ❌ Failed/cancelled Face ID → stays locked, doesn't reveal data.

### Multi-baby & settings
- ✅ Add another baby → both listed; switching changes the active baby's data
  everywhere (Home, Trends, Growth, Health).
- ✅ Switch **units** ml↔oz → amounts re-display in the chosen unit.
- ❌ Only one baby → no broken "switch" UI.

### PDF export
- ✅ Export for pediatrician → a PDF generates and the share sheet opens; content
  matches the baby's records; **no** percentile columns (v1).
- ❌ Export with sparse data → still produces a valid PDF, no crash.

### Family Sync ☁️👥
- ✅ **Invite:** Profile → Invite caregiver → enter name → a 6-char code appears;
  Firestore shows the family + data.
- ✅ **Join:** second device → onboarding "Join your family" → enter code + name
  → baby profile and full history appear.
- ✅ **Live sync:** log a feed on phone A → appears on phone B within seconds,
  labelled with A's name; and vice-versa.
- ✅ **Offline queue:** turn phone A to airplane mode, log events, reconnect →
  events sync to phone B.
- ✅ **Remove caregiver** (owner) → removed device loses access.
- ✅ **Leave family** → data stays on that phone, stops syncing.
- ✅ **Leave & delete cloud data** (owner) → shared cloud copy is removed.
- ✅ **Recent-window behaviour:** editing/deleting a **recent** (<14-day) event
  propagates to the other phone.
- ❌ **Old-data window (known trade-off):** deleting an event **older than 14
  days** removes it from Firebase and the acting phone, but the other phone
  keeps its local copy → their older Trends totals may differ. Growth /
  vaccines / medicines stay identical (full-sync). *Expected, not a bug.*
- ❌ Enter an **invalid or expired** invite code → clear "code isn't valid"
  message, no crash.
- ❌ Join with the app **offline** → graceful "couldn't reach the server".

### Visual / brand
- ✅ App icon is the **baby-face bottle** (home screen, App Store, splash).
- ✅ Coral theme consistent; light **and** dark mode both legible.
- ✅ Floating "+" button not clipped by the tab bar.

---

## 3. Per-release version notes

Record what changed and any release-specific checks here each time.

- **v1.0** — first submission: core logging, trends, growth, health, voice, App
  Lock, PDF, multi-baby. (Family Sync UI hidden — no Firebase.)
- **v1.1** — Family Sync (☁️👥 section applies), baby-face icon, vaccine
  appointment reminders, recent-window sync. Run the full list, especially the
  two-device and 📱 device-only stories.
