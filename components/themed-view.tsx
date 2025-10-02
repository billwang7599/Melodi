import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'background' | 'surface';
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = 'background',
  ...otherProps
}: ThemedViewProps) {
  const colorKey = variant === 'surface' ? 'surface' : 'background';
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
