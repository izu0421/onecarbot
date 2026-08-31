import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SECTIONS, TRIAL, CONSENT_VERSION } from '../src/consent-text';
import { Button } from '../src/ui';
import { colors, space, radius, type } from '../src/theme';

/**
 * Informed consent, App Store guideline 5.1.3(iii).
 *
 * Deliberately awkward to skip: the Agree button stays disabled until the
 * participant has actually scrolled to the bottom. A consent form you can
 * dismiss without seeing is not consent, and Apple looks for exactly this.
 */
export default function Consent() {
  const router = useRouter();
  const [readToEnd, setReadToEnd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const alreadyFired = useRef(false);

  const onScroll = ({ nativeEvent: e }) => {
    if (alreadyFired.current) return;
    const atBottom =
      e.layoutMeasurement.height + e.contentOffset.y >= e.contentSize.height - 40;
    if (atBottom) {
      alreadyFired.current = true;
      setReadToEnd(true);
    }
  };

  // Short documents may not scroll at all — in that case it is already all read.
  const onContentSizeChange = (_w, h) => {
    if (!alreadyFired.current && h > 0 && h < 600) {
      alreadyFired.current = true;
      setReadToEnd(true);
    }
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.wrap}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        scrollEventThrottle={100}
      >
        <Text style={type.h2}>Before you start</Text>
        <Text style={styles.lead}>
          Please read this properly. It explains what {TRIAL.name} is, what happens to your
          data, and how to leave.
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.key} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <Pressable onPress={() => Linking.openURL(TRIAL.privacyUrl)}>
          <Text style={styles.link}>Read the full privacy policy →</Text>
        </Pressable>

        <Text style={styles.meta}>
          {TRIAL.name} · {TRIAL.registration} · {TRIAL.sponsor}
          {'\n'}Consent version {CONSENT_VERSION}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        {!readToEnd ? (
          <Text style={styles.hint}>Scroll to the end to continue</Text>
        ) : null}

        <Pressable
          style={styles.consentRow}
          onPress={() => setAgreed((a) => !a)}
          disabled={!readToEnd}
        >
          <View style={[styles.check, agreed && styles.checkOn, !readToEnd && styles.checkOff]}>
            {agreed ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={[styles.consentText, !readToEnd && styles.consentTextMuted]}>
            I have read the above, I understand I can withdraw at any time, and I agree to
            take part in {TRIAL.name}.
          </Text>
        </Pressable>

        <Button
          title="Agree and continue"
          onPress={() => router.replace('/onboarding')}
          disabled={!readToEnd || !agreed}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: space.lg, paddingBottom: space.xl, gap: space.md },
  lead: { ...type.body, color: colors.text },
  section: { gap: space.xs, marginTop: space.sm },
  sectionTitle: { ...type.h3 },
  sectionBody: { ...type.body },
  link: { ...type.body, color: colors.accent, marginTop: space.md },
  meta: {
    ...type.small,
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    lineHeight: 18,
  },
  footer: {
    padding: space.lg,
    gap: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  hint: { ...type.small, textAlign: 'center', color: colors.accent },
  consentRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
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
  checkOff: { borderColor: colors.border },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  consentText: { ...type.body, flex: 1, color: colors.text, fontSize: 15 },
  consentTextMuted: { color: colors.textFaint },
});
