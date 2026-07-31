# DenBaby — feature audit template

## Why this file exists

Voice logging was audited in full: the parser was run against real utterances,
the field mapping was traced into the store, the time resolution was proved
wrong with printed output. The report was detailed and it was useless, because
nobody had checked whether holding the mic captures a single word. It doesn't.
Everything downstream of that was analysis of a pipe with no water in it.

The gap wasn't a wrong answer. It was an **invisible** one — three links of the
chain were checked and the fourth was silently skipped, because it was the one
link that can't be verified by reading source. This file exists to make that
kind of silence impossible.

---

## The chain

Every feature gets traced in this order, and **capture comes first**:

| Link | Question |
|---|---|
| **Capture** | Does the input actually arrive? Not "is the code plausible" — does data get in? |
| **Derive** | What is computed from it, and is the computation right? |
| **Surface** | Every place the value must appear: row, list, daily total, chart, export |
| **Editable** | Can the user correct it? Does a round-trip edit survive and stay consistent? |

Two rules that fall out of this, learned the hard way:

1. **Any edit path touching one input of a derived value must touch all of
   them.** Sleep's duration comes from a start *and* an end; the edit sheet
   wrote only the start, silently rewriting the daily total and trend chart.
2. **Every stored field must be visible somewhere and correctable somewhere.**
   If it's in the model and on no screen, either surface it or delete it.

---

## The chain applies to code being written, not just code being audited

The framework was used properly on sleep and on voice — both times as a
*review* of existing code, on request. It was not used on the moon button in
build 12, which was written fresh and shipped with a green `npm run verify`.
The trace takes ten seconds and needs no device:

> capture — user taps a moon, meaning "make it dark" · derive —
> `setForceNightPreview(true)` · surface — `NightHomeView`, **feed and diaper
> only** · editable — Exit

The mismatch is plain at the surface step, in code written an hour earlier.

**So: every change ships with one sentence — "tap X and you will see exactly
Y." If that sentence can't be written, the change isn't finished.**

The tell that it was skipped was already in writing. The test handed over said
*"moon button → night colours"* — a wrong expectation, because nobody had
traced what the tap actually rendered. **A test instruction that states the
action but guesses the outcome is the signature of an untraced change.** Write
the expected outcome first; if it can't be stated precisely, stop and trace.

---

## Third-party controls colour themselves

Any control that renders its own text — date pickers, native segmented
controls, system sheets — takes its colours from the **device's** appearance,
not from the app's theme. When the user has the app in Light while the phone is
in Dark, that control draws light text on a light card and disappears.

This has now shipped twice: the segmented control in build 11 ("says Boy and
blank") and every `DateTimePicker` in build 16. Both times the fix was applied
to the reported instance and never swept.

**Rule: a third-party control must be told which theme it is in, and the way to
guarantee that is a wrapper.** `Segmented` and `ThemedDateTimePicker` exist so
the bare component is never used directly. If you reach for a raw
`DateTimePicker`, that's the bug.

---

## The two statuses — there is no third

Every link in every audit gets exactly one of these. Never leave a link out.

**`VERIFIED`** — the command that was run and its output, pasted. A claim
without output is not verified. Example, from the sleep-in-trends bug:

```
open-ended sleep started 20 Jul, evaluated 30 Jul:
07-20=15.0h  07-21=24.0h  07-22=24.0h … 07-29=24.0h  07-30=12.0h
```

**`NOT VERIFIED — needs device`** — with the exact test the human runs, short
enough to do in under a minute. Example:

> Hold the mic on Home and speak. Do your own words appear on screen as you
> talk? yes / no

Anything else — "looks correct", "should work", "the wiring is right" — is
`NOT VERIFIED`. Reading the source is not verification.

---

## Rule: what can't be executed from here goes at the TOP

The agent runs in a container with no phone, no App Store, no real Firebase
project, no notification service. These boundaries are where the real bugs
live, and they are exactly the ones it is structurally blind to:

- device hardware — microphone, camera, haptics, Face ID, photo library
- notifications actually firing
- Firebase / family sync against the live project
- TestFlight install and launch
- App Store review behaviour
- anything gated on the clock, the locale, or the timezone

**These are listed first in every audit report, not last.** A reader must be
able to see the untested surface before reading a single conclusion.

---

## The template — copy this per feature

```
# Audit: <feature>

## Cannot be verified from here (test these on device)
- [ ] <exact 30-second test>            → expected: <observable result>
- [ ] <exact 30-second test>            → expected: <observable result>

## Chain
| Link     | Status                    | Evidence / test |
|----------|---------------------------|-----------------|
| Capture  | VERIFIED / NOT VERIFIED   | <output, or the device test> |
| Derive   | VERIFIED / NOT VERIFIED   | <output> |
| Surface  | VERIFIED / NOT VERIFIED   | <every surface listed, each ✅/❌> |
| Editable | VERIFIED / NOT VERIFIED   | <round-trip result> |

## Findings
| # | Severity | Finding | Evidence |
|---|----------|---------|----------|

## Fields: stored vs shown vs editable
| Field | Stored | Shown where | Editable where |
|-------|--------|-------------|----------------|
```

Severity is one of: **corrupts data** · **crashes** · **review risk** ·
**silently loses input** · **no correction path** · **cosmetic**.

---

## Worked example — sleep (30 Jul 2026)

| Link | Status | Evidence |
|---|---|---|
| Capture | VERIFIED | `toggleSleep` writes `startTime` + `endTime` (`store.ts:315`) |
| Derive | VERIFIED | `stats.ts` splits spans at midnight; ran it, totals correct |
| Surface | ❌ | trends ✅, day chip ✅, **row showed one bare timestamp (the end)** ❌, **running session invisible** ❌ |
| Editable | ❌ | **start only — saving rewrote the derived duration behind the trend chart** |

The crash was found the same way, but by a different route: the linter. It is
the reason `react-hooks/rules-of-hooks` is now in `npm run verify`.

## Worked example — voice (30 Jul 2026): how this file came to exist

| Link | Status | Evidence |
|---|---|---|
| Capture | **NOT CHECKED — the whole failure** | Never asked whether a spoken word reaches the parser. It does not. |
| Derive | VERIFIED | `"slept 2 to 4"` → always 2 PM–4 PM regardless of when spoken |
| Surface | VERIFIED | solids food and pump side parsed then dropped by `applyVoiceDraft` |
| Editable | VERIFIED | the "Edit" button only cancels the countdown; there is no edit UI |

Three links verified with printed evidence, one link never examined — and the
unexamined one made the other three moot. Note also the cheapest check of all
was never used: **ask the person holding the phone what they see.** For any
feature touching hardware, ask for the observable behaviour *before* doing deep
code analysis.

---

## Standard device tests

Keep these short enough that there's no excuse to skip them.

| Feature | Test | Expected |
|---|---|---|
| Voice capture | hold mic, say "bottle 120 ml" | your words appear on screen as you speak |
| Sleep crash | start + stop a sleep **after 20:00** | no crash, entry logged |
| Sleep record | open the entry | start, end and duration all shown and editable |
| Round trip | any event: open → change every field → save → reopen | every change stuck |
| Derived totals | after editing a sleep | Trends daily hours moved by the same amount |
| Night mode | moon button → Exit | enters night colours, returns cleanly |
| Error boundary | force a render error | recoverable screen, app survives |
| Notifications | set a feed reminder | it actually fires |
| Family sync ☁️👥 | log on device A | appears on device B |

---

_Add a completed audit per feature below this line, newest first._
