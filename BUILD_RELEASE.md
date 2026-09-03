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
npm run verify                                            # ← lint + typecheck. MUST print 0 errors, or stop
npx eas-cli build --profile production --platform ios     # build number comes from ios.buildNumber in app.json
npx eas-cli submit --platform ios --latest
```

`npm run verify` is not optional and not cosmetic: `react-hooks/rules-of-hooks`
is the rule that catches the build-11 sleep crash (a hook called after an early
`return`), and TypeScript cannot see that class of bug. Warnings are fine —
errors mean stop.

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
- [ ] ⛔ **`npm run verify` passes with 0 errors** (`eslint` + `tsc --noEmit` +
      **`vitest`**). The tests are one per bug that actually reached a build —
      sleep in Trends, the midnight ratchet, what a sleep row shows, and the
      seeded-data strip. They exist so none of those can return quietly.
      Lint is not cosmetic here: `react-hooks/rules-of-hooks` is the rule that
      catches the build-11 crash class — a hook called after an early `return`
      changes the hook count between renders and kills the app. TypeScript
      cannot see it. Warnings are tolerated; **errors block the build.**
- [ ] ⛔ **`npm run cdse` reviewed.** Reports fields that are captured and never
      shown, shown and never fillable, or modelled and unused — the class that
      has cost more builds here than any other. It is a report, not a gate:
      every finding is either a gap to close or an `ALLOWED` entry with its
      reason. It found `Vaccine.reaction` printed in the pediatrician PDF with
      no way to enter one, after months of shipping.
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
| 1 | Build number collisions (autoIncrement + remote source BOTH kept producing duplicate numbers across `git reset --hard`) | **Explicit, committed build number.** `autoIncrement` is OFF and `appVersionSource` is `local`; the build number is exactly `ios.buildNumber` in app.json. Before each production build, bump that number in the repo and push — deterministic and visible in git, no magic. Current: **25** for v1.0.3 (1.0.1 build 21 is live). Build 17 was bumped but superseded before submission — nothing shipped from it. |
| 2 | — | (see #1) |
| 3 | `git reset --hard` discarded local auto-bumps → duplicate numbers | committed explicit number survives reset — it IS the repo value |
| 4 | Stale local `app.json`/`eas.json` → repeated merge conflicts | always `git reset --hard origin/<branch>` before building (golden rule 1) |
| 5 | App **crashed on launch** and reached Apple (rejected 2.1(a)) | TestFlight launch gate before every submit (golden rule 2) — plus removed the unused `react-native-reanimated` that caused it |
| 6 | Encryption compliance prompt each submit | `ITSAppUsesNonExemptEncryption:false` in app.json |
| 7 | Push-notification prompt each build | saved "No, don't ask again" to eas.json |
| 8 | Build 11 **crashed on sleep start/stop** — `HomeScreen` returned early above four `useMemo`s, so flipping the night-view flag changed the hook count mid-render | ESLint + `react-hooks/rules-of-hooks` in `npm run verify`, wired into the pre-build checklist; `HomeScreen` is now a pure switch between `DayHomeView` / `NightHomeView` so no hook can sit under a conditional return; plus a root `ErrorBoundary` so a render error degrades to a recoverable screen instead of killing the app |
| 9 | Bug only fired **after 20:00**, so daytime testing missed it entirely | `RELEASE_QA.md` §1b "time-dependent UI" — clock-gated behaviour is tested inside its window |
| 10 | A daily 18:00 notification nobody set, armed on **every launch** from the demo seed. `App.tsx` read `medications` at first render, before `persist` had rehydrated, so the snapshot was always the seed regardless of what was stored — and the migration that cancels it runs once, on the version bump, while the effect runs every time | `src/lib/bootReminders.ts`: nothing is armed until `persist.hasHydrated()`, and a seeded id is never armed at all. Three tests in `regression.test.ts`. **Rule: no launch-time code may read persisted state before hydration** — the initial state is the demo seed, so anything that does is reading fabricated data |
| 11 | A daily medicine reminder kept firing after the dose was logged. It was one `repeats: true` alarm, and iOS cannot run code when a *local* notification is delivered — so "already given" can only be decided when scheduling, and nothing rescheduled on logging. The rule for "due today" also lived inline in `DayHomeView`, where the scheduler could not reach it | `src/lib/medicineReminders.ts` owns the rule; both the banner and the scheduler ask it. Dated one-shots in a rolling window replace the repeating alarm, re-synced on launch / log / edit. **Rule: a notification that cannot be cancelled at delivery must be decided at scheduling time, and any rule two surfaces need lives in a module, never in a component** |
| 12 | A feed logged at 11:53 with a three-hour reminder produced a notification seven minutes later. The trigger was written `{ date, channelId } as Notifications.DateTriggerInput`, and that type *requires* `type: SchedulableTriggerInputTypes.DATE` — so the assertion was claiming a shape the object did not have. Vaccine reminders had it too; the medicine reminders did not, which is why those verified correctly on a device and this did not | One `dateTrigger()` builder, returning a properly typed value with **no assertion**, used by all three. Verified by removing the discriminator: with the cast `tsc` passes silently, without it `TS2741: Property 'type' is missing`. **Rule: a type assertion in this codebase is a check switched off.** Prefer a helper whose return type the compiler must satisfy |
| 13 | Two builds lost because CDSE was applied to the *fields being added* rather than the *system being changed*. Three reminder kinds sit in one file; the medicine one was rewritten and tested while feed and vaccine kept their timing inline where no test reaches, and both were wrong | All three now produce a `PlannedNotification` from a pure, tested planner, and `notifications.ts` has exactly **one** `scheduleNotificationAsync` call site and **zero** type assertions. **Rule: when two things do the same job in two different ways, the difference is where the next bug is** |
| 14 | "Export for pediatrician" was never handed `events` at all, so feeds, sleep and nappies — everything the six Home tiles log — reached Home and Trends and stopped. Milestones were missing too, and the Health redesign's own temperature readings and dose links never reached it either, one commit after being built | The export now takes every record type the store holds, and `rhythmSummary()` in `pdfSummary.ts` derives feeds/milk/sleep/nappies per day from the already-tested `computeDailyStats`. **Rule: the PDF is a surface. When a field is added, the CDSE surface check includes the document that leaves the app** |
| 10 | Sleep stored start+end but showed one timestamp and edited only the start, silently rewriting the duration behind the daily total and trend chart | `RELEASE_QA.md` §1b round-trip completeness matrix: every stored field visible and editable, and any edit touching one input of a derived value must touch all of them |

---

## After approval

- Status becomes **Pending Developer Release** (manual release chosen).
- App Store Connect → the version → **Release This Version** → live in a few hours.

## Version numbering

- **1.0.1 (build 21) is LIVE on the App Store** as of 3 Aug 2026, so build 22
  needs a new version record: **1.0.2**, created via **+ Version**.
- Historic: **1.0.0 (build 16) was the previous live build.** Once a version is released you
  cannot attach another build to it — the next release needs its own version
  record. So 1.0.1 = build 18, created in App Store Connect via **+ Version**.
- **Build 18 is uploaded but was never submitted, and should not be** — it
  leaves defect #10 in place, so the 6pm Vitamin D notification survives the
  update. Release build 19 instead; it carries everything 18 has.
- **1.0.1 stays 1.0.1 for build 19.** A version number is only locked once the
  version is *released*, and 1.0.1 never was — so build 19 attaches to the
  existing 1.0.1 record. Do not create 1.0.2.
- Bump `version` in app.json the same way as the build number: explicitly, in
  the repo, committed. Never by hand on the Mac at build time.
- **Family Sync = 1.1** later: bump `version` in app.json to `1.1.0`, set the
  Firebase EAS env vars, then follow `RELEASE_v1.1.md`.
