# DenBaby — build & ship runbook

The single source of truth for building and submitting. Follow it in order
every time. It exists because we hit the **same class of issues repeatedly**
(build-number collisions, stale local files, a crash that reached Apple) —
each is now prevented, not re-fixed. Don't skip steps; the steps ARE the fixes.

---

## The two golden rules

1. **Always build from a clean copy of the latest code.** EAS builds from the
   files on your Mac, not from GitHub — so your Mac must match the repo exactly.
2. **Never submit a build you haven't launched yourself via TestFlight.**
   "Build finished ✓" only means it compiled, not that it runs.

---

## Build & submit — the exact sequence

```bash
cd ~/prince-baby-tracker
git fetch origin
git reset --hard origin/claude/unzip-commit-push-t4m8ez   # ← guarantees latest, discards local throwaway edits
npm install
npx eas-cli build --profile production --platform ios     # build number auto-managed by Apple (remote)
npx eas-cli submit --platform ios --latest
```

Then **STOP** and do the TestFlight launch test (below) before touching the
review button.

---

## Pre-build checklist

- [ ] **Bump `ios.buildNumber` in app.json** to one higher than any build in
      App Store Connect, commit + push (I do this each time; it's explicit and
      deterministic — no autoIncrement). Then verify the build output prints
      that exact number. If it prints a different number, you didn't pull the
      latest — stop and re-reset.
- [ ] `git reset --hard origin/<branch>` done — local now equals the repo
      (this is what prevents the recurring stale-file / merge-conflict mess)
- [ ] `npm install` ran clean
- [ ] ⛔ **`npm run verify` passes with 0 errors** (`eslint` + `tsc --noEmit`).
      Lint is not cosmetic here: `react-hooks/rules-of-hooks` is the rule that
      catches the build-11 crash class — a hook called after an early `return`
      changes the hook count between renders and kills the app. TypeScript
      cannot see it. Warnings are tolerated; **errors block the build.**
- [ ] ⛔ **Round-trip matrix in `RELEASE_QA.md` §1b** run for every event type
      (log → open → edit every field → save → reopen → check the Trends number)
- [ ] If a new **native module** was added since last build (e.g. a picker,
      a Firebase package), that's expected — EAS rebuilds native from scratch
- [ ] For a **Family Sync (v1.1)** build only: EAS Firebase env vars are set
      (`bash scripts/setup-eas-env.sh`, once). Skip for the v1.0 line.

## During the build — expected prompts (all already handled)

| Prompt | Answer | Why |
|---|---|---|
| Push Notifications setup | **No, don't ask again** | app uses only *local* notifications |
| Log in to Apple account | **yes** → your Apple ID | needed for credentials |
| Credentials / provisioning | let EAS handle automatically | already set up |
| Encryption compliance | *no prompt anymore* | `ITSAppUsesNonExemptEncryption:false` in app.json |

## ⛔ Pre-submit gate — TEST THE BUILD (never skip)

1. [ ] `eas submit` succeeded (no "something went wrong")
2. [ ] Waited ~15 min for Apple to process the build
3. [ ] Installed it from **TestFlight** on a real iPhone (internal tester group
      already exists — the build appears automatically)
4. [ ] **Opened it → reached the Home screen** (not a flash-and-close)
5. [ ] Tapped through the smoke test in `RELEASE_QA.md`
6. [ ] ONLY THEN → App Store Connect → select the build → **Add for Review**

If it crashes: get the log (Settings → Privacy & Security → Analytics &
Improvements → Analytics Data → newest `DenBaby-*.ips`) and fix before resubmit.

---

## Landmines we hit, and why each can't recur

| # | What bit us | Permanent fix (in place) |
|---|---|---|
| 1 | Build number collisions (autoIncrement + remote source BOTH kept producing duplicate numbers across `git reset --hard`) | **Explicit, committed build number.** `autoIncrement` is OFF and `appVersionSource` is `local`; the build number is exactly `ios.buildNumber` in app.json. Before each production build, bump that number in the repo and push — deterministic and visible in git, no magic. Current: **12** (builds 3, 4 & 11 already exist in ASC). |
| 2 | — | (see #1) |
| 3 | `git reset --hard` discarded local auto-bumps → duplicate numbers | committed explicit number survives reset — it IS the repo value |
| 4 | Stale local `app.json`/`eas.json` → repeated merge conflicts | always `git reset --hard origin/<branch>` before building (golden rule 1) |
| 5 | App **crashed on launch** and reached Apple (rejected 2.1(a)) | TestFlight launch gate before every submit (golden rule 2) — plus removed the unused `react-native-reanimated` that caused it |
| 6 | Encryption compliance prompt each submit | `ITSAppUsesNonExemptEncryption:false` in app.json |
| 7 | Push-notification prompt each build | saved "No, don't ask again" to eas.json |
| 8 | Build 11 **crashed on sleep start/stop** — `HomeScreen` returned early above four `useMemo`s, so flipping the night-view flag changed the hook count mid-render | ESLint + `react-hooks/rules-of-hooks` in `npm run verify`, wired into the pre-build checklist; `HomeScreen` is now a pure switch between `DayHomeView` / `NightHomeView` so no hook can sit under a conditional return; plus a root `ErrorBoundary` so a render error degrades to a recoverable screen instead of killing the app |
| 9 | Bug only fired **after 20:00**, so daytime testing missed it entirely | `RELEASE_QA.md` §1b "time-dependent UI" — clock-gated behaviour is tested inside its window |
| 10 | Sleep stored start+end but showed one timestamp and edited only the start, silently rewriting the duration behind the daily total and trend chart | `RELEASE_QA.md` §1b round-trip completeness matrix: every stored field visible and editable, and any edit touching one input of a derived value must touch all of them |

---

## After approval

- Status becomes **Pending Developer Release** (manual release chosen).
- App Store Connect → the version → **Release This Version** → live in a few hours.

## Version numbering

- Current live line: **1.0.0**. Resubmissions of a rejected 1.0 stay 1.0.0
  (attach the new build to the existing 1.0 record).
- **Family Sync = 1.1** later: bump `version` in app.json to `1.1.0`, set the
  Firebase EAS env vars, then follow `RELEASE_v1.1.md`.
