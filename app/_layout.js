import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/auth-context';
import { colors } from '../src/theme';

function Gate() {
  const { user, profile, ready } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const first = segments[0];

    if (!user) {
      if (first !== 'sign-in') router.replace('/sign-in');
      return;
    }
    // Signed in but no profile document — they have never completed onboarding.
    if (!profile) {
      if (first !== 'onboarding') router.replace('/onboarding');
      return;
    }
    if (first === 'sign-in' || first === 'onboarding' || first === undefined) {
      router.replace('/dashboard');
    }
  }, [ready, user, profile, segments, router]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: '600' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ title: 'About you' }} />
      <Stack.Screen name="dashboard" options={{ title: 'OneCarbon', headerBackVisible: false }} />
      <Stack.Screen name="session/sleep" options={{ title: 'Sleep & wellbeing' }} />
      {/* No gesture back out of a running battery — a swipe would bin the session. */}
      <Stack.Screen
        name="session/battery"
        options={{ title: 'Assessment', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="session/results"
        options={{ title: 'Results', headerBackVisible: false, gestureEnabled: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Gate />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
