#!/bin/bash
# One-time setup: registers the Firebase config as EAS production environment
# variables so App Store builds ship with Family Sync enabled.
# Run from the repo root: bash scripts/setup-eas-env.sh
# (These values are not secrets — they ship inside every Firebase app binary.
#  Access control lives in firestore.rules, not here.)
set -e

create () {
  npx eas-cli env:create --environment production --name "$1" --value "$2" --visibility plaintext --non-interactive \
    || npx eas-cli env:update --environment production --name "$1" --value "$2" --non-interactive
}

create EXPO_PUBLIC_FIREBASE_API_KEY              "AIzaSyChn85OipTYRds916UwGD2WsnC4XullZcs"
create EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN          "denbaby.firebaseapp.com"
create EXPO_PUBLIC_FIREBASE_PROJECT_ID           "denbaby"
create EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET       "denbaby.firebasestorage.app"
create EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID  "462468618415"
create EXPO_PUBLIC_FIREBASE_APP_ID               "1:462468618415:web:58b0610f72cdc32a211c5a"

echo ""
echo "Done. Verify with: npx eas-cli env:list --environment production"
