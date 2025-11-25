import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";

export const AnalyticsScreen: React.FC = () => {
  const { t, tText } = useI18n();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{tText("Analytics")}</Text>
      <Text style={[styles.subtitle, { color: colors.text + "80" }]}>{t("analytics.loading")}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 14 },
});

export default AnalyticsScreen;
