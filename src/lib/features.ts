/**
 * Build-time feature switches.
 *
 * Deliberately a constant, NOT a value in `settings`. Anything read from the
 * persisted store is already `true` on every install that has run a previous
 * build — changing the default in `demoData.ts` would leave the feature
 * visible on exactly the devices we are trying to hide it from, and would
 * need a persist migration to correct. A constant is unambiguous and takes
 * effect everywhere the moment it flips.
 */
export const FEATURES = {
  /**
   * Voice logging is OFF for the v1.0 App Store release.
   *
   * It is not a feature with rough edges — it does not work. Holding the mic
   * captures nothing on device, so every attempt falls through to the
   * "Didn't catch that" screen, whose shortcut chips then log hardcoded
   * default entries. Downstream of that, spoken values are parsed and then
   * dropped (solids food, pump side), spoken times resolve wrongly
   * ("slept 2 to 4" always returns 2 PM–4 PM), and a voice sleep with no end
   * time credits 24 h of sleep to every subsequent day in Trends.
   *
   * Turning this back on is the whole of the UI work for v1.1 — the screens,
   * parser and store paths are all still here and still compile. Everything
   * that has to be fixed first is in BACKLOG.md, starting with capture: no
   * parser work until a device test proves a spoken phrase reaches
   * `parseVoiceTranscript` intact.
   */
  voiceLogging: false,

  /**
   * The stripped night-feeding screen (feed + diaper only) is OUT of v1.0.
   *
   * It has now caused two bad builds. In 11 it switched itself on during a
   * sleep session at night, replacing the whole home screen — and, because it
   * gated an early `return` above four hooks, crashed the app. In 12 it was
   * made opt-in behind a moon button, but a moon means *dark colours*, so
   * tapping it dropped you into a two-button screen that reads as the app
   * having lost everything.
   *
   * The moon button now does what it looks like it does: Light ⇄ Dark theme.
   * This screen comes back in 1.1 only if it earns a control of its own that
   * says what it is.
   */
  nightFeedingView: false,
} as const;
