// Firestore access. Every path and field name here mirrors app.html exactly —
// the two clients write into the same users/<uid> tree, so a rename in one
// silently splits a participant's history in two.
//
//   users/<uid>                          email, name, lastSeen, probiotic* fields
//   users/<uid>/profile/data             onboarding answers
//   users/<uid>/sessions/<sessionId>     completedAt, results, sleep, probiotic, device
//
// The probiotic_* field names are deliberate and must NOT be renamed to "live
// cultures" — they are stored data, not outward-facing copy.
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { db } from './firebase';

export async function touchUser(user) {
  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email,
      name: user.displayName || '',
      lastSeen: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function loadProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid, 'profile', 'data'));
  return snap.exists() ? snap.data() : null;
}

export async function saveProfile(uid, email, fields) {
  await setDoc(doc(db, 'users', uid, 'profile', 'data'), {
    ...fields,
    email,
    consent: true,
    createdAt: serverTimestamp(),
  });
}

export async function loadUserDoc(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : {};
}

export async function loadSessions(uid, max = 50) {
  const q = query(
    collection(db, 'users', uid, 'sessions'),
    orderBy('completedAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Mirrors app.html's session write, including the probiotic snapshot. */
export async function saveSession(uid, { results, sleepData }) {
  const sessionId = String(Date.now());

  let probioticSnapshot = {};
  try {
    const ud = await loadUserDoc(uid);
    probioticSnapshot = {
      probiotic_start_date: ud.probioticStart || null,
      probiotic_active: ud.probioticActive ?? null,
      probiotic_stopped_date: ud.probioticStoppedDate || null,
    };
  } catch (_) {
    // A missing snapshot must not cost the participant their session data.
  }

  await setDoc(doc(db, 'users', uid, 'sessions', sessionId), {
    completedAt: serverTimestamp(),
    results,
    sleep: {
      hours: sleepData.sleep_hours ?? null,
      quality: sleepData.quality ?? null,
      daytime_sleepiness: sleepData.daytime_sleepiness ?? null,
      trouble_fall: sleepData.trouble_fall ?? null,
      trouble_stay: sleepData.trouble_stay ?? null,
      onset: sleepData.onset ?? null,
      wake_causes: sleepData.wake_causes ?? [],
      mood: sleepData.mood ?? null,
      stress: sleepData.stress ?? null,
      // Set when the figure came from HealthKit / Health Connect rather than
      // the slider, so analysis can tell self-report from device data.
      source: sleepData.sleep_source ?? 'self_report',
    },
    probiotic: {
      ...probioticSnapshot,
      compliance_days: sleepData.probiotic_compliance_days ?? null,
      compliance_interval: sleepData.probiotic_compliance_interval ?? null,
      compliance_pct: sleepData.probiotic_compliance_pct ?? null,
    },
    device: `${Platform.OS} ${Platform.Version} · ${Device.modelName || 'unknown'} · onecarbon-app`,
  });

  return sessionId;
}

/** Start / stop dates for 1C-01. Field names match app.html — do not rename. */
export async function setProbioticStart(uid, isoDate) {
  await setDoc(
    doc(db, 'users', uid),
    { probioticStart: isoDate, probioticActive: true },
    { merge: true }
  );
}

export async function setProbioticStopped(uid, isoDate) {
  await setDoc(
    doc(db, 'users', uid),
    { probioticStoppedDate: isoDate, probioticActive: false },
    { merge: true }
  );
}

/** Push token, so the day-14 reminder can go to the device as well as email. */
export async function savePushToken(uid, token) {
  await setDoc(
    doc(db, 'users', uid),
    { expoPushToken: token, pushUpdatedAt: serverTimestamp() },
    { merge: true }
  );
}
