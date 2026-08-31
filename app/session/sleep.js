import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth-context';
import { loadUserDoc, loadSessions } from '../../src/store';
import { setSleep, startDraft, getDraft } from '../../src/session';
import { intervalDaysFrom, complianceFields } from '../../src/compliance';
import { importLastNightSleep, isExpoGo } from '../../src/health';
import { Button, Tiles, Panel } from '../../src/ui';
import { colors, space, type } from '../../src/theme';
import { T } from '../../src/i18n';

const HOURS = ['<4', '4–5', '5–6', '6–7', '7–8', '8–9', '>9'];
const QUALITY = ['Very good', 'Good', 'Average', 'Poor', 'Very poor'];
const DAYTIME = ['No drowsiness', 'Some drowsiness', 'Often drowsy'];
const ONSET = ['<15 min', '15–30 min', '30–60 min', '>60 min'];
const TROUBLE = ['Not at all', 'Once or twice', 'Several times', 'Most of the night'];
const WAKE_CAUSES = [
  'Noise',
  'Light',
  'Needed the toilet',
  'Pain or discomfort',
  'Worry',
  'Too hot or cold',
  'No idea',
];
const MOOD = ['Very good', 'Good', 'Neutral', 'Low', 'Very low'];
const STRESS = ['None', 'Mild', 'Moderate', 'High'];

/** Midpoint of a bucket, so a Health import can select the right one. */
function bucketForHours(h) {
  if (h < 4) return '<4';
  if (h < 5) return '4–5';
  if (h < 6) return '5–6';
  if (h < 7) return '6–7';
  if (h < 8) return '7–8';
  if (h < 9) return '8–9';
  return '>9';
}

export default function Sleep() {
  const router = useRouter();
  const { user } = useAuth();
  if (!getDraft()) startDraft();

  const [hours, setHours] = useState(null);
  const [quality, setQuality] = useState(null);
  const [daytime, setDaytime] = useState(null);
  const [onset, setOnset] = useState(null);
  const [mood, setMood] = useState(null);
  const [stress, setStress] = useState(null);
  const [troubleFall, setTroubleFall] = useState(null);
  const [troubleStay, setTroubleStay] = useState(null);
  const [wakeCauses, setWakeCauses] = useState([]);

  // Adherence. Only asked once someone has actually logged a start date —
  // otherwise the question is meaningless.
  const [interval, setInterval_] = useState(null);
  const [daysTaken, setDaysTaken] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [ud, sessions] = await Promise.all([loadUserDoc(user.uid), loadSessions(user.uid, 1)]);
        if (cancelled || !ud?.probioticStart || ud.probioticActive === false) return;
        const last = sessions[0]?.completedAt;
        const lastAt = last ? (last.toDate ? last.toDate() : new Date(last)) : null;
        setInterval_(intervalDaysFrom(lastAt, ud.probioticStart));
      } catch (_) {
        // Not worth blocking a session over — the question is simply not shown.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const compliance = useMemo(
    () => complianceFields(daysTaken, interval),
    [interval, daysTaken]
  );

  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState('');
  const [source, setSource] = useState('self_report');

  const doImport = async () => {
    setImporting(true);
    setImportNote('');
    const res = await importLastNightSleep();
    setImporting(false);

    if (res.ok && res.hours != null) {
      setHours(bucketForHours(res.hours));
      setSource(res.hours != null ? 'health_api' : 'self_report');
      setImportNote(T('sleep.imported', { n: res.hours }));
    } else if (res.ok) {
      setImportNote(T('sleep.import_none'));
    } else if (res.reason === 'expo_go') {
      setImportNote('Health import needs a development build — enter it below for now.');
    } else {
      // Not an error the participant needs to act on — they just type it in.
      setImportNote(
        res.reason === 'unavailable'
          ? 'Health data is not available on this device.'
          : 'Could not read Health data — enter it below.'
      );
    }
  };

  const cont = () => {
    setSleep({
      sleep_hours: hours,
      sleep_source: source,
      quality,
      daytime_sleepiness: daytime,
      onset,
      mood,
      stress,
      trouble_fall: troubleFall,
      trouble_stay: troubleStay,
      wake_causes: wakeCauses,
      // Adherence, derived below rather than asked twice.
      ...compliance,
    });
    router.push('/session/battery');
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={type.h2}>{T('sleep.h1')}</Text>
      <Text style={type.body}>{T('sleep.sub')}</Text>

      <Panel>
        <Text style={type.h3}>{T('sleep.hours')}</Text>
        {isExpoGo ? null : (
          <Button
            title={T('sleep.import')}
            kind="ghost"
            onPress={doImport}
            busy={importing}
            style={styles.importBtn}
          />
        )}
        {importNote ? <Text style={styles.note}>{importNote}</Text> : null}
        <Tiles options={HOURS} value={hours} onChange={(v) => { setHours(v); setSource('self_report'); }} />
      </Panel>

      <Text style={styles.label}>{T('sleep.quality')}</Text>
      <Tiles options={QUALITY} value={quality} onChange={setQuality} />

      <Text style={styles.label}>Daytime sleepiness</Text>
      <Tiles options={DAYTIME} value={daytime} onChange={setDaytime} />

      <Text style={styles.label}>Time to fall asleep</Text>
      <Tiles options={ONSET} value={onset} onChange={setOnset} />

      <Text style={styles.label}>Trouble falling asleep</Text>
      <Tiles options={TROUBLE} value={troubleFall} onChange={setTroubleFall} />

      <Text style={styles.label}>Woke during the night</Text>
      <Tiles options={TROUBLE} value={troubleStay} onChange={setTroubleStay} />

      {troubleStay && troubleStay !== 'Not at all' ? (
        <>
          <Text style={styles.label}>What woke you? (any that apply)</Text>
          <Tiles options={WAKE_CAUSES} value={wakeCauses} onChange={setWakeCauses} multi />
        </>
      ) : null}

      <Text style={styles.label}>Mood today</Text>
      <Tiles options={MOOD} value={mood} onChange={setMood} />

      <Text style={styles.label}>Stress level today</Text>
      <Tiles options={STRESS} value={stress} onChange={setStress} />

      {interval != null ? (
        <Panel title={T('comp.title')} style={styles.compliance}>
          <Text style={type.body}>{T('comp.sub', { n: interval })}</Text>
          <Tiles
            options={Array.from({ length: interval + 1 }, (_, i) => ({
              value: i,
              label: String(i),
            }))}
            value={daysTaken}
            onChange={setDaysTaken}
          />
          {daysTaken != null ? (
            <Text style={styles.note}>
              {daysTaken === interval
                ? T('comp.every_day')
                : daysTaken === 0
                  ? T('comp.none')
                  : T('comp.some', {
                      pct: Math.round((daysTaken / interval) * 100),
                      d: daysTaken,
                      n: interval,
                    })}
            </Text>
          ) : null}
        </Panel>
      ) : null}

      <Button title={T('sleep.continue')} onPress={cont} disabled={!hours} style={styles.cta} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  label: { ...type.small, color: colors.textMuted, fontWeight: '600', marginTop: space.sm },
  importBtn: { alignSelf: 'flex-start', paddingHorizontal: space.lg, minHeight: 44 },
  note: { ...type.small, color: colors.accent },
  compliance: { marginTop: space.md },
  cta: { marginTop: space.lg },
});
