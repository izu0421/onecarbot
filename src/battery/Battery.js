// The seven-task battery. Sequencing mirrors js/cognitive-tests.js: tasks are
// shuffled per session, each shows instructions and an explicit Start button
// (no auto-countdown), and each writes four keys into the results map —
//   cog_<field>, cog_<field>_start, cog_<field>_duration_ms, cog_<field>_raw
// — so sessions from this app and from app.html stay directly comparable.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { colors, space, radius, type } from '../theme';
import { T } from '../i18n';
import {
  shuffle,
  randInt,
  RT_TRIALS,
  makeRtTrial,
  scoreRt,
  NUMERIC_START_LEN,
  makeDigits,
  numericShowMs,
  SYMBOL_DURATION_MS,
  makeSymbolKey,
  makePalRound,
  MATRIX_SHAPES,
  MATRIX_ROUNDS,
  makeMatrix,
  TRAIL_A_NODES,
  TRAIL_B_NODES,
  makeTrailNodes,
} from './tasks';

// Monotonic where available. Date.now() can jump if the clock is corrected
// mid-task, which on a reaction-time measure is the difference between 380ms
// and nonsense.
const now = () =>
  global.performance && typeof global.performance.now === 'function'
    ? global.performance.now()
    : Date.now();

/** Timestamp the frame a stimulus actually reaches the screen, not the setState. */
function useStimulusClock() {
  const shownAt = useRef(0);
  const mark = useCallback(() => {
    requestAnimationFrame(() => {
      shownAt.current = now();
    });
  }, []);
  return [shownAt, mark];
}

function Btn({ title, onPress, disabled, kind = 'primary', style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        kind === 'ghost' && styles.btnGhost,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
        style,
      ]}
    >
      <Text style={[styles.btnText, kind === 'ghost' && styles.btnGhostText]}>{title}</Text>
    </Pressable>
  );
}

// ── 1. Reaction time ─────────────────────────────────────────────
function ReactionTime({ onDone }) {
  const [trialNo, setTrialNo] = useState(0);
  const [cards, setCards] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [shownAt, markShown] = useStimulusClock();
  const trials = useRef([]);
  const awaiting = useRef(false);
  const timer = useRef(null);

  const finish = useCallback(() => {
    onDone(scoreRt(trials.current), { trials: trials.current });
  }, [onDone]);

  const nextTrial = useCallback(
    (n) => {
      if (n >= RT_TRIALS) {
        finish();
        return;
      }
      setFeedback('');
      setCards(null);
      timer.current = setTimeout(() => {
        const t = makeRtTrial();
        setCards(t);
        markShown();
        awaiting.current = true;
        // Non-response counts as a miss after 3s and moves on by itself.
        timer.current = setTimeout(() => {
          if (!awaiting.current) return;
          awaiting.current = false;
          trials.current.push({ ...t, rt: null, responded: false });
          setFeedback(t.isMatch ? 'Missed' : '');
          setTrialNo((x) => x + 1);
        }, 3000);
      }, 600 + randInt(600));
    },
    [finish, markShown]
  );

  useEffect(() => {
    nextTrial(trialNo);
    return () => clearTimeout(timer.current);
  }, [trialNo, nextTrial]);

  const press = () => {
    if (!awaiting.current || !cards) return;
    awaiting.current = false;
    clearTimeout(timer.current);
    const rt = Math.round(now() - shownAt.current);
    trials.current.push({ ...cards, rt, responded: true });
    setFeedback(cards.isMatch ? `${rt} ms` : 'Not a match');
    setTrialNo((x) => x + 1);
  };

  return (
    <View style={styles.stage}>
      <Text style={styles.prompt}>
        Press <Text style={styles.strong}>MATCH</Text> only when the two cards are identical.
      </Text>
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardSym}>{cards?.s1 ?? ''}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardSym}>{cards?.s2 ?? ''}</Text>
        </View>
      </View>
      <Text style={styles.feedback}>{feedback}</Text>
      <Btn title="MATCH" onPress={press} />
      <Text style={styles.counter}>
        {Math.min(trialNo + 1, RT_TRIALS)} / {RT_TRIALS}
      </Text>
    </View>
  );
}

