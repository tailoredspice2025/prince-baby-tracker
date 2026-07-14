# DenBaby — Baby Growth & Care Tracker

React Native (Expo) implementation of the `Prince Baby Tracker.dc.html` design handoff — see `../project/design_handoff_baby_tracker/README.md` for the full design spec this was built from. (The original design handoff predates the DenBaby name; the mockup file itself hasn't been renamed.)

## Stack

- **Expo / React Native / TypeScript** — one codebase for iOS and Android.
- **Zustand** for local app state (persisted to AsyncStorage, so data survives app restarts), seeded with demo data that matches the mockups so the app is fully navigable out of the box.
- **Firebase (Firestore + Auth)** for real-time multi-caregiver sync — wired up in code but pointed at no project until you configure one (see below). Until then, the app runs entirely on local demo data.
- **expo-speech-recognition** for the hold-to-speak voice logging feature, feeding a small rule-based parser (`src/lib/voiceParser.ts`).
- **expo-notifications** for medicine and vaccine-due reminders.
- **react-native-svg** for the WHO growth-percentile chart.

## Running it

```bash
npm install
npm run ios      # or: npm run android / npm run web
```

`expo-speech-recognition` is a native module, so voice logging (and any other native feature) requires a **development build**, not Expo Go:

```bash
npx expo prebuild
npx expo run:ios      # or run:android
```

Everything else (all 10 screens, quick-log tiles, growth charts, night mode) works fine in Expo Go or on web for review.

## Connecting a real Firebase project (for multi-caregiver sync)

1. Create a Firebase project → add a Web app → copy the config.
2. Firebase console → Authentication → Sign-in method → enable **Anonymous**.
3. Firebase console → Firestore Database → create a database.
4. Firestore → Rules → paste in `firestore.rules` (already written for this data model).
5. Copy `.env.example` to `.env` and fill in the six `EXPO_PUBLIC_FIREBASE_*` values.

Until `.env` is filled in, `isFirebaseConfigured()` (`src/lib/firebase.ts`) is false and every write in `src/lib/store.ts` just updates local state — nothing breaks, it simply doesn't sync anywhere.

## Notable implementation choices

- **WHO percentiles** (`src/lib/whoData.ts`, `src/lib/percentiles.ts`) use the Cole LMS method with a simplified constant coefficient-of-variation per measure, built from the published WHO median tables. The v1 Growth screen deliberately shows only the baby's own curve — no percentile comparison — per product decision; `GrowthChart`'s `showReference` prop and this data are wired up and ready for a phase-2 return of WHO comparison bands. Swap in the official WHO LMS CSVs before treating this as a clinical tool.
- **Baby sex** isn't in the original design; it's collected for the phase-2 percentile lookups above, so onboarding (and the add-baby form) include a small Boy/Girl selector.
- **Night mode** triggers automatically on a running sleep session during night hours (8pm–6am) or system dark mode, per the 1g spec (`src/theme/ThemeProvider.tsx`).
- **Voice permissions**: feeds (bottle + solids), sleep, and diapers can auto-log after a 3-second undo window; pumping is off by default; vaccines/medicine/sickness always open a confirmation form and are never auto-saved, per the 2b spec.
