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
import { Dimensions, Platform } from "react-native";
const {
  VictoryChart,
  VictoryBar,
  VictoryTheme,
  VictoryAxis,
  VictoryPie,
} = Platform.OS === "web" ? require("victory") : require("victory-native");

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
  const debitCount = Number(data?.NOMBRE_OPERATIONS_DEBIT ?? 0);
  const creditCount = Number(data?.NOMBRE_OPERATIONS_CREDIT ?? 0);
  const totalCount = Number(
    data?.NOMBRE_TOTAL_OPERATIONS ?? debitCount + creditCount
  );
  const percentDebit = Number(data?.POURCENTAGE_DEBIT ?? 0);
  const percentCredit = Number(data?.POURCENTAGE_CREDIT ?? 0);
  const chartWidth = Dimensions.get("window").width - 32;
  const excelBlue = "#4472C4";
  const excelOrange = "#ED7D31";
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
        <Text style={[styles.error, { color: colors.error }]}>{String(error)}</Text>
      )}

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

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.metricLabel, { color: colors.text }]}> 
              {tText("nombre d'op sortante")}: {String(debitCount)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.text }]}> 
              {tText("nombre d'op entrante")}: {String(creditCount)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.text }]}> 
              {tText("Cumul")}: {String(totalCount)}
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.text, marginBottom: 8 }]}>{tText("Titre du graphique")}</Text>
          <VictoryChart theme={VictoryTheme.material} domainPadding={{ x: 30 }} width={chartWidth} height={240} domain={{ y: [0, Math.max(totalCount, 30)] }}> 
            <VictoryAxis style={{ tickLabels: { fill: colors.text } }} />
            <VictoryAxis dependentAxis style={{ tickLabels: { fill: colors.text } }} />
            <VictoryBar
              data={[
                { x: tText("nombre d'op sortante"), y: debitCount },
                { x: tText("nombre d'op entrante"), y: creditCount },
                { x: tText("Cumul"), y: totalCount },
              ]}
              style={{ data: { fill: excelBlue } }}
              barRatio={0.8}
            />
          </VictoryChart>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.metricLabel, { color: colors.text }]}> 
              {tText("Pourcentage debit")}: {String(percentDebit)}%
            </Text>
            <Text style={[styles.metricLabel, { color: colors.text }]}> 
              {tText("Pourcentage credit")}: {String(percentCredit)}%
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.text, marginBottom: 8 }]}>{tText("Titre du graphique")}</Text>
          <VictoryPie 
            width={chartWidth}
            height={240}
            innerRadius={60}
            colorScale={[excelOrange, excelBlue]}
            data={[
              { x: tText("Pourcentage debit"), y: percentDebit },
              { x: tText("Pourcentage credit"), y: percentCredit },
            ]}
            labels={({ datum }) => `${Math.round(datum.y)}%`}
            style={{ labels: { fill: colors.text } }}
          />
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
              <View style={{ width: 10, height: 10, backgroundColor: excelOrange, marginRight: 6, borderRadius: 2 }} />
              <Text style={{ color: colors.text }}>{tText("Pourcentage debit")}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 10, height: 10, backgroundColor: excelBlue, marginRight: 6, borderRadius: 2 }} />
              <Text style={{ color: colors.text }}>{tText("Pourcentage credit")}</Text>
            </View>
          </View>
        </View>
      </View>
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
