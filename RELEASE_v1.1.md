# v1.1 release runbook — Family Sync + new icon

Everything is pre-staged on this branch. When v1.0 is approved and released,
the whole v1.1 release is the steps below, in order.

## Already done (no action)

- [x] Family Sync code complete and Firebase-verified end to end
- [x] Firebase project live: anonymous auth on, Firestore created, rules published
- [x] Baby-face app icon in `assets/` (rides along with the build)
- [x] `app.json` version already bumped to **1.1.0**
- [x] `autoIncrement` handles the build number automatically
- [x] Privacy policy (live site) already covers Family Sync
- [x] EAS env script ready: `scripts/setup-eas-env.sh`

## Release day — terminal (Mac, repo root)

```bash
git pull origin claude/unzip-commit-push-t4m8ez   # 1. get everything
bash scripts/setup-eas-env.sh                     # 2. one-time: Firebase env for EAS builds
npx eas-cli build --profile production --platform ios   # 3. build (~15 min)
npx eas-cli submit --platform ios --latest        # 4. upload to App Store Connect
```

Step 2 only ever needs to run once — skip it on later releases.

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

## If v1.0 gets rejected instead

Don't use this runbook. A metadata rejection needs no rebuild (fix the text
in App Store Connect and resubmit). A binary rejection means we fix, then
decide together whether the fix ships as 1.0.0 or folds into 1.1.0.
