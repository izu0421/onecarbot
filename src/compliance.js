// Adherence question maths, kept pure so it can be tested without a simulator.
//
// Mirrors app.html: the question covers the days since the last session, or —
// for a first session — since the 1C-01 start date was logged.

// app.html has no cap, so someone returning after six months is asked to pick
// from 180 tiles. "How many of the last 180 days" is also not a question anyone
// can answer honestly, so it is capped here.
export const MAX_INTERVAL_DAYS = 30;
export const DEFAULT_INTERVAL_DAYS = 14;

const DAY_MS = 86400000;

/**
 * @param {Date|null} lastSessionAt
 * @param {string|null} probioticStart  ISO date, e.g. '2026-08-01'
 * @param {number} now                  injectable for tests
 */
export function intervalDaysFrom(lastSessionAt, probioticStart, now = Date.now()) {
  const daysSince = (t) => Math.max(1, Math.round((now - t) / DAY_MS));

  if (lastSessionAt) return Math.min(MAX_INTERVAL_DAYS, daysSince(lastSessionAt.getTime()));

  if (probioticStart) {
    // Midday avoids a timezone shift flipping the day count by one.
    const t = new Date(`${probioticStart}T12:00:00`).getTime();
    if (Number.isFinite(t)) return Math.min(MAX_INTERVAL_DAYS, daysSince(t));
  }

  return DEFAULT_INTERVAL_DAYS;
}

/** null when the question was not answered — not zero, which means "took none". */
export function complianceFields(daysTaken, interval) {
  if (interval == null || daysTaken == null) return {};
  return {
    probiotic_compliance_days: daysTaken,
    probiotic_compliance_interval: interval,
    probiotic_compliance_pct: Math.round((daysTaken / interval) * 100),
  };
}
