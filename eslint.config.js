// Flat config (ESLint 9) on top of Expo's shared rules.
//
// The rule that matters most here is react-hooks/rules-of-hooks. HomeScreen
// shipped in build 11 with an early `return` above four `useMemo` calls, so
// starting a sleep session changed the hook count between renders and killed
// the app. TypeScript cannot see that class of bug; this can. Run before
// every build — see BUILD_RELEASE.md.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    // `tools/` holds build-time Node scripts, not app code — they import devDeps
    // that the app bundle never sees (playwright-core), which this config's
    // resolver is right to flag and wrong to fail the app build over.
    ignores: ['node_modules/**', 'ios/**', 'android/**', '.expo/**', 'dist/**', 'scripts/**', 'tools/**'],
  },
  {
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // A web-HTML concern: apostrophes in JSX text render fine in React
      // Native. Left on it produced 22 errors of pure noise, which is how a
      // lint gate stops being read at all.
      'react/no-unescaped-entities': 'off',
    },
  },
];