// ── 2. Numeric memory ────────────────────────────────────────────
function NumericMemory({ onDone }) {
  const [len, setLen] = useState(NUMERIC_START_LEN);
  const [phase, setPhase] = useState('show'); // show | recall
  const [digits, setDigits] = useState(() => makeDigits(NUMERIC_START_LEN));
  const [entry, setEntry] = useState('');
  const attempts = useRef([]);
  const maxCorrect = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    if (phase !== 'show') return;
    timer.current = setTimeout(() => setPhase('recall'), numericShowMs(len));
    return () => clearTimeout(timer.current);
  }, [phase, len, digits]);

  const submit = () => {
    const val = (entry || '').replace(/\D/g, '');
    const correct = val === digits;
    attempts.current.push({ len, shown: digits, entered: val, correct });
    if (correct) {
      maxCorrect.current = Math.max(maxCorrect.current, len);
      const next = len + 1;
      setLen(next);
      setDigits(makeDigits(next));
      setEntry('');
      setPhase('show');
    } else {
      onDone(maxCorrect.current || null, { attempts: attempts.current });
    }
  };

  return (
    <View style={styles.stage}>
      {phase === 'show' ? (
        <>
          <Text style={styles.prompt}>Remember this number.</Text>
          <Text style={styles.bigDigits}>{digits}</Text>
        </>
      ) : (
        <>
          <Text style={styles.prompt}>Type the number you just saw.</Text>
          <TextInput
            style={styles.input}
            value={entry}
            onChangeText={setEntry}
            keyboardType="number-pad"
            autoFocus
            maxLength={16}
            onSubmitEditing={submit}
          />
          <Btn title="Enter" onPress={submit} disabled={!entry} />
        </>
      )}
      <Text style={styles.counter}>{len} digits</Text>
    </View>
  );
}

