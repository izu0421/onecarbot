// Shared primitives, so screens stay about behaviour rather than styling.
import React from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, space, radius, type } from './theme';

export function Button({ title, onPress, disabled, busy, kind = 'primary', style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.btn,
        kind === 'ghost' && s.btnGhost,
        (disabled || busy) && s.btnDisabled,
        pressed && !disabled && !busy && s.btnPressed,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={kind === 'ghost' ? colors.accent : '#fff'} />
      ) : (
        <Text style={[s.btnText, kind === 'ghost' && s.btnGhostText]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

/** Single- or multi-select chips, the app.html "tiles" pattern. */
export function Tiles({ options, value, onChange, multi }) {
  const selected = multi ? value || [] : value;
  const isOn = (v) => (multi ? selected.includes(v) : selected === v);
  const toggle = (v) => {
    if (!multi) return onChange(v);
    onChange(isOn(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };
  return (
    <View style={s.tiles}>
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        return (
          <Pressable
            key={val}
            onPress={() => toggle(val)}
            style={[s.tile, isOn(val) && s.tileOn]}
          >
            <Text style={[s.tileText, isOn(val) && s.tileTextOn]}>{lab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Panel({ title, children, style }) {
  return (
    <View style={[s.panel, style]}>
      {title ? <Text style={s.panelTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <Text style={s.error}>{children}</Text>;
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: 15,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  btnPressed: { backgroundColor: colors.accentDark },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.accent },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnGhostText: { color: colors.accent },

  field: { gap: space.xs },
  label: { ...type.small, color: colors.textMuted, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.text,
  },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    paddingHorizontal: space.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tileOn: { borderColor: colors.accent, backgroundColor: '#E8EDF5' },
  tileText: { fontSize: 15, color: colors.textMuted },
  tileTextOn: { color: colors.accent, fontWeight: '600' },

  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  panelTitle: { ...type.h3 },

  error: { ...type.small, color: colors.danger, marginTop: space.xs },
});
