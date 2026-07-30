# DenBaby — testing feedback & fix backlog

Real-world testing notes to fix in a future pass. Newest first. Nothing here
is fixed yet — this is the running to-do from device testing.

---

## From TestFlight build 10 (first build that launches) — 30 Jul 2026

### Onboarding / "add your baby" screen

1. **Date of birth is a plain text field — should be a date picker.**
   - Now: you type the date as free text ("March 8, 2026"). Clunky and
     error-prone.
   - Want: a proper **calendar / date picker**, or at minimum a structured
     day / month / year entry.
   - Note: we already added `@react-native-community/datetimepicker` for
     vaccine appointments — reuse it here (date-only mode).

2. **Sex selector is ambiguous and clunky.**
   - Now: "Boy / Girl" toggle — the selected vs unselected state is unclear
     ("says boy and blank"). Tapping the blank one seems to do nothing;
     tapping "Boy" appears to populate the "Girl" box. Confusing to operate.
   - Want: an obvious, unmistakable selected state (clear highlight on the
     chosen option, clear unselected state on the other), and tapping either
     option clearly selects just that one.

---

### 🔴 HIGH — Dark mode wrongly forces the stripped-down "Night Mode" screen

- **Symptom:** on the home screen only *night feed + diaper* appear, there's
  no timeline/list of what was logged, bottle defaults to 120ml with no edit,
  and it's unclear where recorded events go.
- **Root cause:** `useComputedNightMode()` in `src/theme/ThemeProvider.tsx`
  returns true whenever `systemScheme === 'dark'`. So any phone set to Dark
  appearance is permanently shown `NightHomeView` (the minimal 3am feeding
  screen) instead of the full home + "Today" timeline.
- **Why it matters:** many users keep their phone in dark mode 24/7 — they'd
  never see the real app. This made the app look completely broken.
- **Fix direction:** decouple *dark colour theme* from *night-feeding mode*.
  Dark mode → dark colours but the FULL app (all quick-log tiles + timeline).
  Reserve the minimal NightHomeView for genuine night hours + an active sleep
  session (or a manual "night mode" toggle) — not merely system dark mode.
- **Workaround for testing now:** set the iPhone to Light appearance
  (Settings → Display & Brightness → Light).

### Related (surfaced by the night-mode issue, verify in day/light mode)

- Bottle quick-log defaults to 120ml — confirm the **long-press amount
  picker** and **tap-to-edit** are discoverable in the full (light) home view.
- General: make it obvious where a just-logged event appears (the "Today"
  timeline) — the confirmation toast could point to it.

_(Add new testing feedback above this line as it comes in.)_
