# App Store submission kit — DenBaby v1

Everything to paste into App Store Connect, plus the checklist of what's
done in-app vs. what needs manual action.

---

## App name

**DenBaby** (30-char limit; fits easily — 7 chars)

## Subtitle (30 chars max)

`Feeds, sleep & growth log`

## Promotional text (170 chars max, editable without review)

> Log feeds, sleep and diapers in one tap — or just say it out loud.
> Beautiful daily, weekly and monthly trends of your baby's rhythm.

## Description

> **Track your baby's day in one tap — or just say it.**
>
> DenBaby is a fast, beautiful log for the things new parents
> track every day: bottles, sleep, diapers, solids, pumping and medicine.
>
> **One-tap logging.** Big friendly tiles log a feed or diaper instantly,
> with a 4-second undo. Long-press to pick the amount, food, or diaper
> type.
>
> **Voice logging.** Hold the mic and say "drank 120 ml at 9" — the app
> turns it into a structured entry you confirm before it saves.
>
> **Trends that matter.** How much milk today? How many hours of sleep
> this week? Daily, weekly, monthly and yearly summaries with clean
> charts, plus a tap-to-open log for any past day.
>
> **Growth tracking.** Record weight, height and head circumference and
> watch your baby's own curve grow.
>
> **Health in one place.** Vaccines with due-date reminders, sickness
> episodes, medicines with daily reminders, and milestones with photos.
>
> **Made for 3 a.m.** A calm night mode switches on automatically during
> night feeds.
>
> **Private by design.** Everything stays on your device. No account, no
> ads, no tracking. Export a tidy PDF summary for pediatrician visits
> whenever you need it.
>
> DenBaby is a record-keeping tool for parents, not a medical
> device. Always consult your pediatrician about your baby's health.

## Keywords (100 chars max, comma-separated, no spaces needed)

`baby,tracker,newborn,feeding,breastfeeding,sleep,diaper,log,growth,infant,nursing,bottle`

(98 chars. Don't waste keyword space on "app" or the app name — those are
matched automatically.)

## Category

- Primary: **Health & Fitness** (alternative: Lifestyle)
- NOT the Kids category — this is a tool for adults.

## Age rating

4+ (no objectionable content).

## URLs

- **Privacy policy URL: https://tailoredspice2025.github.io/prince-baby-tracker/**
  — live via GitHub Pages (source: `claude/unzip-commit-push-t4m8ez` branch,
  `/docs` folder). Paste this into App Store Connect's Privacy Policy URL
  field.
- **Support URL: same link** (it doubles as the contact page — see the
  Contact section at the bottom of that page).

Note: this repo is currently **public** (required for GitHub Pages on the
free plan). Plan is to upgrade to GitHub Pro (~$48/yr) after Apple approval
and switch the repo back to private — Pro supports Pages on private repos,
so this URL keeps working when that happens. Don't flip the repo private
before upgrading, or this link breaks.

## App Privacy ("nutrition label") answers

Data collection questionnaire: the honest answer for v1 is **"Data Not
Collected"** across the board — all data is stored on-device, there are no
accounts, no analytics, no third-party SDKs that phone home, and the
developer has no access to any user data.

(If phase 2 adds Firebase multi-caregiver sync, this must be redone:
Health & Fitness data + Photos, linked to identity? No — anonymous auth —
but "collected" becomes yes. Revisit then.)

## Review notes (paste into "Notes" in App Store Connect)

> DenBaby is a standalone, fully native baby activity tracker
> (React Native / Expo). All functionality works offline with no account
> or setup: the app seeds a demo baby profile so every screen is
> populated and testable immediately.
>
> How to test:
> - Complete the one-screen onboarding (any values work).
> - HOME: tap any tile (Bottle, Diaper…) to log instantly; LONG-PRESS a
>   tile to choose amount/type. Tap "See all" for Trends.
> - TRENDS: Day/Week/Month/Year summaries; tap any bar to open that
>   day's full editable log.
> - VOICE: hold the dark mic bar and say e.g. "drank 120 ml" (requires
>   microphone + speech recognition permissions; a confirmation sheet is
>   always shown before anything is saved).
> - HEALTH: vaccines, sickness log, medicines with local reminders.
> - PROFILE: units, feed reminder setting, optional App Lock (Face ID),
>   and "Export for pediatrician" (generates a PDF locally and opens the
>   share sheet).
>
> Note: App Lock is OFF by default, so the app opens straight to Home
> with no authentication prompt during review. It only appears as a
> toggle in Profile > Settings if you want to test it.
>
> Privacy: all data is stored locally on-device. No account system, no
> analytics, no ads, no third-party data sharing. Microphone audio is
> processed by the OS speech recognizer and never recorded or uploaded.
> Face ID/Touch ID authentication (when App Lock is enabled) is handled
> entirely by the OS; the app never receives biometric data. The app is
> a record-keeping tool for parents and makes no medical claims; growth
> screens carry a "not medical advice" note.

## Screenshots (need to produce)

Required: 6.9" (iPhone 16 Pro Max class) and 6.5" sets, portrait.
Suggested five: Home (tiles + timeline), Trends week view, Day log,
Growth, Health. Capture from the simulator with demo data.

---

## Pre-submission checklist

Done in code (v1 scope):
- [x] All visible features work offline with no account (guideline 2.1)
- [x] Caregiver list + invite flow hidden (phase 2 — no dead-end demo flow)
- [x] Percentile comparisons removed; growth shows baby's own curve only
      (phase 2: WHO reference bands — code retained behind `showReference`)
- [x] "Not medical advice" note on Growth screen + PDF footer
- [x] Permission purpose strings for mic / speech / photos / camera / Face ID (app.json)
- [x] No tracking/analytics SDKs; privacy label is "Data Not Collected"
- [x] Optional Face ID/passcode App Lock (off by default; Profile > Settings)

Manual actions still needed:
- [ ] Apple Developer Program enrollment approved
- [x] Host privacy policy at a public URL — live at
      https://tailoredspice2025.github.io/prince-baby-tracker/
- [ ] App Store Connect: create app record, paste listing texts above
- [ ] Production build via EAS (`eas build --profile production
      --platform ios`) or Xcode archive, then upload
- [ ] Screenshots for both required sizes
- [ ] Set primary language, category, age rating, pricing (free)
