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

_(Add new testing feedback above this line as it comes in.)_
