import { compositeScore, domainScores, sessionsToPoints } from '../src/scoring.js';
import { intervalDaysFrom, complianceFields, MAX_INTERVAL_DAYS } from '../src/compliance.js';
import { makeMatrix, makeTrailNodes, makePalRound, scoreRt, MATRIX_SHAPES } from '../src/battery/tasks.js';

let fail = 0;
const ok = (name, cond) => { console.log((cond ? 'PASS  ' : 'FAIL  ') + name); if (!cond) fail++; };

// ── scoring parity with app.html's curves ──
ok('perfect-ish session scores high',
   Math.round(compositeScore({ cog_rt: 250, cog_numeric: 10, cog_symbol: 20, cog_pal: 8, cog_matrix: 5, cog_tmta: 10000, cog_tmtb: 20000 })) === 99);
ok('empty results -> 0', compositeScore({}) === 0);
ok('skipped task ("") is ignored, not scored 0',
   compositeScore({ cog_numeric: 10, cog_symbol: '' }) === 100);
ok('domainScores marks absent as null',
   domainScores({ cog_numeric: 5 }).find(d => d.key === 'cog_rt').score === null);
ok('rt curve clamps at 0 for very slow',
   domainScores({ cog_rt: 5000 }).find(d => d.key === 'cog_rt').score === 0);

// ── matrix puzzle is actually solvable ──
let matrixOk = true;
for (let i = 0; i < 500; i++) {
  const m = makeMatrix();
  if (m.grid[2][2] !== null) matrixOk = false;
  if (!m.options.includes(m.answer)) matrixOk = false;
  if (new Set(m.options).size !== 4) matrixOk = false;
  if (m.answer < 0 || m.answer >= MATRIX_SHAPES.length) matrixOk = false;
}
ok('matrix: blank cell, answer among 4 distinct options', matrixOk);

// ── trail nodes ──
const a = makeTrailNodes(12, 'A');
ok('trail A labels are 1..12 in order', a.map(n => n.label).join(',') === '1,2,3,4,5,6,7,8,9,10,11,12');
const b = makeTrailNodes(12, 'B');
ok('trail B alternates 1,A,2,B...', b.map(n => n.label).join(',') === '1,A,2,B,3,C,4,D,5,E,6,F');
ok('trail nodes stay inside the unit square', a.every(n => n.x > 0 && n.x < 1 && n.y > 0 && n.y < 1));
ok('trail node positions are distinct', new Set(a.map(n => `${n.x.toFixed(3)},${n.y.toFixed(3)}`)).size === 12);

// ── paired associate ──
let palOk = true;
for (let i = 0; i < 200; i++) {
  const r = makePalRound();
  if (r.trials.length !== 6) palOk = false;
  for (const t of r.trials) {
    if (!t.options.includes(t.answer)) palOk = false;
    if (new Set(t.options).size !== 4) palOk = false;
  }
}
ok('PAL: every trial has the right answer among 4 distinct options', palOk);

// ── reaction time scoring ──
ok('scoreRt averages only correct match trials',
   scoreRt([{ isMatch: true, rt: 300 }, { isMatch: true, rt: 500 }, { isMatch: false, rt: 100 }, { isMatch: true, rt: null }]) === 400);
ok('scoreRt with no hits -> null', scoreRt([{ isMatch: false, rt: 200 }]) === null);

// ── trend chart data shaping ──
const good = { cog_numeric: 8 };            // -> 80
const better = { cog_numeric: 10 };         // -> 100
// loadSessions returns newest-first
const sessions = [
  { results: better, completedAt: new Date('2026-03-01') },
  { results: good,   completedAt: new Date('2026-02-01') },
];
const pts = sessionsToPoints(sessions);
ok('points come back oldest-first', pts.map(p => p.score).join(',') === '80,100');
ok('dates survive as Date objects', pts[0].at instanceof Date && pts[0].at < pts[1].at);
ok('Firestore Timestamp shape is handled',
   sessionsToPoints([{ results: good, completedAt: { toDate: () => new Date('2026-02-01') } }])[0].at instanceof Date);
ok('sessions with no usable score are dropped, not plotted as zero',
   sessionsToPoints([{ results: {}, completedAt: new Date() }, ...sessions]).length === 2);
ok('empty input is safe', sessionsToPoints([]).length === 0 && sessionsToPoints(undefined).length === 0);

// ── compliance ──
const NOW = new Date('2026-08-31T09:00:00Z').getTime();
ok('interval = days since last session',
   intervalDaysFrom(new Date('2026-08-17T09:00:00Z'), '2026-01-01', NOW) === 14);
ok('first session falls back to the 1C-01 start date',
   intervalDaysFrom(null, '2026-08-21', NOW) === 10);
ok('no session and no start date -> 14 day default',
   intervalDaysFrom(null, null, NOW) === 14);
ok('never less than 1 day',
   intervalDaysFrom(new Date('2026-08-31T08:00:00Z'), null, NOW) === 1);
ok(`long gap is capped at ${MAX_INTERVAL_DAYS}, not 180 tiles`,
   intervalDaysFrom(new Date('2026-03-01T09:00:00Z'), null, NOW) === MAX_INTERVAL_DAYS);
ok('unanswered compliance writes nothing, rather than zero',
   Object.keys(complianceFields(null, 14)).length === 0);
ok('zero days is recorded as a real answer',
   complianceFields(0, 14).probiotic_compliance_pct === 0);
ok('percentage is right',
   complianceFields(7, 14).probiotic_compliance_pct === 50);

console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
