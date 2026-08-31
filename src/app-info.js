// What the app tells people about itself, and what they acknowledge.
//
// ─────────────────────────────────────────────────────────────────────────────
// OneCarbot is a PERSONAL TRACKING app, not a research app.
//
// That distinction is load-bearing. App Store guideline 5.1.3 puts health
// *research* apps behind independent ethics review board approval, with proof
// on demand. We do not have that, so the app must genuinely not be research:
//
//   - It never says a session contributes to PROFILE or to any study.
//   - Sessions written from this app must NOT be analysed as trial data.
//     They are tagged `onecarbot` in each session's `device` field, so they can
//     be excluded. If that ever changes, this app needs real informed consent
//     and ethics approval first — not a copy edit.
//   - It asks for the minimum that makes a personal score meaningful. Age and
//     sex at birth are kept because scores are compared against a reference
//     group. Medical history is not asked at all: it is special-category data
//     with no purpose in a tool that only shows you your own trend, and
//     guideline 5.1.1 says not to require personal information that is not
//     directly relevant to core functionality.
//
// And guideline 1.4.1: nothing here may read as diagnosing, treating or
// predicting anything. 1C-01 is a food supplement, not a medicine.
// ─────────────────────────────────────────────────────────────────────────────

export const TERMS_VERSION = '2026-08-31';

export const CONTACT = 'team@onecarbon.com';
export const PRIVACY_URL = 'https://onecarbon.com/legal/privacy.html';

export const DISCLAIMER =
  'OneCarbot is for your own interest and record-keeping. It is not a medical ' +
  'device and it does not diagnose, treat or predict any condition. Scores move ' +
  'around a lot — sleep, caffeine, time of day and simple practice all affect ' +
  'them — so read a single session lightly. If you are worried about your ' +
  'memory or thinking, talk to a doctor.';

export const DATA_NOTE =
  'We store your email, the few details you give below, and your session ' +
  'results, so your history is there when you sign in again. We do not sell ' +
  'your data or use it for advertising. You can delete your account and ' +
  'everything in it at any time from the dashboard.';
