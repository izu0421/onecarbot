import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { requestCode, verifyCode } from '../src/login';
import { Button, Field, ErrorText } from '../src/ui';
import { colors, space, radius, type } from '../src/theme';
import { T } from '../src/i18n';

const RESEND_SECONDS = 30;

export default function SignIn() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const codeInput = useRef(null);

  // Stops someone hammering Resend into the function's per-hour cap.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    setError('');
    setBusy(true);
    try {
      await requestCode(email.trim());
      setStep('code');
      setCooldown(RESEND_SECONDS);
      setTimeout(() => codeInput.current?.focus(), 350);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (value) => {
    const c = (value ?? code).replace(/\D/g, '');
    setError('');
    setBusy(true);
    try {
      await verifyCode(email.trim(), c);
      // The gate in _layout.js routes onward from here.
    } catch (e) {
      setError(e.message);
      setCode('');
      setBusy(false);
    }
  };

  const onCodeChange = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    // Submit as soon as it is complete — no extra button press.
    if (digits.length === 6 && !busy) submit(digits);
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

        {step === 'email' ? (
          <>
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
              autoFocus
              onSubmitEditing={email.trim() ? send : undefined}
              returnKeyType="send"
            />
            <ErrorText>{error}</ErrorText>
            <Button
              title={T('auth.send_code')}
              onPress={send}
              disabled={!email.trim()}
              busy={busy}
              style={styles.cta}
            />
            <Text style={styles.fine}>{T('auth.no_password')}</Text>
          </>
        ) : (
          <>
            <Text style={type.h1}>{T('auth.code_h1')}</Text>
            <Text style={[type.body, styles.sub]}>{T('auth.code_sub', { email: email.trim() })}</Text>

            <TextInput
              ref={codeInput}
              style={styles.codeInput}
              value={code}
              onChangeText={onCodeChange}
              keyboardType="number-pad"
              // Lets iOS and Android offer the code straight from the email.
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={6}
              editable={!busy}
            />
            <ErrorText>{error}</ErrorText>

            <Button
              title={T('auth.verify')}
              onPress={() => submit()}
              disabled={code.length !== 6}
              busy={busy}
              style={styles.cta}
            />

            <Pressable onPress={cooldown > 0 ? undefined : send} disabled={cooldown > 0}>
              <Text style={[styles.link, cooldown > 0 && styles.linkMuted]}>
                {cooldown > 0 ? T('auth.resend_in', { n: cooldown }) : T('auth.resend')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setStep('email');
                setCode('');
                setError('');
              }}
            >
              <Text style={styles.link}>{T('auth.change_email')}</Text>
            </Pressable>
          </>
        )}
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
  fine: { ...type.small, textAlign: 'center', marginTop: space.sm },
  link: { ...type.small, color: colors.accent, textAlign: 'center', marginTop: space.md },
  linkMuted: { color: colors.textFaint },
  codeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space.md,
    fontSize: 34,
    letterSpacing: 12,
    textAlign: 'center',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
