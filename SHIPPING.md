# OneCarbot — route to the App Store

Working list. Tick things off as they land. `YZ` = needs Yizhou (money, legal
identity, an Apple login); `dev` = code, can be done any time.

Guideline numbers refer to the
[App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/),
checked 30 Aug 2026.

---

## 0. Right now — unblock phone testing

- [ ] **`YZ`** Set the secret and deploy. Nothing can be tested past the sign-in
      screen until this is done.
      ```bash
      firebase functions:secrets:set LOGIN_CODE_PEPPER   # a long random string
      firebase deploy --only functions:loginCode,functions:deleteAccount,firestore:rules
      ```
- [ ] **`YZ`** Install Expo Go on the iPhone, then from `onecarbon_app/`:
      `npx expo start` and scan the QR with the Camera app.
- [ ] **`YZ`** Run a full session and report back on:
      - trail-making tap targets on a phone screen
      - whether the keyboard covers the numeric-memory input
      - whether reaction time *feels* right (Expo Go adds overhead — indicative only)
      - the sign-in email actually arriving from `auth@send.onecarbon.com`

---

## 1. Accounts and legal — the long pole

Start these first. Everything in section 4 is blocked behind them, and the
D-U-N-S number is the slowest single item on this page.

- [ ] **`YZ`** Apple Developer Program, $99/yr.
      - **Organization** (Healthspan Biotics Ltd) needs a D-U-N-S number — free,
        but can take days. The App Store then lists the company.
      - **Individual** is same-day but lists *your own name* publicly.
      - Switching later means transferring the app. Prefer Organization.
- [ ] **`YZ`** Install Xcode (~10GB). This machine has Command Line Tools only —
      verified: no `simctl`, no iPhoneOS SDK, no Xcode receipts. Needed for local
      dev builds and for a simulator.
- [ ] **`YZ`** Register bundle id `com.onecarbon.onecarbot` in App Store Connect.
- [ ] **`YZ`** Free Expo account for EAS builds.

---

## 2. Hard rejection blockers

These are not judgement calls — the app gets rejected without them.

- [x] **`dev`** **Informed consent, guideline 5.1.3(iii).** Done — `app/consent.js`
      plus `src/consent-text.js`, shown between sign-in and onboarding. Seven
      sections covering nature/purpose/duration, procedures, risks and benefits,
      data and sharing, withdrawal, and contact. Agree stays disabled until the
      text has actually been scrolled to the end, and `consent_version` +
      `consented_at` are written into the profile document.
      - [ ] **`YZ`** **Check the wording against the ethics-approved participant
            information sheet for NCT07457242.** Where they disagree, the approved
            document wins and `src/consent-text.js` must be corrected. Bump
            `CONSENT_VERSION` when it changes.
- [ ] **`YZ`** **Ethics approval, guideline 5.1.3(iv).** An independent ethics
      review board must have approved the research, and Apple can demand proof.
      PROFILE (NCT07457242) should already have this — have the document to hand
      before submitting, and note who to ask if Apple queries it.
- [x] **`dev`** **In-app account deletion, guideline 5.1.1(v).** Done —
      `deleteAccount` in `functions/index.js` plus Dashboard → Delete my account.
      The uid comes from a verified ID token (`checkRevoked: true`), never from
      the request body, so it can only ever delete the caller's own account.
      Firestore subtree goes first via `recursiveDelete`, then the pending login
      code, then the auth user.
      - [ ] **`YZ`** Deploy it: it is in the same `firebase deploy --only
            functions` as `loginCode`.
      - [ ] **`YZ`** Test it on a throwaway account and confirm in the Firebase
            console that `users/<uid>` and its subcollections are really gone.
- [ ] **`dev`** **No medical claims, guideline 1.4.1.** The battery must never
      read as diagnosing anything. The disclaimer register already used on the
      website is the right one. Audit every string before submission.

---

## 3. Privacy paperwork

- [ ] **`dev`+`YZ`** Update <https://onecarbon.com/legal/privacy.html> to actually
      describe the app: HealthKit sleep read, what leaves the device, retention,
      and the research use. Both stores require a working privacy policy URL, and
      HealthKit apps get extra scrutiny.
- [ ] **`dev`** `PrivacyInfo.xcprivacy` privacy manifest.
- [ ] **`dev`** Draft the App Privacy questionnaire answers for App Store Connect
      (data types, linkage to identity, tracking — we do not track).
- [ ] **`dev`** Confirm HealthKit data never goes to a third party for
      advertising or data mining — guideline 5.1.3(i). It currently does not; keep
      it that way.

---

## 4. Build and submit

- [ ] **`dev`** `eas init` → real value for `extra.eas.projectId` in `app.json`
      (still `REPLACE_AFTER_EAS_INIT`).
- [ ] **`dev`** Icon and splash — currently the Expo template defaults. Apple
      rejects placeholder art.
- [ ] **`YZ`** Screenshots, 6.9" iPhone. `supportsTablet` is false so no iPad set
      is needed.
- [ ] **`dev`** Store listing: name, subtitle, description, keywords, support URL.
- [ ] **`YZ`** Age rating and export compliance. `ITSAppUsesNonExemptEncryption`
      is already set false in `app.json`.
- [ ] `eas build --platform ios --profile production`
- [ ] `eas submit --platform ios`
- [ ] TestFlight round with real participants before public review.

Expect the first review of a health app to be slow and to come back with
questions.

---

## 5. Feature gaps vs app.html

Not blockers, but the app is thinner than the web version until these land.

- [ ] **`dev`** **Trend chart.** The dashboard shows the latest score and a delta
      only. Watching the trend is the entire point. `react-native-svg` is already
      installed and unused.
- [ ] **`dev`** **Compliance capture.** `probiotic_compliance_days`,
      `_interval` and `_pct` currently always write `null`. That is the trial's
      adherence measure.
- [ ] **`dev`** **Three missing sleep questions** — `trouble_fall`,
      `trouble_stay`, `wake_causes` all write `null`. The web asks nine, the app
      asks six.
- [ ] **`dev`** Feedback form — `app.html` has one, and the `feedback` form id
      already exists in `functions/index.js`.
- [ ] **`dev`** Google sign-in — `app.html` has it on web. Note that adding any
      third-party sign-in triggers guideline 4.8, which likely then requires Sign
      in with Apple as well. Plain email codes do not trigger it.

---

## 6. Decisions still open

- [ ] **Duplicate reminders.** `sendReminders` emails at day 14 *and* the app
      schedules a local notification for day 14. Both currently fire. Either
      accept that, or have the email skip users with an `expoPushToken`.
- [ ] **Quiz CTA goes to the one-time Stripe link**, so quiz finishers never see
      Subscribe & save. Parked earlier — revisit with conversion data.
- [ ] **Android.** Play is $25 one-off and far quicker to get through, but there
      is no Android phone to test on right now.

---

## Known bug in the web app

Worth fixing on the website while this is fresh: `compositeScore()` in
`app.html` guards with `v != null`, but a skipped task is stored as `''`, and
`'' != null` is true. So a skipped task feeds `NaN` into the average and wipes
out the composite. `src/scoring.js` in this repo already handles it — port the
fix back.
