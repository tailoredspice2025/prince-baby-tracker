# App Store screenshots

`render.mjs` draws the five listing screens as HTML and screenshots them with
headless Chromium. It is not a simulator capture — it is a hand-built replica,
so it has to be kept honest by hand.

What makes it match the app:

- **Real font.** Nunito 400/600/700/800/900 are read as TTFs out of
  `node_modules/@expo-google-fonts/nunito` and inlined as base64 `@font-face`.
  A system font stack looks close in a thumbnail and wrong at full size.
- **Real icons.** The SVG paths in the `I` map are copied verbatim from
  `src/components/icons.tsx`. Unicode glyphs (⌂ ♡ ☺) are not a substitute.
- **Real palette.** `P` mirrors the six quick-log tile colours.

## Running

```sh
node tools/store-screenshots/render.mjs   # writes ./out2
```

`playwright-core` is NOT a project dependency — the generator only ever runs
in the build container, and adding it would make every `npm install` on the
Mac heavier for no benefit. Install it on demand:

```sh
npm install --no-save playwright-core
```

Chromium is at `/opt/pw-browsers/chromium` in the build container; change
`executablePath` if you run it elsewhere. Do not run `playwright install`.

## Output

| Folder | Size | Notes |
| --- | --- | --- |
| `shots/iphone-6.5` | 1242 × 2688 | 6.5" slot; also accepted for 6.7"/6.9" |
| `shots/ipad-13` | 2048 × 2732 | 13" iPad slot |

The iPad renders wrap the page in a 700px centred column. That is not
decoration — it mirrors `src/theme/layout.ts`, where every scroll view is
capped at `CONTENT_MAX_WIDTH` and centred at or above `TABLET_BREAKPOINT`.
**Change one and change the other.** Before build 19 the app had no width cap
at all, so the tiles stretched to ~480pt each; a screenshot showing a layout
the app does not have is a 2.3.3 rejection.

## Keeping it honest

Every screen must be something the app can actually render. Two rules that
have already caught mistakes:

1. **No invented content.** The home timeline shows at most 8 rows because
   `DayHomeView.tsx` does `todayEvents.slice(0, 8)`. The iPhone renders show 4
   because that is what clears the fold; iPad shows all 8.
2. **Nothing hidden behind the tab bar.** The tab bar is 88pt at the bottom.
   Content must end above it — padding does not help, the content itself has
   to be short enough. Measure rather than eyeball:

   ```js
   const h = await p.evaluate(() => document.querySelector('.wrap').getBoundingClientRect().height);
   ```
