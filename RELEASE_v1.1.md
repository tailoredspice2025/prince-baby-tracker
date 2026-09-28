# v1.1 release runbook — Family Sync

Version **1.1.0**, build **26**. Already set in `app.json` — no hand edits.

**1.1 is Family Sync only.** Voice logging stays hidden behind
`FEATURES.voiceLogging` and is not scheduled.

---

## ⛔ Step 0 — publish the new security rules NOW, before anything else

This does not wait for the release. The rules currently live on the `denbaby`
Firebase project are the old ones, and they let **any stranger** list every
invite code (= every familyId), add themselves to any family without a code,
and read everything in it. A member could also promote themselves to owner or
delete the family.

The Firebase config ships in every copy of the app and is committed in
`scripts/setup-eas-env.sh`. That is normal for Firebase — the config is not a
secret — which is exactly why the rules are the only lock, and the old ones do
not lock.

1. Firebase console → **denbaby** → Firestore Database → **Rules**
2. Replace everything with the contents of `firestore.rules` in this repo
3. **Publish**

The new rules were attacked in the real Firestore emulator before this was
written: against the old rules 11 of 21 tests fail, against these 21 of 21
pass. See `tools/rules-test/README.md`.

**Also check:** Firestore → Data. If anything is in there from earlier
testing, and it was your real baby's data, delete it — it has been readable by
anyone with the config while the old rules were live.

The new rules need the **new app** — build 26 creates families and joins with
the invite code in a shape the old client does not send. Nothing in the App
Store uses sync yet (the live app has no Firebase config), so publishing now
breaks nothing for anyone.

---

## Release day — terminal (Mac, repo root)

```bash
git fetch origin && git reset --hard origin/claude/unzip-commit-push-t4m8ez
npm install
npm run verify                                    # must be 0 errors
npm run cdse                                      # must be clean
bash scripts/setup-eas-env.sh                     # ONE-TIME: Firebase env for EAS builds
npx eas-cli build --profile production --platform ios
npx eas-cli submit --platform ios --latest
```

`setup-eas-env.sh` is what turns Family Sync **on** in a production build —
without it `isFirebaseConfigured()` is false and every sync screen stays
hidden. Run it once; confirm with `npx eas-cli env:list --environment production`.

Build page must read **1.1.0 (26)**.

---

## ⛔ TestFlight — two phones, not one

Sync cannot be tested on one device. Add your partner as an internal tester
in App Store Connect → TestFlight so the build installs on their phone too.
**Phone A** = the one with your existing data. **Phone B** = the second phone.

1. **Join.** A: Baby → Invite caregiver → note the code. B: fresh install →
   "Join your family" → code. A's history appears on B.
2. **Live logging.** B logs a bottle. It appears on A within seconds, marked
   as logged by B's name.
3. **Reminder silenced across phones** — the bug from 1.0.1, now across two
   devices. On A, set a medicine reminder a few minutes ahead (it syncs to B
   and arms there). On **A**, log that dose. **B must not buzz.**
4. **Feed reminder slides across phones.** Turn the feed reminder on on B.
   Log a feed on A. B's reminder should move to 3 hours after A's feed.
5. **Photos stay on each phone.** Set a baby photo on A. B shows the
   initial-letter avatar — **not a broken image**. Set a different photo on B;
   A's photo is unaffected.
6. **A wrong code is refused.** On a third install (or after B leaves), enter
   `ZZZZZZ` → "invalid code".
7. **Leaving.** B: Leave family. B keeps its data and stops receiving A's
   changes.

Points 3 and 5 are the ones most likely to be wrong — both were bugs in the
sync code found while auditing it for this release.

---

## App Store Connect

1. **+ Version or Platform → `1.1.0`**
2. **Build** → 1.1.0 (26)
3. **What's New** — paste:

   ```
   Family Sync — track together.

   Both parents, or any caregiver, can now log to the same baby from their own phones. Share a 6-character invite code — no accounts and no sign-up. Feeds, sleep, nappies, growth and health records appear on every phone within seconds, marked with who logged them.

   Off by default: nothing leaves your phone until you invite someone. Photos always stay on the phone that took them.
   ```

4. **App Privacy** → Edit. This is the change from "Data Not Collected", and
   it is **your** legal declaration — below is the conservative reading:

   | Data type | Collected | Linked to identity | Tracking | Purpose |
   | --- | --- | --- | --- | --- |
   | Health & Fitness → **Health** (temperatures, medicines, vaccines, illnesses) | Yes | No | No | App Functionality |
   | Contact Info → **Name** (baby's name, caregivers' display names) | Yes | No | No | App Functionality |
   | Identifiers → **User ID** (anonymous Firebase ID) | Yes | No | No | App Functionality |
   | User Content → **Other User Content** (feeds, sleep, nappies, notes) | Yes | No | No | App Functionality |
   | Photos or Videos | **No** — they never leave the device | | | |

   "Not linked" is defensible because there are no accounts: the only
   identifier is an anonymous ID with no email, phone or real name attached.
   If you would rather over-declare, "linked" is never a rejection reason;
   under-declaring can be.

5. **Privacy Policy** — `docs/index.html` is already updated for 1.1 and
   deploys with the push to GitHub Pages. Confirm the live page says
   "Available from version 1.1".
6. **Add for Review** — only after all seven TestFlight checks pass.
