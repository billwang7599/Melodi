/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const palette = {
  brandPrimary: "#6C5CE7",
  brandPrimaryDark: "#A29BFE",
  brandSecondary: "#00B894",
  brandAccent: "#FDCB6E",
  danger: "#FF6B6B",
  success: "#2ECC71",
  light: {
    background: "#FDF9E0",
    surface: "#FFFFFF",
    text: "#1F1B36",
    textMuted: "#7996A5",
    border: "#D9D4F0",
    icon: "#ACD5CD",
    shadow: "#05608F",
  },
  dark: {
    background: "#0F0B20",
    surface: "#1C1633",
    text: "#F1EDFF",
    textMuted: "#B0A9D6",
    border: "#3E365D",
    icon: "#B0A9D6",
    shadow: "#000000",
  },
};

export const Colors = {
  light: {
    text: palette.light.text,
    textMuted: palette.light.textMuted,
    background: palette.light.background,
    surface: palette.light.surface,
    border: palette.light.border,
    tint: "#7996A5",
    primary: "#7996A5",
    primaryMuted: "#DDD7FF",
    secondary: palette.brandSecondary,
    accent: palette.brandAccent,
    success: palette.success,
    danger: palette.danger,
    icon: palette.light.icon,
    shadow: palette.light.shadow,
    inputBackground: palette.light.surface,
    inputBorder: "#C6C0E0",
    tabIconDefault: palette.light.textMuted,
    tabIconSelected: "#7996A5",
  },
  dark: {
    text: palette.dark.text,
    textMuted: palette.dark.textMuted,
    background: palette.dark.background,
    surface: palette.dark.surface,
    border: palette.dark.border,
    tint: "#7996A5",
    primary: "#7996A5",
    primaryMuted: "#3B3362",
    secondary: "#55EFC4",
    accent: "#FFD479",
    success: palette.success,
    danger: palette.danger,
    icon: palette.dark.icon,
    shadow: palette.dark.shadow,
    inputBackground: "#24203C",
    inputBorder: "#4C436B",
    tabIconDefault: palette.dark.textMuted,
    tabIconSelected: "#7996A5",
  },
};

export const API = {
  BACKEND_URL: "https://samira-unavengeable-abrielle.ngrok-free.dev",
};

export const SUPABASE = {
  URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
