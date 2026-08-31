import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/auth-context';
import { saveProfile, loadProfile } from '../src/store';
import { Button, Field, Tiles, ErrorText, Panel } from '../src/ui';
import { DISCLAIMER, DATA_NOTE, PRIVACY_URL } from '../src/app-info';
import { colors, space, radius, type } from '../src/theme';
import { T } from '../src/i18n';

// Age and sex at birth stay because scores are read against a reference group.
// Education is optional and affects some norms.
//
// Medical history is deliberately NOT asked. It is special-category data with
// no purpose in a tool that only shows you your own trend, and guideline 5.1.1
// says not to require personal information that is not directly relevant to
// core functionality. app.html asks for it because that is the trial's intake
// form; this app is not the trial.
const SEX = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'intersex', label: 'Intersex' },
  { value: 'prefer_not', label: 'Prefer not to say' },
];

const EDUCATION = [
  { value: 'none', label: 'None of the below' },
  { value: 'secondary', label: 'Secondary school' },
  { value: 'college', label: 'College / A-levels' },
  { value: 'degree', label: 'Degree' },
  { value: 'postgrad', label: 'Postgraduate' },
];

export default function Onboarding() {
  const { user, setProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState(null);
  const [education, setEducation] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ageNum = parseInt(age, 10);
  const ageValid = Number.isFinite(ageNum) && ageNum >= 18 && ageNum <= 120;
  const canSubmit = name.trim() && ageValid && sex && accepted;

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await saveProfile(user.uid, user.email, {
        name: name.trim(),
        age: ageNum,
        sex,
        education,
      });
      // Re-read rather than trusting the local object — the gate keys off this.
      setProfile(await loadProfile(user.uid));
      router.replace('/session/sleep');
    } catch (e) {
      setError(T('err.save') + (e?.code || e?.message || ''));
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={type.h2}>{T('onboard.h1')}</Text>
      <Text style={type.body}>{T('onboard.sub')}</Text>

      <Field label={T('onboard.name')} value={name} onChangeText={setName} autoCapitalize="words" />
      <Field
        label={T('onboard.age')}
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        maxLength={3}
      />
      {age && !ageValid ? <ErrorText>Enter an age between 18 and 120.</ErrorText> : null}

      <Text style={styles.label}>{T('onboard.sex')}</Text>
      <Tiles options={SEX} value={sex} onChange={setSex} />

      <Text style={styles.label}>{T('onboard.education')}</Text>
      <Tiles options={EDUCATION} value={education} onChange={setEducation} />

      <Panel title={T('onboard.before_start')} style={styles.notice}>
        <Text style={styles.noticeBody}>{DISCLAIMER}</Text>
        <Text style={styles.noticeBody}>{DATA_NOTE}</Text>
        <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
          <Text style={styles.link}>{T('onboard.privacy_link')}</Text>
        </Pressable>
      </Panel>

      <Pressable style={styles.acceptRow} onPress={() => setAccepted((a) => !a)}>
        <View style={[styles.check, accepted && styles.checkOn]}>
          {accepted ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
        <Text style={styles.acceptText}>{T('onboard.accept')}</Text>
      </Pressable>

      <ErrorText>{error}</ErrorText>

      <Button
        title={T('onboard.start')}
        onPress={submit}
        disabled={!canSubmit}
        busy={busy}
        style={styles.cta}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  label: { ...type.small, color: colors.textMuted, fontWeight: '600', marginTop: space.sm },
  notice: { marginTop: space.md, backgroundColor: colors.bgAlt },
  noticeBody: { ...type.body, fontSize: 14, lineHeight: 21 },
  link: { ...type.small, color: colors.accent, marginTop: space.xs },
  acceptRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  check: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.accent },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  acceptText: { ...type.body, flex: 1, color: colors.text, fontSize: 15 },
  cta: { marginTop: space.md },
});
