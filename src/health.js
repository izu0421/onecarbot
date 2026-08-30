// Sleep import from HealthKit (iOS) and Health Connect (Android).
//
// This is one of the two things the app can do that onecarbon.com cannot, and
// it is also what answers Apple's minimum-functionality bar (guideline 4.2) —
// without it this app is a repackaged website.
//
// Neither module works in Expo Go; both need a development build.
// Everything here fails soft: if Health is unavailable or permission is denied,
// the participant still types their hours into the slider.
import { Platform } from 'react-native';

const MS_PER_HOUR = 3600000;

function lastNightWindow(now = new Date()) {
  // 18:00 the previous day → noon today. Wide enough for shift workers and
  // afternoon naps are excluded by the noon cutoff.
  const end = new Date(now);
  end.setHours(12, 0, 0, 0);
  if (now < end) end.setTime(now.getTime());
  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  start.setHours(18, 0, 0, 0);
  return { start, end };
}

/**
 * Total asleep hours, rounded to 1dp, or null if nothing usable.
 *
 * Intervals are merged before summing. Two sources writing to Health — an Apple
 * Watch and a sleep-tracking app, say — produce overlapping samples for the same
 * night, and naively summing durations reports ten hours for a six-hour sleep.
 */
function summarise(samples) {
  if (!samples?.length) return null;

  const sorted = samples
    .filter((s) => Number.isFinite(s.startMs) && Number.isFinite(s.endMs) && s.endMs > s.startMs)
    .sort((a, b) => a.startMs - b.startMs);
  if (!sorted.length) return null;

  let ms = 0;
  let [cur] = sorted;
  let curStart = cur.startMs;
  let curEnd = cur.endMs;

  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i];
    if (s.startMs <= curEnd) {
      curEnd = Math.max(curEnd, s.endMs);
    } else {
      ms += curEnd - curStart;
      curStart = s.startMs;
      curEnd = s.endMs;
    }
  }
  ms += curEnd - curStart;

  if (ms <= 0) return null;
  return Math.round((ms / MS_PER_HOUR) * 10) / 10;
}

async function readIos() {
  const HK = await import('@kingstinct/react-native-healthkit');

  if (!HK.isHealthDataAvailable()) return { ok: false, reason: 'unavailable' };

  const type = 'HKCategoryTypeIdentifierSleepAnalysis';
  // v14 takes a single AuthDataTypes object. We only ever read.
  const granted = await HK.requestAuthorization({ toRead: [type] });
  if (!granted) return { ok: false, reason: 'denied' };

  const { start, end } = lastNightWindow();
  // limit <= 0 means "all samples" in this API — omitting it is a type error.
  const raw = await HK.queryCategorySamples(type, {
    filter: { startDate: start, endDate: end },
    limit: 0,
    ascending: true,
  });

  // CategoryValueSleepAnalysis: 0 inBed, 1 asleepUnspecified, 2 awake,
  // 3 asleepCore, 4 asleepDeep, 5 asleepREM. Only the asleep values count —
  // inBed overlaps them and would double-count, and on older watchOS data
  // inBed alone badly overstates sleep.
  const ASLEEP = new Set([1, 3, 4, 5]);
  const samples = (raw || [])
    .filter((s) => ASLEEP.has(s.value))
    .map((s) => ({
      startMs: new Date(s.startDate).getTime(),
      endMs: new Date(s.endDate).getTime(),
    }));

  return { ok: true, hours: summarise(samples), sampleCount: samples.length };
}

async function readAndroid() {
  const HC = await import('react-native-health-connect');

  const status = await HC.getSdkStatus();
  if (status !== HC.SdkAvailabilityStatus.SDK_AVAILABLE) {
    return { ok: false, reason: 'unavailable' };
  }
  await HC.initialize();

  const granted = await HC.requestPermission([{ accessType: 'read', recordType: 'SleepSession' }]);
  if (!granted?.length) return { ok: false, reason: 'denied' };

  const { start, end } = lastNightWindow();
  const res = await HC.readRecords('SleepSession', {
    timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() },
  });

  const records = res?.records ?? res ?? [];
  const samples = records.map((r) => ({
    startMs: new Date(r.startTime).getTime(),
    endMs: new Date(r.endTime).getTime(),
  }));

  return { ok: true, hours: summarise(samples), sampleCount: samples.length };
}

/**
 * @returns {Promise<{ok:boolean, hours?:number|null, reason?:string}>}
 * Never throws — the caller falls back to self-report.
 */
export async function importLastNightSleep() {
  try {
    if (Platform.OS === 'ios') return await readIos();
    if (Platform.OS === 'android') return await readAndroid();
    return { ok: false, reason: 'unsupported_platform' };
  } catch (e) {
    return { ok: false, reason: e?.message || 'error' };
  }
}
