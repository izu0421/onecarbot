// One in-progress session, shared between the sleep, battery and results
// screens. A module-level store rather than context because the session flow is
// linear and the battery must not re-render when unrelated state changes —
// a re-render mid-task would restart a timer and corrupt the measurement.
let draft = null;

export function startDraft() {
  draft = { sleepData: {}, results: null, startedAt: new Date().toISOString() };
  return draft;
}

export function getDraft() {
  return draft;
}

export function setSleep(sleepData) {
  if (!draft) startDraft();
  draft.sleepData = { ...draft.sleepData, ...sleepData };
}

export function setResults(results) {
  if (!draft) startDraft();
  draft.results = results;
}

export function clearDraft() {
  draft = null;
}
