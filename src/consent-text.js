// Informed consent for the PROFILE study, structured to App Store guideline
// 5.1.3(iii): nature, purpose and duration of the research; procedures, risks
// and benefits; data confidentiality and third-party sharing; contact details;
// and how to withdraw.
//
// REVIEW BEFORE SUBMISSION. This is written to satisfy Apple and to be honest
// with participants, but it is not a substitute for the ethics-approved
// participant information sheet for NCT07457242. Where the two disagree, the
// approved document wins and this file must be corrected to match.
//
// Every claim here must stay inside what the website already says. No medical
// claims — guideline 1.4.1 — and 1C-01 is a food supplement, not a medicine.

export const CONSENT_VERSION = '2026-08-31';

export const TRIAL = {
  name: 'PROFILE',
  registration: 'NCT07457242',
  sponsor: 'Healthspan Biotics Ltd',
  contact: 'team@onecarbon.com',
  privacyUrl: 'https://onecarbon.com/legal/privacy.html',
};

export const SECTIONS = [
  {
    key: 'what',
    title: 'What this is',
    body:
      'OneCarbot is the companion app for PROFILE, a Phase I open-label study run by ' +
      'Healthspan Biotics Ltd and registered as NCT07457242. The study looks at whether ' +
      'supporting one-carbon metabolism has a measurable effect on cognition over time.\n\n' +
      '1C-01 is a food supplement, not a medicine. This app does not diagnose, treat or ' +
      'prevent any condition, and nothing it shows you is a medical result.',
  },
  {
    key: 'procedures',
    title: 'What taking part involves',
    body:
      'Roughly every two weeks you complete a session: a few questions about your sleep ' +
      'and mood, then seven short cognitive tasks. A session takes about 10 minutes.\n\n' +
      'You will be asked some details about yourself once, at the start — age, sex at ' +
      'birth, education and relevant medical history. These let your scores be compared ' +
      'against a sensible reference group rather than the general population.\n\n' +
      'If you choose to, the app can read last night’s sleep duration from Apple Health ' +
      'so you do not have to remember it. This is optional, you are asked each time, and ' +
      'the app only ever reads sleep — it never writes anything to Health.',
  },
  {
    key: 'duration',
    title: 'How long it lasts',
    body:
      'The early-access programme runs for 60 days. You are welcome to keep using the app ' +
      'and tracking your own scores after that, for as long as you find it useful. There ' +
      'is no fixed end date on your account.',
  },
  {
    key: 'risks',
    title: 'Risks and benefits',
    body:
      'The tasks are puzzles on a phone. There is no physical risk. Some people find timed ' +
      'tests mildly frustrating, and you can stop any session at any point.\n\n' +
      'You may find it interesting to watch your own scores over time. We cannot promise ' +
      'you any personal benefit, and a single session score is noisy — sleep, caffeine, ' +
      'time of day and practice all move it. Do not read anything medical into it.\n\n' +
      'The honest benefit is to the research: your sessions help us understand whether ' +
      'the effect we saw in the laboratory shows up in people.',
  },
  {
    key: 'data',
    title: 'Your data, and who sees it',
    body:
      'We store your email address, the details you give at onboarding, your session ' +
      'results, and your answers about sleep and mood. Data is held in Google Firebase ' +
      '(Firestore) under an account only you can sign in to.\n\n' +
      'We do not sell your data. We do not share it with advertisers, and we do not use ' +
      'it for advertising, marketing or data mining. Health data never leaves the study.\n\n' +
      'When we publish or report on PROFILE, results are aggregated across participants. ' +
      'Nothing that identifies you personally is published.',
  },
  {
    key: 'withdraw',
    title: 'Withdrawing',
    body:
      'You can stop at any time, without giving a reason, and without affecting anything ' +
      'else about your participation in PROFILE.\n\n' +
      'To withdraw and delete everything: Dashboard → Delete my account. That removes ' +
      'your sign-in and your entire history — profile, sessions and results — permanently ' +
      'and immediately. It cannot be undone.\n\n' +
      'If you would rather talk to a person first, email ' + TRIAL.contact + '. Data already ' +
      'included in a completed, published analysis cannot be pulled back out of it, but ' +
      'nothing identifying you is in there.',
  },
  {
    key: 'contact',
    title: 'Questions',
    body:
      'Email ' + TRIAL.contact + ' and a member of the team will reply — not a bot.\n\n' +
      'The full privacy policy is at ' + TRIAL.privacyUrl + '.',
  },
];
