# Firebase setup for Family Sync (v1.1)

Everything code-side for multi-caregiver Family Sync is already built and
dormant. The feature switches itself on when the app is built with real
Firebase credentials. These are the one-time steps to create them —
roughly 30 minutes, all in the browser except the last part.

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com and sign in with a Google
   account (any — this becomes the project owner).
2. **Add project** → name it `denbaby` → you can disable Google Analytics
   when asked (we don't use it) → **Create project**.

## 2. Register the app and get the config values

1. On the project overview page, click the **Web** icon (`</>`) to add a
   web app (this covers React Native too for our purposes).
2. Nickname: `DenBaby` → **Register app**.
3. It shows a `firebaseConfig` code block with six values (`apiKey`,
   `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`,
   `appId`). Keep this tab open — these go into `.env` in step 5.

## 3. Enable anonymous sign-in

1. Left sidebar: **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → **Anonymous** → toggle **Enable** → Save.

## 4. Create the database and publish the security rules

1. Left sidebar: **Build → Firestore Database** → **Create database**.
2. Location: pick `europe-west2` (London). Start in **production mode**.
3. Once created, open the **Rules** tab, delete what's there, and paste
   the full contents of `firestore.rules` from this repo → **Publish**.

## 5. Put the config values into the project

1. In the repo, copy `.env.example` to `.env`.
2. Fill each `EXPO_PUBLIC_FIREBASE_*` line from the config in step 2.
   (`.env` is gitignored — these values never get committed.)
3. For EAS production builds, the same six values must also exist as EAS
   environment variables so they're baked into the App Store build:

   ```
   npx eas-cli env:create --environment production --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..."
   ```

   Repeat for all six (or add them in the expo.dev dashboard under
   Project → Environment variables, environment "production").

## 6. Verify before shipping

- Build to two devices/simulators (`npx expo run:ios` locally is fine).
- Phone A: Profile → Invite caregiver → set your name → code appears.
- Phone B: fresh install → "Join your family" → enter code.
- Log a feed on B; it should appear on A within seconds, labeled with
  B's name. Then test Leave family on B.

These values are not secrets in the traditional sense — they ship inside
every Firebase app's binary. Security comes from the Firestore rules
(step 4), which only let a family's own caregivers read its data.

## Scaling & cost

Solo users (no Family Sync) cost nothing — their data never leaves the
device. Only sync families touch Firestore, and the bill is dominated by
document **reads**.

- **Live sync reads a rolling recent window**, not a baby's whole history.
  See `SYNC_WINDOW_DAYS` in `src/lib/firestoreSync.ts` (currently 14 days).
  This keeps reads flat as a baby accumulates months of logs; older history
  stays on each device. Lower the constant to cut cost further, raise it to
  reload more on cold start.
- **Move to the Blaze (pay-as-you-go) plan before real scale.** The free
  Spark plan has *daily* caps (50k reads/day) that are fine for you + a
  co-parent testing, but would stall sync at real user counts. Blaze
  includes the same free daily tier before charging.
- **Set a budget alert** in the Google Cloud console (Billing → Budgets &
  alerts) — e.g. email at £20/month — as insurance against surprises.
- Further reduction at large scale (thousands of active sync families):
  switch from the `firebase` JS SDK to `@react-native-firebase`, which has
  native on-disk persistence + resume tokens so cold launches read only
  what changed. Bigger change — not needed until you're actually there.
