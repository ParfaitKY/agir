import React from "react";
import { View, Text as RNText, Image, ViewProps, TextProps, ImageProps, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../styles/ThemeProvider";

export const ThemedView: React.FC<ViewProps & { elevated?: boolean; card?: boolean }> = ({ style, elevated, card, ...props }) => {
  const { colors } = useTheme();
  const baseBg = card ? colors.card : colors.background;
  const shadow = elevated
    ? {
        shadowColor: colors.border,
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }
    : undefined;
  return <View style={[{ backgroundColor: baseBg }, shadow, style]} {...props} />;
};

export const ThemedText: React.FC<TextProps & { variant?: "title" | "subtitle" | "muted" }> = ({ style, variant, ...props }) => {
  const { colors } = useTheme();
  const base: TextStyle = { color: colors.text };
  const variantStyle: TextStyle | undefined =
    variant === "title"
      ? { fontWeight: "700" as TextStyle["fontWeight"] }
      : variant === "subtitle"
      ? { opacity: 0.85 }
      : variant === "muted"
      ? { opacity: 0.7 }
      : undefined;
  return <RNText style={[base, variantStyle, style]} {...props} />;
};

export const ThemedIcon: React.FC<{
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: string;
}> = ({ name, size = 20, color }) => {
  const { colors } = useTheme();
  return <Ionicons name={name as any} size={size} color={color ?? colors.text} />;
};

export const ThemedImage: React.FC<ImageProps & { lightSource?: any; darkSource?: any }> = ({ style, lightSource, darkSource, source, ...props }) => {
  const { colors } = useTheme();
  // If themed sources provided, pick based on background contrast
  const finalSource = darkSource && lightSource ? (colors.background === "#121212" ? darkSource : lightSource) : source ?? lightSource ?? darkSource;
  return <Image style={style} source={finalSource} {...props} />;
};

export const ThemedCard: React.FC<ViewProps> = ({ style, ...props }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
        },
        style,
      ]}
      {...props}
    />
  );
};