// ── 3. Symbol–digit substitution ─────────────────────────────────
function SymbolDigit({ onDone }) {
  const key = useMemo(() => makeSymbolKey(), []);
  const [target, setTarget] = useState(() => key[randInt(key.length)]);
  const [remaining, setRemaining] = useState(Math.round(SYMBOL_DURATION_MS / 1000));
  const correct = useRef(0);
  const answers = useRef([]);
  const [shownAt, markShown] = useStimulusClock();
  const endAt = useRef(now() + SYMBOL_DURATION_MS);

  useEffect(() => {
    markShown();
    const iv = setInterval(() => {
      const left = Math.max(0, Math.round((endAt.current - now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(iv);
        onDone(correct.current, { answers: answers.current, key });
      }
    }, 200);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answer = (dig) => {
    const isRight = dig === target.dig;
    if (isRight) correct.current += 1;
    answers.current.push({
      sym: target.sym,
      expected: target.dig,
      given: dig,
      correct: isRight,
      rt: Math.round(now() - shownAt.current),
    });
    setTarget(key[randInt(key.length)]);
    markShown();
  };

  return (
    <View style={styles.stage}>
      <View style={styles.keyRow}>
        {key.map((k) => (
          <View key={k.sym} style={styles.keyCell}>
            <Text style={styles.keySym}>{k.sym}</Text>
            <Text style={styles.keyDig}>{k.dig}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.prompt}>Which digit goes with this symbol?</Text>
      <Text style={styles.targetSym}>{target.sym}</Text>
      <View style={styles.digitRow}>
        {key.map((k) => (
          <Pressable key={k.dig} style={styles.digitBtn} onPress={() => answer(k.dig)}>
            <Text style={styles.digitText}>{k.dig}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.counter}>{remaining}s</Text>
    </View>
  );
}

// ── 4. Paired associate learning ─────────────────────────────────
function PairedAssociate({ onDone }) {
  const round = useMemo(() => makePalRound(), []);
  const [phase, setPhase] = useState('learn');
  const [idx, setIdx] = useState(0);
  const correct = useRef(0);
  const answers = useRef([]);
  const [shownAt, markShown] = useStimulusClock();

  useEffect(() => {
    if (phase !== 'learn') return;
    const iv = setTimeout(() => {
      if (idx + 1 >= round.pairs.length) {
        setPhase('recall');
        setIdx(0);
        markShown();
      } else {
        setIdx((i) => i + 1);
      }
    }, 2500);
    return () => clearTimeout(iv);
  }, [phase, idx, round.pairs.length, markShown]);

  const choose = (opt) => {
    const trial = round.trials[idx];
    const isRight = opt === trial.answer;
    if (isRight) correct.current += 1;
    answers.current.push({
      cue: trial.cue,
      expected: trial.answer,
      given: opt,
      correct: isRight,
      rt: Math.round(now() - shownAt.current),
    });
    if (idx + 1 >= round.trials.length) {
      onDone(correct.current, { answers: answers.current });
    } else {
      setIdx((i) => i + 1);
      markShown();
    }
  };

  if (phase === 'learn') {
    const pair = round.pairs[idx];
    return (
      <View style={styles.stage}>
        <Text style={styles.prompt}>Remember these pairs.</Text>
        <Text style={styles.pairWord}>{pair[0]}</Text>
        <Text style={styles.pairJoin}>—</Text>
        <Text style={styles.pairWord}>{pair[1]}</Text>
        <Text style={styles.counter}>
          {idx + 1} / {round.pairs.length}
        </Text>
      </View>
    );
  }

  const trial = round.trials[idx];
  return (
    <View style={styles.stage}>
      <Text style={styles.prompt}>Which word went with this one?</Text>
      <Text style={styles.pairWord}>{trial.cue}</Text>
      <View style={styles.optionCol}>
        {trial.options.map((o) => (
          <Pressable key={o} style={styles.option} onPress={() => choose(o)}>
            <Text style={styles.optionText}>{o}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.counter}>
        {idx + 1} / {round.trials.length}
      </Text>
    </View>
  );
}

// ── 5. Matrix pattern completion ─────────────────────────────────
function Matrices({ onDone }) {
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState(() => makeMatrix());
  const correct = useRef(0);
  const answers = useRef([]);
  const [shownAt, markShown] = useStimulusClock();

  useEffect(markShown, [round, markShown]);

  const choose = (opt) => {
    const isRight = opt === puzzle.answer;
    if (isRight) correct.current += 1;
    answers.current.push({
      expected: puzzle.answer,
      given: opt,
      correct: isRight,
      rt: Math.round(now() - shownAt.current),
    });
    if (round + 1 >= MATRIX_ROUNDS) {
      onDone(correct.current, { answers: answers.current });
    } else {
      setRound((r) => r + 1);
      setPuzzle(makeMatrix());
    }
  };

  return (
    <View style={styles.stage}>
      <Text style={styles.prompt}>Which shape completes the pattern?</Text>
      <View style={styles.matrix}>
        {puzzle.grid.map((row, r) => (
          <View key={r} style={styles.matrixRow}>
            {row.map((cell, c) => (
              <View key={c} style={styles.matrixCell}>
                <Text style={styles.matrixSym}>{cell == null ? '?' : MATRIX_SHAPES[cell]}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
      <View style={styles.digitRow}>
        {puzzle.options.map((o) => (
          <Pressable key={o} style={styles.digitBtn} onPress={() => choose(o)}>
            <Text style={styles.digitText}>{MATRIX_SHAPES[o]}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.counter}>
        {round + 1} / {MATRIX_ROUNDS}
      </Text>
    </View>
  );
}

// ── 6 & 7. Trail making A / B ────────────────────────────────────
function TrailMaking({ mode, onDone }) {
  const count = mode === 'B' ? TRAIL_B_NODES : TRAIL_A_NODES;
  const nodes = useMemo(() => makeTrailNodes(count, mode), [count, mode]);
  const [next, setNext] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [errors, setErrors] = useState(0);
  const startedAt = useRef(now());
  const taps = useRef([]);

  const tap = (node) => {
    const t = Math.round(now() - startedAt.current);
    const right = node.order === next;
    taps.current.push({ label: node.label, correct: right, t });
    if (!right) {
      setErrors((e) => e + 1);
      return;
    }
    if (node.order + 1 >= nodes.length) {
      onDone(t, { taps: taps.current, errors, mode });
    } else {
      setNext((n) => n + 1);
    }
  };

  return (
    <View style={styles.stage}>
      <Text style={styles.prompt}>
        {mode === 'B'
          ? 'Tap in order, alternating numbers and letters: 1 → A → 2 → B …'
          : 'Tap the numbers in order, as fast as you can.'}
      </Text>
      <View
        style={styles.trailBoard}
        onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {box.w > 0 &&
          nodes.map((n) => {
            const done = n.order < next;
            return (
              <Pressable
                key={n.label}
                onPress={() => tap(n)}
                style={[
                  styles.trailNode,
                  done && styles.trailNodeDone,
                  n.order === next && styles.trailNodeNext,
                  { left: n.x * box.w - 24, top: n.y * box.h - 24 },
                ]}
              >
                <Text style={[styles.trailLabel, done && styles.trailLabelDone]}>{n.label}</Text>
              </Pressable>
            );
          })}
      </View>
      <Text style={styles.counter}>
        Next: {nodes[next]?.label ?? '—'}
        {errors > 0 ? `  ·  ${errors} wrong` : ''}
      </Text>
    </View>
  );
}

// ── Registry ─────────────────────────────────────────────────────
const BATTERY = [
  {
    field: 'cog_rt',
    name: 'Reaction time',
    instructions:
      'Two cards appear. Press MATCH only when they show the same symbol. Be quick, but do not guess.',
    Component: ReactionTime,
  },
  {
    field: 'cog_numeric',
    name: 'Numeric memory',
    instructions:
      'A number appears for a moment, then you type it back. It gets one digit longer each time you are right.',
    Component: NumericMemory,
  },
  {
    field: 'cog_symbol',
    name: 'Symbol–digit',
    instructions:
      'The key at the top pairs each symbol with a digit. Match as many as you can in 60 seconds.',
    Component: SymbolDigit,
  },
  {
    field: 'cog_pal',
    name: 'Word pairs',
    instructions:
      'You will see six pairs of words. Afterwards you pick the word that went with each one.',
    Component: PairedAssociate,
  },
  {
    field: 'cog_matrix',
    name: 'Pattern puzzles',
    instructions: 'Each grid follows a rule. Choose the shape that completes it.',
    Component: Matrices,
  },
  {
    field: 'cog_tmta',
    name: 'Trail making A',
    instructions: 'Tap the numbers 1 to 12 in order, as fast as you can.',
    Component: (p) => <TrailMaking mode="A" {...p} />,
  },
  {
    field: 'cog_tmtb',
    name: 'Trail making B',
    instructions: 'Tap alternating numbers and letters in order: 1 → A → 2 → B, as fast as you can.',
    Component: (p) => <TrailMaking mode="B" {...p} />,
  },
];

export const BATTERY_FIELDS = BATTERY.map((t) => t.field);

/**
 * Runs the whole battery and calls onComplete(results) with the flat map the
 * web app produces.
 */
export default function Battery({ onComplete, onProgress }) {
  const order = useMemo(() => shuffle(BATTERY), []);
  const [i, setI] = useState(0);
  const [running, setRunning] = useState(false);
  const results = useRef({});
  const taskStartedAt = useRef(null);
  const taskStartMs = useRef(0);

  const task = order[i];

  useEffect(() => {
    onProgress?.(i, order.length);
  }, [i, order.length, onProgress]);

  const begin = () => {
    taskStartedAt.current = new Date().toISOString();
    taskStartMs.current = now();
    setRunning(true);
  };

  const handleDone = useCallback(
    (value, raw) => {
      const f = task.field;
      results.current[f] = value === null || value === undefined ? '' : value;
      results.current[`${f}_start`] = taskStartedAt.current;
      results.current[`${f}_duration_ms`] = Math.round(now() - taskStartMs.current);
      if (raw) results.current[`${f}_raw`] = JSON.stringify(raw);

      if (i + 1 >= order.length) {
        onComplete(results.current);
      } else {
        setRunning(false);
        setI((x) => x + 1);
      }
    },
    [i, order.length, onComplete, task]
  );

  if (!task) return null;

  if (!running) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.progress}>
          {T('battery.task_of', { n: i + 1, total: order.length })}
        </Text>
        <Text style={styles.taskName}>{task.name}</Text>
        <Text style={styles.instructions}>{task.instructions}</Text>
        <Btn title={T('battery.start')} onPress={begin} />
      </View>
    );
  }

  const Comp = task.Component;
  return (
    <View style={styles.wrap}>
      <Text style={styles.progress}>{task.name}</Text>
      <Comp key={task.field} onDone={handleDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: space.lg },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  progress: { ...type.small, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: space.sm },
  taskName: { ...type.h2, marginBottom: space.sm },
  instructions: { ...type.body, marginBottom: space.lg },
  prompt: { ...type.body, textAlign: 'center', color: colors.text },
  strong: { fontWeight: '700', color: colors.text },
  counter: { ...type.small, marginTop: space.md },
  feedback: { ...type.small, height: 20, color: colors.accent },

  cardRow: { flexDirection: 'row', gap: space.lg },
  card: {
    width: 96,
    height: 128,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSym: { fontSize: 48, color: colors.accent },

  bigDigits: { fontSize: 44, letterSpacing: 6, color: colors.text, fontVariant: ['tabular-nums'] },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 28,
    letterSpacing: 4,
    minWidth: 220,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },

  keyRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  keyCell: {
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    minWidth: 44,
  },
  keySym: { fontSize: 20, color: colors.text },
  keyDig: { ...type.small, color: colors.accent, fontWeight: '700' },
  targetSym: { fontSize: 64, color: colors.accent },
  digitRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  digitBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
  },
  digitText: { fontSize: 22, color: colors.accent, fontWeight: '600' },

  pairWord: { fontSize: 28, color: colors.text, fontWeight: '600' },
  pairJoin: { ...type.small },
  optionCol: { gap: space.sm, alignSelf: 'stretch' },
  option: {
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  optionText: { fontSize: 18, color: colors.text },

  matrix: { gap: 4 },
  matrixRow: { flexDirection: 'row', gap: 4 },
  matrixCell: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matrixSym: { fontSize: 28, color: colors.text },

  trailBoard: {
    alignSelf: 'stretch',
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    position: 'relative',
    minHeight: 360,
  },
  trailNode: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trailNodeNext: { borderColor: colors.accent, borderWidth: 2 },
  trailNodeDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  trailLabel: { fontSize: 17, fontWeight: '600', color: colors.text },
  trailLabelDone: { color: '#fff' },

  btn: {
    backgroundColor: colors.accent,
    paddingVertical: 15,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  btnPressed: { backgroundColor: colors.accentDark },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.accent },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnGhostText: { color: colors.accent },
});
