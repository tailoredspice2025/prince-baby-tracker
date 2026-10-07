import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

// `getReactNativePersistence` exists only in @firebase/auth's React Native
// build, which Metro picks via the `react-native` export condition. Its
// package lists `types` first, so TypeScript always reads the web typings and
// never sees it. This declares the one function, with the signature from
// node_modules/@firebase/auth/dist/rn/index.rn.d.ts; the regression tests
// check that the RN build really exports it, so a Firebase upgrade that drops
// it fails there instead of on a phone.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
