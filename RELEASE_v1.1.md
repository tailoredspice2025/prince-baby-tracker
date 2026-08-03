# v1.1 release runbook — Family Sync + new icon

Everything is pre-staged on this branch. When v1.0 is approved and released,
the whole v1.1 release is the steps below, in order.

## ✅ Blocker cleared in build 18

**Seeded demo data would sync to both parents.** `familySync.ts:132`
(`uploadLocalData`) pushes every document in each collection with no filtering,
and `completeOnboarding` never clears the ~12 weeks of demo feeds, sleeps,
nappies, measurements and vaccines. So the moment someone creates a family, all
of it uploads to Firestore and lands on the other parent's phone. Both would be
looking at fabricated history for their own baby, in the cloud.

Locally this is an annoyance; shared, it's wrong data on two devices.
**Fix: clear the seeded records when onboarding completes** — that solves it
everywhere at once, rather than filtering at the upload boundary.

## Scope

**1.1 is Family Sync only.** Voice logging stays hidden behind
`FEATURES.voiceLogging` and is **not scheduled** — its capture doesn't work on
device and it is not a priority until raised. Don't let it ride along.

## Already done (no action)

- [x] Family Sync code complete and Firebase-verified end to end
- [x] Firebase project live: anonymous auth on, Firestore created, rules published
- [x] Baby-face app icon in `assets/` (rides along with the build)
- [x] EAS env script ready: `scripts/setup-eas-env.sh`

## ⚠️ Corrected — this runbook was written before the v1.0 release cycle

Four lines here were stale and two of them were dangerous. Current facts:

- **`app.json` version is `1.0.0`, not `1.1.0`.** Bump it to `1.1.0` by hand as
  step 0, or you'll ship Family Sync labelled 1.0.
- **`autoIncrement` is OFF.** `appVersionSource` is `local` and the build number
  is the explicit `ios.buildNumber` in `app.json` (currently **17**). Bump it by
  hand. Following the old "autoIncrement handles it" line recreates exactly the
  collisions that caused four failed submissions — see `BUILD_RELEASE.md`
  landmine #1.
- **The privacy policy no longer covers Family Sync as shipping.**
  `docs/index.html` now says Family Sync is "Not available in the current App
  Store version". Remove that paragraph when 1.1 goes out.
- **1.1 sits on top of builds 16 and 17**, not on the pre-staged branch as it
  was. Pull first.

## Release day — terminal (Mac, repo root)

```bash
git pull origin claude/unzip-commit-push-t4m8ez   # 1. get everything
# 1b. EDIT app.json BY HAND: version -> "1.1.0", ios.buildNumber -> next number
bash scripts/setup-eas-env.sh                     # 2. one-time: Firebase env for EAS builds
npx eas-cli build --profile production --platform ios   # 3. build (~15 min)
npx eas-cli submit --platform ios --latest        # 4. upload to App Store Connect
```

Step 2 only ever needs to run once — skip it on later releases.

### ⛔ Then the hard gate — TEST THE BUILD BEFORE RESUBMITTING
Wait ~15 min for processing, install the build from **TestFlight** on a real
device, and **confirm it launches to the Home screen**. Only then select the
build in App Store Connect and Add for Review. "Build finished" ≠ "app runs"
— skipping this is what got build 3 rejected (crash on launch). See
RELEASE_QA.md §0.

## Release day — App Store Connect (browser)

1. **Apps → DenBaby → + Version** → enter `1.1`.
2. **What's New** — paste:

   ```
   NEW: Family Sync — track together
   • Both parents (or any caregiver) can now log to the same baby from their own phones
   • Share a 6-character invite code — no accounts, no sign-up, ever
   • Feeds, sleep, nappies, growth and health records appear on every phone within seconds
   • See who logged what, at a glance
   • Off by default: your data stays on your device until you choose to invite someone

   Plus a fresh new app icon.
   ```

3. **Build** section → select the new build (wait ~15 min after submit for processing).
4. **App Privacy** (left sidebar) → Edit. Family Sync stores baby data in the
   cloud, so the label changes from "Data Not Collected" to:
   - **Health & Fitness** → collected, **linked to the user's identity? NO**
     (anonymous IDs only), used for **App Functionality** only, **not** for
     tracking.
   - **User Content** (photos stay local — do NOT add; only add "Other User
     Content" if asked about logged entries: same answers as above).
   - Everything else stays "not collected".
5. **Add for Review**.

## Optional pre-flight (recommended once, before step 3)

Two-simulator join test — see the recipe in FIREBASE_SETUP.md §6, or:
phone A: Profile → Invite caregiver → code; phone B (fresh simulator):
"Join your family" → code → history appears → log on B, watch it land on A.

## Sequencing

**1.0 approved → 1.0.1 (build 17) → then 1.1.** Let the app prove stable with
real users before adding a cloud dependency, and don't tangle the privacy-label
change (from "Data Not Collected" to actual collection) with a launch that is
still settling.

## If v1.0 gets rejected instead

Don't use this runbook. A metadata rejection needs no rebuild (fix the text
in App Store Connect and resubmit). A binary rejection means we fix, then
decide together whether the fix ships as 1.0.0 or folds into 1.1.0.
