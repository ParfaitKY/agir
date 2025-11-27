import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useAnalyseDerniereTransaction } from "../../../domain/compte/useAnalyseDerniereTransaction";

export const AnalyticsScreen: React.FC = () => {
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const { data, isLoading, error, fetchData } =
    useAnalyseDerniereTransaction(50);
  const sens = data?.SENS_FORT;
  const isUp = sens === "CREDIT";
  const isDown = sens === "DEBIT";
  const trendIcon = isUp
    ? ("trending-up-outline" as const)
    : isDown
    ? ("trending-down-outline" as const)
    : ("remove-outline" as const);
  const trendColor = isUp
    ? colors.success
    : isDown
    ? colors.error
    : colors.text;
  const percentStrong = data?.POURCENTAGE_SENS_FORT;
  const percentDisplay =
    percentStrong !== undefined && percentStrong !== null
      ? `${isUp ? "+" : isDown ? "-" : ""}${percentStrong}%`
      : "0%";
  React.useEffect(() => {
    fetchData();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16 }}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>
          {tText("Analytique")}
        </Text>
        <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={18} color={colors.primary} />
          <Text style={[styles.refreshText, { color: colors.primary }]}>
            {tText("Actualiser")}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
          {tText("Chargement…")}
        </Text>
      )}
      {!!error && (
        <Text style={[styles.error, { color: colors.error }]}>
          {String(error)}
        </Text>
      )}

      {!isLoading && !error && (
        <View>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.rowCenter}>
              <Ionicons name={trendIcon as any} size={20} color={trendColor} />
              <Text style={[styles.metricMain, { color: trendColor }]}>
                {percentDisplay}
              </Text>
            </View>
            <Text style={[styles.metricLabel, { color: colors.text }]}>
              {tText("Sens fort")}: {String(sens ?? "EGAL")}
            </Text>
          </View>

          <View style={styles.grid}>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {String(data?.NOMBRE_TOTAL_OPERATIONS ?? 0)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + "70" }]}>
                {tText("Total opérations")}
              </Text>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {String(data?.NOMBRE_OPERATIONS_CREDIT ?? 0)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + "70" }]}>
                {tText("Crédit")}
              </Text>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.metricValue, { color: colors.error }]}>
                {String(data?.NOMBRE_OPERATIONS_DEBIT ?? 0)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + "70" }]}>
                {tText("Débit")}
              </Text>
            </View>
          </View>

          <View style={styles.grid}>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {String(data?.POURCENTAGE_CREDIT ?? 0)}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + "70" }]}>
                {tText("% Crédit")}
              </Text>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.metricValue, { color: colors.error }]}>
                {String(data?.POURCENTAGE_DEBIT ?? 0)}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + "70" }]}>
                {tText("% Débit")}
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  refreshBtn: { flexDirection: "row", alignItems: "center" },
  refreshText: { marginLeft: 6, fontWeight: "600" },
  card: { borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 },
  grid: { flexDirection: "row", justifyContent: "space-between" },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  metricMain: { marginLeft: 8, fontSize: 22, fontWeight: "800" },
  metricValue: { fontSize: 18, fontWeight: "700" },
  metricLabel: { fontSize: 12 },
  error: { fontSize: 14 },
});

export default AnalyticsScreen;
