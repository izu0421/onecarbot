import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth-context';
import { getDraft, clearDraft } from '../../src/session';
import { saveSession, loadSessions } from '../../src/store';
import { compositeScore, domainScores } from '../../src/scoring';
import { scheduleSessionReminder } from '../../src/notifications';
import { Button, Panel } from '../../src/ui';
import { colors, space, type } from '../../src/theme';
import { T } from '../../src/i18n';

export default function Results() {
  const { user } = useAuth();
  const router = useRouter();
  const draft = getDraft();
  const results = draft?.results || {};

  const [busy, setBusy] = useState(false);
  const [prevComposite, setPrevComposite] = useState(null);

  const composite = useMemo(() => Math.round(compositeScore(results)), [results]);
  const domains = useMemo(() => domainScores(results), [results]);

  useEffect(() => {
    // Read the previous best-known session before this one is written, so the
    // delta compares against the right baseline.
    if (!user) return;
    loadSessions(user.uid, 1)
      .then((s) => {
        if (s.length) setPrevComposite(Math.round(compositeScore(s[0].results || {})));
      })
      .catch(() => {});
  }, [user]);

  const delta = prevComposite != null ? composite - prevComposite : null;

  const save = async () => {
    setBusy(true);
    try {
      await saveSession(user.uid, { results, sleepData: draft?.sleepData || {} });
      // Re-arm the 14-day nudge from the moment they actually finished.
      scheduleSessionReminder().catch(() => {});
      clearDraft();
      router.replace('/dashboard');
    } catch (e) {
      setBusy(false);
      Alert.alert('Could not save this session', e?.message || 'Try again in a moment.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.eyebrow}>{T('results.eyebrow')}</Text>

      <View style={styles.scoreBlock}>
        <Text style={styles.score}>{composite}</Text>
        <Text style={type.small}>{T('results.composite_label')}</Text>
        <Text style={[styles.delta, delta != null && delta < 0 && styles.deltaDown]}>
          {delta == null
            ? T('results.first')
            : delta > 0
              ? T('results.delta_up', { n: delta })
              : delta < 0
                ? T('results.delta_down', { n: Math.abs(delta) })
                : T('results.delta_same')}
        </Text>
      </View>

      <Panel title={T('domain.panel_title')}>
        {domains.map((d) => (
          <View key={d.key} style={styles.domainRow}>
            <Text style={styles.domainLabel}>{d.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${d.score ?? 0}%` }]} />
            </View>
            <Text style={styles.domainScore}>{d.score ?? '—'}</Text>
          </View>
        ))}
      </Panel>

      <Button
        title={busy ? T('results.saving') : T('results.save')}
        onPress={save}
        busy={busy}
        style={styles.cta}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  eyebrow: {
    ...type.small,
    color: colors.good,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  scoreBlock: { alignItems: 'center', paddingVertical: space.lg },
  score: { fontSize: 64, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  delta: { ...type.small, color: colors.good, marginTop: space.xs },
  deltaDown: { color: colors.danger },
  domainRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  domainLabel: { ...type.small, color: colors.textMuted, width: 108 },
  barTrack: { flex: 1, height: 6, backgroundColor: colors.bgAlt, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: colors.accent },
  domainScore: { ...type.small, color: colors.text, width: 28, textAlign: 'right', fontVariant: ['tabular-nums'] },
  cta: { marginTop: space.lg },
});
