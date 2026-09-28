# Firestore rules tests

`firestore.rules` is the only thing between a stranger and a baby's health
records. The Firebase config ships inside every copy of the app and anonymous
sign-in is on, so **assume anyone can authenticate and send any request.**

These tests attack the rules the way that stranger would, in the real Firestore
emulator, and check every flow the app legitimately uses still works.

```sh
cd tools/rules-test
npm install          # separate from the app — needs Java for the emulator
npm test
```

## Why this exists

The rules shipped with Family Sync let any signed-in user **list every invite
code** — and a list of codes is a list of every familyId — and then **add
themselves as a caregiver with no code at all**, after which they could read
everything. A member could also promote themselves to owner, remove the owner,
or delete the family. Against those rules this suite fails 11 of 21; against
the current rules it passes 21 of 21.

## Rule for changing `firestore.rules`

Every change gets an attack test first, run against the *old* rules to show it
fails, then against the new ones. A rule that has only been read, not
attacked, is a guess about a baby's medical data.

After changing the file, **it must be republished** — Firebase console →
Firestore → Rules → paste → Publish. Editing the repo does nothing to the live
project.
