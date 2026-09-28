import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // App tests only. tools/rules-test attacks firestore.rules and needs the
    // Firestore emulator and its own dependencies, so it runs separately with
    // `cd tools/rules-test && npm test` — see its README.
    include: ['src/**/*.test.ts'],
  },
});
