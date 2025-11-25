import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ThemeToggle() {
  const { themeMode, setThemeMode } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const options = [
    { value: 'light' as const, label: 'Light', icon: 'sun.max.fill' as const },
    { value: 'dark' as const, label: 'Dark', icon: 'moon.fill' as const },
    { value: 'system' as const, label: 'System', icon: 'gear' as const },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Theme</Text>
      <View style={styles.options}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              {
                backgroundColor: themeMode === option.value ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setThemeMode(option.value)}>
            <IconSymbol
              name={option.icon}
              size={20}
              color={themeMode === option.value ? '#FFFFFF' : colors.text}
            />
            <Text
              style={[
                styles.optionText,
                {
                  color: themeMode === option.value ? '#FFFFFF' : colors.text,
                },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  options: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
