// Score curves copied from app.html's DOMAINS so a composite computed here
// equals one computed on the web for the same session. Do not retune these in
// isolation — it would put a step change in every participant's trend line.
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const DOMAINS = [
  { key: 'cog_rt', label: 'Reaction time', score: (v) => clamp(100 - (v - 200) / 8, 0, 100) },
  { key: 'cog_numeric', label: 'Numeric memory', score: (v) => clamp(v * 10, 0, 100) },
  { key: 'cog_symbol', label: 'Symbol–digit', score: (v) => clamp(v * 5, 0, 100) },
  { key: 'cog_pal', label: 'Word pairs', score: (v) => clamp(v * 12.5, 0, 100) },
  { key: 'cog_matrix', label: 'Pattern puzzles', score: (v) => clamp(v * 20, 0, 100) },
  { key: 'cog_tmta', label: 'Trail making A', score: (v) => clamp(100 - (v - 10000) / 1500, 0, 100) },
  { key: 'cog_tmtb', label: 'Trail making B', score: (v) => clamp(100 - (v - 20000) / 2500, 0, 100) },
];

// A skipped task is stored as '' rather than null (app.html does the same), and
// Number('') is 0 — which would silently read as a genuinely terrible score.
// Anything not finite is treated as absent instead.
function value(results, key) {
  const raw = results?.[key];
  if (raw === '' || raw === null || raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function compositeScore(results) {
  if (!results) return 0;
  const scores = DOMAINS.map((d) => {
    const v = value(results, d.key);
    return v === null ? null : d.score(v);
  }).filter((s) => s !== null);
  if (!scores.length) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function domainScores(results) {
  return DOMAINS.map((d) => {
    const v = value(results, d.key);
    return { key: d.key, label: d.label, score: v === null ? null : Math.round(d.score(v)) };
  });
}
