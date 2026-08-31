// Passwordless sign-in against the loginCode Cloud Function.
//
// No password to forget and no deep links to misconfigure: the function emails
// a six-digit code, we post it back, and it returns a custom token. That also
// means the code can be read on a different device from the one signing in.
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';

// Same project and region as the other functions (us-central1, see
// `firebase functions:list`).
const BASE = 'https://us-central1-onecarbon-app.cloudfunctions.net';
const ENDPOINT = `${BASE}/loginCode`;
const DELETE_ENDPOINT = `${BASE}/deleteAccount`;

const MESSAGES = {
  bad_email: 'That email address does not look right.',
  bad_code: 'Enter the six digits from the email.',
  invalid_code: 'That code is not right. Check the email and try again.',
  expired: 'That code has expired. Send a new one.',
  too_many_attempts: 'Too many tries. Send a new code.',
};

async function post(payload) {
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (_) {
    throw new Error('No connection. Check your network and try again.');
  }

  let data = {};
  try {
    data = await res.json();
  } catch (_) {
    // Fall through — an empty body on a bad status is still an error.
  }

  if (!res.ok) {
    throw new Error(MESSAGES[data.error] || 'Something went wrong. Try again.');
  }
  return data;
}

/**
 * Ask for a code. Resolves even when the address is rate-limited — the function
 * deliberately returns the same shape either way, so this never reveals whether
 * an account exists or how many codes have been sent.
 */
export async function requestCode(email) {
  await post({ action: 'request', email });
}

/** Exchange a code for a signed-in session. */
export async function verifyCode(email, code) {
  const { token } = await post({ action: 'verify', email, code });
  if (!token) throw new Error('Something went wrong. Try again.');
  await signInWithCustomToken(auth, token);
}

/**
 * Delete the signed-in account and everything under it — App Store guideline
 * 5.1.1(v). Irreversible.
 *
 * The uid is taken from the ID token server-side, never sent in the body, so
 * this can only ever delete the caller's own account.
 */
export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error('You are not signed in.');

  // force-refresh, so a token that expired while the confirmation dialog was
  // open does not turn into a confusing failure.
  const idToken = await user.getIdToken(true);

  let res;
  try {
    res = await fetch(DELETE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: '{}',
    });
  } catch (_) {
    throw new Error('No connection. Check your network and try again.');
  }

  if (!res.ok) {
    throw new Error('Could not delete your account. Try again, or email team@onecarbon.com.');
  }

  // The auth user is gone server-side; clear the local session so the app
  // returns to sign-in rather than sitting on a dead token.
  try {
    await auth.signOut();
  } catch (_) {
    // Already invalid — the gate will bounce to sign-in regardless.
  }
}
