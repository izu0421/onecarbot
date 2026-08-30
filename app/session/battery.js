import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Battery from '../../src/battery/Battery';
import { setResults } from '../../src/session';
import { colors, space, type } from '../../src/theme';
import { T } from '../../src/i18n';

export default function BatteryScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState({ done: 0, total: 7 });

  const handleProgress = useCallback((done, total) => setProgress({ done, total }), []);

  const handleComplete = useCallback(
    (results) => {
      setResults(results);
      router.replace('/session/results');
    },
    [router]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${(progress.done / Math.max(1, progress.total)) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {T('battery.progress', { done: progress.done, total: progress.total })}
      </Text>
      <Battery onComplete={handleComplete} onProgress={handleProgress} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  barTrack: { height: 3, backgroundColor: colors.bgAlt },
  barFill: { height: 3, backgroundColor: colors.accent },
  progressText: { ...type.small, textAlign: 'center', paddingTop: space.sm },
});
