import React, { useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/auth-context';
import { saveProfile, loadProfile } from '../src/store';
import { Button, Field, Tiles, ErrorText } from '../src/ui';
import { colors, space, type } from '../src/theme';
import { T } from '../src/i18n';

// Same option sets as app.html's onboarding, so profile documents written by
// either client are comparable.
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

const MEDICAL = [
  { value: 'none', label: 'None' },
  { value: 'hypertension', label: 'High blood pressure' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'depression', label: 'Depression or anxiety' },
  { value: 'neuro', label: 'Neurological condition' },
  { value: 'prefer_not', label: 'Prefer not to say' },
];

export default function Onboarding() {
  const { user, setProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState(null);
  const [education, setEducation] = useState(null);
  const [medical, setMedical] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ageNum = parseInt(age, 10);
  const ageValid = Number.isFinite(ageNum) && ageNum >= 18 && ageNum <= 120;
  // Consent is its own screen now (app/consent.js) and is reached before this
  // one, so there is no checkbox here to tick twice.
  const canSubmit = name.trim() && ageValid && sex;

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await saveProfile(user.uid, user.email, {
        name: name.trim(),
        age: ageNum,
        sex,
        education,
        medical_history: medical,
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

      <Text style={styles.label}>Highest education</Text>
      <Tiles options={EDUCATION} value={education} onChange={setEducation} />

      <Text style={styles.label}>Medical history</Text>
      <Tiles options={MEDICAL} value={medical} onChange={setMedical} multi />

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
  cta: { marginTop: space.md },
});
