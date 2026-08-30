// Content generators and scoring for the seven tasks, ported from
// js/cognitive-tests.js. Kept free of React so the logic can be tested on its
// own and so the outcome measures stay identical to the web battery:
//
//   cog_rt      mean ms on correct MATCH responses
//   cog_numeric max digit-span reached
//   cog_symbol  correct substitutions in 60s
//   cog_pal     word pairs recalled
//   cog_matrix  matrix patterns solved
//   cog_tmta    ms to complete trail A
//   cog_tmtb    ms to complete trail B
//
// All content is original — none is copied from the UK Biobank instruments.

export const RT_SYMBOLS = ['●', '▲', '■', '◆', '★'];
export const SYMBOL_SET = ['✦', '❍', '✚', '◐', '☂', '⬟'];

export const PAL_WORDS = [
  ['harbour', 'lantern'],
  ['meadow', 'copper'],
  ['thistle', 'window'],
  ['orchard', 'signal'],
  ['granite', 'feather'],
  ['cavern', 'ribbon'],
];

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randInt(n) {
  return Math.floor(Math.random() * n);
}

// ── Reaction time ────────────────────────────────────────────────
export const RT_TRIALS = 10;

export function makeRtTrial(forceMatch) {
  const s1 = RT_SYMBOLS[randInt(RT_SYMBOLS.length)];
  const isMatch = forceMatch !== undefined ? forceMatch : Math.random() < 0.5;
  const s2 = isMatch
    ? s1
    : RT_SYMBOLS[(RT_SYMBOLS.indexOf(s1) + 1 + randInt(RT_SYMBOLS.length - 1)) % RT_SYMBOLS.length];
  return { s1, s2, isMatch };
}

export function scoreRt(trials) {
  const hits = trials.filter((t) => t.isMatch && t.rt != null).map((t) => t.rt);
  if (!hits.length) return null;
  return Math.round(hits.reduce((a, b) => a + b, 0) / hits.length);
}

// ── Numeric memory ───────────────────────────────────────────────
export const NUMERIC_START_LEN = 4;

export function makeDigits(len) {
  let s = '';
  for (let i = 0; i < len; i++) s += String(randInt(10));
  return s;
}

/** Longer strings get longer on screen — same curve as the web version. */
export function numericShowMs(len) {
  return 1200 + len * 350;
}

// ── Symbol–digit substitution ────────────────────────────────────
export const SYMBOL_DURATION_MS = 60000;

export function makeSymbolKey() {
  return shuffle(SYMBOL_SET).map((sym, i) => ({ sym, dig: i + 1 }));
}

// ── Paired associate learning ────────────────────────────────────
export function makePalRound() {
  const pairs = shuffle(PAL_WORDS).slice(0, 6);
  return {
    pairs,
    // Cue on the left word, four options, one correct.
    trials: shuffle(pairs).map((p) => {
      const distractors = shuffle(pairs.filter((q) => q[1] !== p[1]))
        .slice(0, 3)
        .map((q) => q[1]);
      return { cue: p[0], answer: p[1], options: shuffle([p[1], ...distractors]) };
    }),
  };
}

// ── Matrix pattern completion ────────────────────────────────────
// A 3x3 grid where each cell is a shape index. The rule is a per-row rotation,
// so the missing bottom-right cell is deterministic and the distractors are
// plausible neighbours rather than random noise.
export const MATRIX_SHAPES = ['◼', '◻', '▲', '△', '●', '○'];
export const MATRIX_ROUNDS = 8;

export function makeMatrix() {
  const base = randInt(MATRIX_SHAPES.length);
  const step = 1 + randInt(3);
  const grid = [];
  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < 3; c++) {
      row.push((base + r * step + c) % MATRIX_SHAPES.length);
    }
    grid.push(row);
  }
  const answer = grid[2][2];
  grid[2][2] = null;

  const options = shuffle([
    answer,
    (answer + 1) % MATRIX_SHAPES.length,
    (answer + 2) % MATRIX_SHAPES.length,
    (answer + MATRIX_SHAPES.length - 1) % MATRIX_SHAPES.length,
  ]);

  return { grid, answer, options };
}

// ── Trail making ─────────────────────────────────────────────────
export const TRAIL_A_NODES = 12;
export const TRAIL_B_NODES = 12;

/** Non-overlapping node positions in a unit square, jittered on a coarse grid. */
export function makeTrailNodes(count, mode) {
  const cols = 3;
  const rows = Math.ceil(count / cols);
  const cells = shuffle(
    Array.from({ length: cols * rows }, (_, i) => ({ col: i % cols, row: Math.floor(i / cols) }))
  ).slice(0, count);

  const letters = 'ABCDEFGHIJKL';
  return cells.map((cell, i) => {
    let label;
    if (mode === 'B') {
      // 1, A, 2, B, 3, C …
      label = i % 2 === 0 ? String(i / 2 + 1) : letters[(i - 1) / 2];
    } else {
      label = String(i + 1);
    }
    return {
      order: i,
      label,
      x: (cell.col + 0.15 + Math.random() * 0.7) / cols,
      y: (cell.row + 0.15 + Math.random() * 0.7) / rows,
    };
  });
}
