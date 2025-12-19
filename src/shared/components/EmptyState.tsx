import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../styles/ThemeProvider";
import { ThemedText } from "./Themed";
import { useI18n } from "../../app/providers/I18nProvider";
import { OfflineAnimation } from "./OfflineAnimation";

export type EmptyStateType = "error" | "offline" | "empty" | "search";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onRetry?: () => void;
  actionLabel?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = "empty",
  title,
  message,
  icon,
  onRetry,
  actionLabel,
  style,
  compact = false,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Configuration par défaut selon le type
  const config = {
    error: {
      icon: "alert-circle-outline",
      color: colors.notification, // Rouge souvent
      title: t("state.error.title"),
      message: t("state.error.message"),
    },
    offline: {
      icon: "cloud-offline-outline",
      color: colors.text,
      title: t("state.offline.title"),
      message: t("state.offline.message"),
    },
    empty: {
      icon: "file-tray-outline",
      color: colors.primary,
      title: t("state.empty.title"),
      message: t("state.empty.message"),
    },
    search: {
      icon: "search-outline",
      color: colors.text,
      title: t("state.search.title"),
      message: t("state.search.message"),
    },
  };

  const currentConfig = config[type];
  const displayIcon = icon || currentConfig.icon;
  const displayTitle = title || currentConfig.title;
  const displayMessage = message || currentConfig.message;
  const displayColor = currentConfig.color;

  const iconSize = compact ? 32 : 48;
  const iconContainerSize = compact ? 60 : 100;

  // Si c'est offline et non-compact, on affiche l'animation
  if (type === "offline" && !compact) {
    return (
      <View style={[styles.container, style]}>
        <View style={{ marginBottom: 40 }}>
          <OfflineAnimation />
        </View>

        <ThemedText variant="title" style={styles.title}>
          {displayTitle}
        </ThemedText>

        <ThemedText style={styles.message}>{displayMessage}</ThemedText>

        {onRetry && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.buttonText, { color: "#FFF" }]}>
              {actionLabel || t("common.retry")}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.card,
            width: iconContainerSize,
            height: iconContainerSize,
            borderRadius: iconContainerSize / 2,
            marginBottom: compact ? 12 : 24,
          },
        ]}
      >
        <Ionicons
          name={displayIcon as any}
          size={iconSize}
          color={displayColor}
          style={{ opacity: 0.8 }}
        />
      </View>

      <ThemedText
        variant="title"
        style={[styles.title, compact && styles.titleCompact]}
      >
        {displayTitle}
      </ThemedText>

      <ThemedText style={[styles.message, compact && styles.messageCompact]}>
        {displayMessage}
      </ThemedText>

      {onRetry && (
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            compact && styles.buttonCompact,
          ]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <ThemedText
            style={[
              styles.buttonText,
              { color: "#FFF" },
              compact && styles.buttonTextCompact,
            ]}
          >
            {actionLabel || t("common.retry")}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 300,
  },
  containerCompact: {
    minHeight: 150,
    padding: 16,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    // Ombre douce
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  titleCompact: {
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.6,
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: "80%",
  },
  messageCompact: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    minWidth: 160,
    alignItems: "center",
  },
  buttonCompact: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    minWidth: 120,
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  buttonTextCompact: {
    fontSize: 14,
  },
});
