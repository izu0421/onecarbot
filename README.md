# OneCarbot — mobile app

React Native (Expo SDK 57) app for iOS and Android. Companion to the PROFILE
trial: participants complete a cognitive session roughly every two weeks and
watch their own trend.

This is a **separate git repo** from the website. The website repo is served by
GitHub Pages and ignores this directory — see the note in `../.gitignore`.

## Why native rather than a wrapper

`app.html` on the website already does most of this in a browser. Two things
justify a real app, and they are also what clears Apple's minimum-functionality
bar (App Store guideline 4.2):

- **Sleep import** from HealthKit / Health Connect, rather than asking someone
  to remember how long they slept.
- **Local reminders** on day 14, which do not depend on the participant reading
  an email.

Accurate reaction-time measurement is a third: a WebView adds variable latency
that matters on a task scored in milliseconds.

## Sign-in

Passwordless. `loginCode` (a Cloud Function in the website repo) emails a
six-digit code; the app posts it back and gets a custom token. No password to
forget, and no Universal Links / App Links to misconfigure — which is what
Firebase's own email-link sign-in would have needed since Dynamic Links shut
down in August 2025.

The code can be read on a different device from the one signing in. The
function reuses an existing account when the email already has one, so anyone
who started on `app.html` keeps their uid and their history.

## Backend

Same Firebase project as the website (`onecarbon-app`), same Firestore tree,
same rules:

```
users/<uid>                       email, name, lastSeen, probiotic* fields
users/<uid>/profile/data          onboarding answers
users/<uid>/sessions/<id>         completedAt, results, sleep, probiotic, device
```

`src/store.js` mirrors `app.html`'s writes field for field. **Do not rename
anything in there** — a participant who uses both clients must land in one
history. The `probiotic_*` field names are stored data, not outward-facing copy,
and are deliberately left as they are.

`src/scoring.js` copies the domain curves from `app.html` so a composite
computed here equals one computed on the web.

## Layout

```
app/                      expo-router screens
  _layout.js              auth gate: signed out -> sign-in, no profile -> onboarding
  sign-in.js
  onboarding.js
  dashboard.js
  session/sleep.js        questionnaire + Health import
  session/battery.js
  session/results.js
src/
  firebase.js             AsyncStorage auth persistence (RN has no localStorage)
  store.js                Firestore reads/writes
  scoring.js              composite + domain scores
  battery/tasks.js        content generation and scoring, no React
  battery/Battery.js      the seven task screens and the runner
  health.js               HealthKit + Health Connect sleep import
  notifications.js        day-14 local reminder
  i18n.js                 en / zh
  ui.js, theme.js         shared primitives, website palette
scripts/logic-check.mjs   `npm test`
```

## Running it

The health modules are native, so **Expo Go will not work** — you need a
development build:

```bash
npm install
npx eas login
npx eas init                 # then put the projectId into app.json extra.eas
npx eas build --profile development --platform ios     # or android
npx expo start --dev-client
```

`npm test` runs the pure-logic checks (scoring parity, task generation) in plain
node — no simulator needed.

## Before this can ship

- [ ] `app.json` → `extra.eas.projectId` is still `REPLACE_AFTER_EAS_INIT`
- [ ] Icon and splash are the Expo template defaults
- [ ] Apple Developer and Google Play accounts, and the bundle id
      `com.onecarbon.onecarbot` registered in both
- [ ] Privacy policy URL for both stores, and a privacy manifest for HealthKit
      data use — reusing <https://onecarbon.com/legal/privacy.html> means it
      must actually describe the app's Health access
- [ ] In-app account deletion — App Store guideline 5.1.1(v) requires it for
      any app that creates accounts. Needs a Cloud Function; a client SDK
      cannot delete the `users/<uid>` subtree recursively.
- [ ] Deploy `loginCode` and set the `LOGIN_CODE_PEPPER` secret
- [ ] Decide whether the `sendReminders` email and the local notification should
      both fire, or whether one suppresses the other
- [ ] Real device testing of the battery — timing, and the trail-making tap
      targets on small screens
