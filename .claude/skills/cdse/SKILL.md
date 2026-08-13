---
name: cdse
description: The Capture → Derive → Surface → Editable check that every DenBaby change goes through. Use this skill for ANY bug fix or feature work in this repo — before writing code, and again before saying a fix is done. Especially when the user reports something that "doesn't show up", "keeps happening", "isn't saved", "won't clear", "can't be edited", or is wrong in one place but right in another. Also use before any build or release. Covers the four questions, the sweep script that finds this bug class mechanically, and the two failure patterns that have each cost multiple builds.
---

# CDSE — capture, derive, surface, editable

Almost every DenBaby defect that reached a real build was a break in one chain,
not wrong logic. The logic was usually fine. Something was captured and never
shown, or derived in a place only one caller could reach.

| | | shipped example |
| --- | --- | --- |
| **Capture** | is the value stored at all? | voice logging captured nothing on device — everything downstream was moot |
| **Derive** | is it computed, in a module something else can call? | sleep end time stored, duration never derived into the row |
| **Surface** | is it shown **everywhere** it should be? | `lastGiven` stamped; the Home banner read it, the notification never did |
| **Editable** | can a parent correct it? | measurements were add-only, so a mistyped weight sat in the growth curve forever |

The reason to run all four rather than fix what was reported: the report is one
symptom of a break, and a break usually has more than one symptom. Fixing the
reported instance is what turns one bug into four builds.

## On every bug fix, before writing code

Start from **the data field, not the screen**. Name the field, then answer the
four questions with `grep`, not memory:

```bash
grep -rn "fieldName" src/ --include=*.ts --include=*.tsx | grep -v demoData
```

Then ask, in order:

1. **Where is it written?** If nowhere the user can reach, everything below is
   theatre — fix capture first and stop.
2. **Where is the rule that interprets it?** If it is inside a component, that
   is the bug, whatever the symptom. See the first pattern below.
3. **Every place it should appear** — list them, then check each. A row, a
   trend, a notification, a banner, the pediatrician PDF. The PDF is the one
   most often forgotten and the one that matters most.
4. **Can it be corrected and deleted?**

Write the answer down in the commit message. If a stage is deliberately not
done, say which and why — an unstated gap is indistinguishable from an
oversight next time someone reads it.

## Run the sweep

```bash
npm run cdse        # node tools/cdse-sweep.mjs
```

It reads every field in `src/types/models.ts` and reports three kinds of break:

- **surfaced, never captured** — a screen renders it; nothing can fill it
- **captured, never surfaced** — the parent types it and never sees it again
- **modelled only** — in the type and nowhere else

It found `Vaccine.reaction` (printed on the Health row *and* in the
pediatrician PDF, with no field anywhere to enter one) and `Vaccine.batchNo`
(a real form field, read by nothing). Both had been shipping for months.

Clean output is the expected state. A finding is either a gap to close or an
entry in the script's `ALLOWED` map **with the reason written out** — an
unexplained exemption is how a real gap gets silenced.

Two things it cannot do, so do them by hand: it lists field names shared by
more than one interface, because grep cannot attribute those; and it says
nothing about **derive** or **editable**, which need judgement.

## Pattern 1 — a rule inside a component has exactly one caller

`isDueToday` was written inline in `DayHomeView`. It was correct. The Home
banner cleared properly. The notification could not ask the same question, so
it fired every evening after the dose was logged — one right rule, one
reachable caller, and a bug that survived three builds.

When two surfaces need the same answer, the rule goes in `src/lib/` where both
can call it and a test can too. That is also the only way it gets a regression
test: `regression.test.ts` is one test per bug that reached a build, and a test
cannot reach into a component.

## Pattern 2 — the demo seed masks missing capture

`Vaccine.reaction` and `Milestone.typicalAgeRange` looked alive for months
because `demoData.ts` filled them. No user could ever produce either. Build 18
strips the seed, so every field in this state turns blank on real installs.

This is why the sweep excludes `demoData.ts` when looking for writes, and why
**"I saw it working" is not evidence of capture** — check what wrote it.

## Before saying a fix is done

- The reported symptom is fixed **and** the other surfaces of the same field
  were checked, not assumed
- A regression test exists that fails without the fix
- `npm run verify` passes — lint, typecheck, tests
- `npm run cdse` is clean, or the new exemption carries its reason
- Anything found but deliberately not fixed is written into `TODO.md` with the
  reason, rather than left in the conversation

## What only the person holding the phone can confirm

This container has no device, no App Store, and no clock but its own. Capture
on a real phone, notification delivery, and anything time-dependent are exactly
the stages that cannot be checked here. Say plainly which stage is unverified
and what test would settle it — `AUDIT.md` has the two-status rule: VERIFIED
with pasted output, or NOT VERIFIED with the exact device test. There is no
silent third option.
