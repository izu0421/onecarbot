import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Pressable } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/firebase';
import { Button, Field, ErrorText } from '../src/ui';
import { colors, space, type } from '../src/theme';
import { T } from '../src/i18n';

const MESSAGES = {
  'auth/invalid-email': 'That email address does not look right.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account with that email — create one below.',
  'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
  'auth/weak-password': 'Use at least 6 characters.',
  'auth/network-request-failed': 'No connection. Check your network and try again.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
};

export default function SignIn() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isSignUp = mode === 'signup';
  const canSubmit = email.trim() && password && (!isSignUp || confirm);

  const submit = async () => {
    setError('');
    if (isSignUp && password !== confirm) {
      setError(T('auth.mismatch'));
      return;
    }
    setBusy(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      // The gate in _layout.js takes it from here.
    } catch (e) {
      setError(MESSAGES[e?.code] || e?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>
          One<Text style={styles.brandAccent}>Carbot</Text>
        </Text>
        <Text style={type.h1}>{T('auth.h1')}</Text>
        <Text style={[type.body, styles.sub]}>{T('auth.sub')}</Text>

        <Field
          label={T('auth.email')}
          placeholder={T('auth.email_ph')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Field
          label={T('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
        />
        {isSignUp ? (
          <Field
            label={T('auth.confirm')}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
          />
        ) : null}

        <ErrorText>{error}</ErrorText>

        <Button
          title={isSignUp ? T('auth.signup') : T('auth.signin')}
          onPress={submit}
          disabled={!canSubmit}
          busy={busy}
          style={styles.cta}
        />

        <Pressable
          onPress={() => {
            setMode(isSignUp ? 'signin' : 'signup');
            setError('');
          }}
        >
          <Text style={styles.toggle}>
            {isSignUp ? T('auth.toggle_signin') : T('auth.toggle_signup')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: space.lg, paddingTop: space.xxl * 1.5, gap: space.md, flexGrow: 1 },
  brand: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: space.xl },
  brandAccent: { color: colors.accent },
  sub: { marginBottom: space.md },
  cta: { marginTop: space.md },
  toggle: { ...type.small, color: colors.accent, textAlign: 'center', marginTop: space.md },
});
