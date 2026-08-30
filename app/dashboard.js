import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../src/firebase';
import { useAuth } from '../src/auth-context';
import { loadSessions, loadUserDoc, setProbioticStart } from '../src/store';
import { compositeScore, domainScores } from '../src/scoring';
import { startDraft } from '../src/session';
import { Button, Panel } from '../src/ui';
import { colors, space, type } from '../src/theme';
import { T } from '../src/i18n';

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [userDoc, setUserDoc] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [s, u] = await Promise.all([loadSessions(user.uid), loadUserDoc(user.uid)]);
      setSessions(s);
      setUserDoc(u);
    } catch (e) {
      Alert.alert('Could not load your sessions', e?.message || '');
    } finally {
      setLoaded(true);
    }
  }, [user]);

  // Reload on focus so a just-finished session shows without a manual pull.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // loadSessions returns newest first.
  const latest = sessions[0];
  const previous = sessions[1];
  const composite = latest ? Math.round(compositeScore(latest.results || {})) : null;
  const prevComposite = previous ? Math.round(compositeScore(previous.results || {})) : null;
  const delta = composite != null && prevComposite != null ? composite - prevComposite : null;

  const begin = () => {
    startDraft();
    router.push('/session/sleep');
  };

  const logProbiotic = async () => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await setProbioticStart(user.uid, today);
      setUserDoc((d) => ({ ...d, probioticStart: today, probioticActive: true }));
    } catch (e) {
      Alert.alert('Could not save', e?.message || '');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.wrap}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={colors.accent}
        />
      }
    >
      <View style={styles.scoreBlock}>
        <Text style={styles.score}>{composite ?? '—'}</Text>
        <Text style={type.small}>{T('results.composite_label')}</Text>
        {delta != null ? (
          <Text style={[styles.delta, delta < 0 && styles.deltaDown]}>
            {delta > 0
              ? T('results.delta_up', { n: delta })
              : delta < 0
                ? T('results.delta_down', { n: Math.abs(delta) })
                : T('results.delta_same')}
          </Text>
        ) : null}
      </View>

      <Button title={T('dash.new_session')} onPress={begin} />

      <Panel title={T('domain.panel_title')}>
        {latest ? (
          domainScores(latest.results || {}).map((d) => (
            <View key={d.key} style={styles.domainRow}>
              <Text style={styles.domainLabel}>{d.label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${d.score ?? 0}%` }]} />
              </View>
              <Text style={styles.domainScore}>{d.score ?? '—'}</Text>
            </View>
          ))
        ) : (
          <Text style={type.body}>{loaded ? T('dash.never') : 'Loading…'}</Text>
        )}
      </Panel>

      <Panel title={T('prob.panel_title')}>
        {userDoc.probioticStart ? (
          <Text style={type.body}>{T('prob.active', { d: userDoc.probioticStart })}</Text>
        ) : (
          <>
            <Text style={type.body}>{T('prob.prompt')}</Text>
            <Button title={T('prob.log_btn')} kind="ghost" onPress={logProbiotic} />
          </>
        )}
      </Panel>

      <Panel title={T('dash.sessions')}>
        <Text style={styles.bigNum}>{sessions.length}</Text>
        <Text style={type.small}>
          {T('dash.last')}: {latest ? fmtDate(latest.completedAt) : T('dash.never')}
        </Text>
      </Panel>

      <Pressable onPress={() => signOut(auth)}>
        <Text style={styles.signout}>{T('nav.signout')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  scoreBlock: { alignItems: 'center', paddingVertical: space.lg },
  score: { fontSize: 64, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  delta: { ...type.small, color: colors.good, marginTop: space.xs },
  deltaDown: { color: colors.danger },
  domainRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  domainLabel: { ...type.small, color: colors.textMuted, width: 108 },
  barTrack: { flex: 1, height: 6, backgroundColor: colors.bgAlt, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: colors.accent },
  domainScore: { ...type.small, color: colors.text, width: 28, textAlign: 'right', fontVariant: ['tabular-nums'] },
  bigNum: { fontSize: 32, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  signout: { ...type.small, color: colors.accent, textAlign: 'center', marginTop: space.lg },
});
