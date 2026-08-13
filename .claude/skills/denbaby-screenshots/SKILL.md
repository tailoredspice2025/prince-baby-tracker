---
name: denbaby-screenshots
description: Generate or update App Store screenshots for DenBaby (this repo — the Expo/React Native baby tracker). Use this skill whenever the user asks for app screenshots, store images, listing images, App Store Connect assets, iPad screenshots, marketing screens, or says the current screenshots are stale, wrong, or don't match the app — and also whenever a UI change ships that would make an existing screenshot inaccurate. Covers the render pipeline, the fidelity rules that make the images look like the real app rather than a mockup, and the App Store review rules that make them safe to upload.
---

# DenBaby App Store screenshots

The listing images are hand-built HTML rendered by headless Chromium, not
simulator captures. That is a deliberate choice — there is no Mac or device in
this container, and Apple needs iPad sizes the owner has no iPad to produce.

The whole job is therefore: **make a drawing that is indistinguishable from a
screenshot of the shipped binary.** Two ways to fail, and both have happened:

- Fail on *craft* — the drawing looks like a mockup, and the owner rejects it
- Fail on *truth* — the drawing looks great but shows something the app does
  not do, and Apple rejects it under guideline 2.3.3

The rules below exist because each one was learned by getting it wrong.

## Run it

```bash
node tools/store-screenshots/render.mjs   # writes ./out2
```

The generator lives at `tools/store-screenshots/render.mjs` with its own
`README.md`. Read both before changing anything. Chromium is at
`/opt/pw-browsers/chromium`; do not run `playwright install`.

Committed output lives in `tools/store-screenshots/shots/`:

| Folder | Size | Slot |
| --- | --- | --- |
| `iphone-6.5/` | 1242 × 2688 | 6.5" — also accepted for 6.7"/6.9" |
| `ipad-13/` | 2048 × 2732 | 13" iPad — **required**, `supportsTablet` is on |

## Fidelity: use the real assets, they are all in the repo

The first attempt at these looked visibly worse than earlier work and the owner
said so. The cause was taking two shortcuts when the real thing was sitting
right there in the repo:

**Fonts.** Read the Nunito TTFs out of
`node_modules/@expo-google-fonts/nunito/{400Regular,600SemiBold,700Bold,800ExtraBold,900Black}/`
and inline them as base64 `@font-face`. A system font stack (`-apple-system`,
Helvetica) looks close in a thumbnail and obviously wrong at 1242px wide — the
letterforms are the single strongest signal that an image is a mockup.

**Icons.** Copy the SVG path data verbatim from `src/components/icons.tsx`
(22 exported icons). Unicode glyphs — ⌂ ♡ ☺ 💊 — are not a substitute; they
render in the system emoji font and read as placeholder art.

**Colours.** Mirror `src/theme/tokens.ts`: `pastels` for the six quick-log
tiles, `lightColors` for ink and surfaces. Do not eyeball hex values from an
existing PNG.

The principle generalises: **if the app computes it, read it from where the app
reads it.** Anything retyped by hand will drift the moment the app changes.

## Truth: the drawing must match the shipped binary

A screenshot showing a feature the binary does not have is a 2.3.3 rejection,
and this listing has already carried one — the original images showed a voice
logging bar for months after voice was switched off.

Before rendering, check what is actually on:

- **`src/lib/features.ts`** — anything `false` must not appear. `voiceLogging`
  and `nightFeedingView` are both off. No mic button, no night view.
- **Real caps.** The home timeline shows at most 8 rows because
  `DayHomeView.tsx` does `todayEvents.slice(0, 8)`. Do not draw 12 rows because
  the space allows it.
- **`src/theme/layout.ts`** — the iPad renders wrap the page in a 700px centred
  column because that is what `CONTENT_MAX_WIDTH` / `TABLET_BREAKPOINT` do at
  runtime. **These two must change together.** Before build 19 there was no cap
  at all and the honest iPad render showed stretched tiles.

When a proposed layout has not shipped yet, it is fine to render it — label it
clearly as proposed and say plainly that it cannot be uploaded until the code
ships. Never hand over a proposed render as if it were current.

## Sample content

The screens show a plausible day for one baby. Keep it ordinary: 120 ml
bottles, a 1h 20m nap, a wet diaper. Two things to avoid:

- **Nothing alarming.** No high fevers, no missed vaccines. This is a listing
  image, not a case study.
- **Nothing that contradicts another screen.** If Home says "4 months, 12 days",
  Health and Baby say the same. Reviewers do read across screens.

## Layout: measure, do not eyeball

The tab bar sits at the bottom of every main screen. Content that runs under it
is the most common defect in these renders and it is invisible until you look
at the full-size PNG — the first corrected set still had the last timeline row
and a hint line hidden behind it.

Padding does not fix this. Padding is *below* the content, so it pushes nothing
up; the content itself has to be short enough. Measure:

```js
const h = await p.evaluate(() => document.querySelector('.wrap').getBoundingClientRect().height);
// content bottom = statusBarHeight + h - wrapBottomPadding, must clear (viewportHeight - 88)
```

Print the number for every screen and compare it against the limit before
accepting a render. If a screen overflows, cut content (a row, a card) or
tighten spacing — do not shrink the type to fit, which makes it look unlike the
app.

## Checklist before handing images over

1. `node tools/store-screenshots/render.mjs` ran clean and printed both sizes
2. Opened at least one iPhone and one iPad PNG and actually looked at it
3. Nothing behind the tab bar on any screen
4. No feature that is `false` in `features.ts` appears anywhere
5. iPad renders match `src/theme/layout.ts` as it currently stands
6. Copied into `tools/store-screenshots/shots/` and committed — the container
   is ephemeral, so uncommitted images are lost
7. Sent to the user with `SendUserFile`, stating which are faithful to the
   shipped build and which (if any) show something not yet released

## When a UI change lands

Re-render. A shipped change to Home, Growth, Trends, Health or Baby makes the
corresponding image stale, and stale images are the exact thing that produced
the voice-bar problem. Cheap to redo, expensive to be rejected for.
