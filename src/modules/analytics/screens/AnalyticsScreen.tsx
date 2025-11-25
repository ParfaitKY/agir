import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import axios from "axios";
import { BASE_URL, COMPTE_ENDPOINTS } from "../../../api";
import { Svg, Circle } from "react-native-svg";

type AnalysisData = {
  CL_IDCLIENT: string;
  NOMBRE_OPERATIONS_CREDIT: number;
  NOMBRE_OPERATIONS_DEBIT: number;
  NOMBRE_TOTAL_OPERATIONS: number;
  POURCENTAGE_CREDIT: number;
  POURCENTAGE_DEBIT: number;
  POURCENTAGE_SENS_FORT: number;
  SENS_FORT: string;
};

const BarChart = ({
  debit,
  credit,
  total,
  colors,
  title,
}: {
  debit: number;
  credit: number;
  total: number;
  colors: any;
  title: string;
}) => {
  const chartHeight = 180;
  const values = [debit, credit, total];
  const max = Math.max(...values, 1);
  const bars = [
    { label: "nombre d'op sortante", value: debit, color: colors.warning },
    { label: "nombre d'op entrante", value: credit, color: colors.success },
    { label: "Cumul", value: total, color: colors.primary },
  ];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.chartRow}>
        <View style={styles.yAxisLabels}>
          <Text style={[styles.yLabel, { color: colors.text }]}>{max}</Text>
          <Text style={[styles.yLabel, { color: colors.text }]}>
            {Math.round(max / 2)}
          </Text>
          <Text style={[styles.yLabel, { color: colors.text }]}>0</Text>
        </View>
        <View style={[styles.chartArea, { borderColor: colors.border }]}>
          <View style={[styles.gridLine, { backgroundColor: colors.border }]} />
          <View
            style={[
              styles.gridLine,
              { backgroundColor: colors.border, top: chartHeight / 2 },
            ]}
          />
          <View
            style={[
              styles.gridLine,
              { backgroundColor: colors.border, top: chartHeight },
            ]}
          />
          <View style={[styles.barsRow, { height: chartHeight }]}>
            {bars.map((b, i) => {
              const h = Math.round((b.value / max) * chartHeight);
              return (
                <View key={i} style={styles.barCol}>
                  <View
                    style={[
                      styles.bar,
                      { height: h, backgroundColor: b.color },
                    ]}
                  />
                  <Text style={[styles.barLabel, { color: colors.text }]}>
                    {b.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const DonutChart = ({
  creditPercent,
  debitPercent,
  colors,
  title,
}: {
  creditPercent: number;
  debitPercent: number;
  colors: any;
  title: string;
}) => {
  const size = 180;
  const strokeWidth = 18;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const cp = Math.max(0, Math.min(100, creditPercent));
  const dp = Math.max(0, Math.min(100, debitPercent));
  const creditLen = (cp / 100) * circumference;
  const debitLen = (dp / 100) * circumference;
  const centerText = `${Math.round(cp)}% / ${Math.round(dp)}%`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.donutWrapper}>
        <Svg
          width={size}
          height={size}
          style={{ transform: [{ rotate: "-90deg" }] }}
        >
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${creditLen}, ${circumference - creditLen}`}
            strokeDashoffset={0}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.warning}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${debitLen}, ${circumference - debitLen}`}
            strokeDashoffset={creditLen}
          />
        </Svg>
        <View style={[styles.donutCenter, { width: size, height: size }]}>
          <Text style={[styles.donutText, { color: colors.text }]}>
            {centerText}
          </Text>
        </View>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.warning }]}
          />
          <Text style={[styles.legendLabel, { color: colors.text }]}>
            Pourcentage débit
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.primary }]}
          />
          <Text style={[styles.legendLabel, { color: colors.text }]}>
            Pourcentage crédit
          </Text>
        </View>
      </View>
    </View>
  );
};

export const AnalyticsScreen: React.FC = () => {
  const { colors } = useTheme();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    
    const fetchData = async () => {
      try {
        const res = await axios.post(
          `${BASE_URL}${COMPTE_ENDPOINTS.analyseDerniereTransaction}`,
          { Nombretransactions: 50 }
        );
        const d = res?.data?.data as AnalysisData;
        setData(d);
      } catch (e: any) {
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const debit = data?.NOMBRE_OPERATIONS_DEBIT ?? 0;
  const credit = data?.NOMBRE_OPERATIONS_CREDIT ?? 0;
  const total = data?.NOMBRE_TOTAL_OPERATIONS ?? debit + credit;
  const pctDebit = data?.POURCENTAGE_DEBIT ?? 0;
  const pctCredit = data?.POURCENTAGE_CREDIT ?? 0;
  const sensFort = data?.SENS_FORT ?? "";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Statistiques générales</Text>
      </View>

      {loading && (
        <View style={[styles.loadingBox, { borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ marginTop: 8, color: colors.text }}>Chargement…</Text>
        </View>
      )}

      {!loading && error && (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: colors.error + "15", borderColor: colors.error },
          ]}
        >
          <Text style={{ color: colors.error }}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <>
          <View
            style={[
              styles.metricsCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text + "70" }]}>
                Nombre d'op sortante
              </Text>
              <Text style={[styles.metricValue, { color: colors.warning }]}>
                {debit}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text + "70" }]}>
                Nombre d'op entrante
              </Text>
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {credit}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text + "70" }]}>
                Total des opérations
              </Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {total}
              </Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text + "70" }]}>
                Pourcentage débit
              </Text>
              <Text style={[styles.metricValue, { color: colors.warning }]}>
                {Math.round(pctDebit)}%
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text + "70" }]}>
                Pourcentage crédit
              </Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {Math.round(pctCredit)}%
              </Text>
            </View>
          </View>

          <BarChart
            debit={debit}
            credit={credit}
            total={total}
            colors={colors}
            title={"Nombre d'opérations (barres)"}
          />
          <DonutChart
            creditPercent={pctCredit}
            debitPercent={pctDebit}
            colors={colors}
            title={"Répartition crédit / débit (donut)"}
          />

          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Sens fort
            </Text>
            <Text style={[styles.sensText, { color: colors.text }]}>
              {sensFort}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 6 },
  chartTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  metricsCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  metricLabel: { fontSize: 13 },
  metricValue: { fontSize: 14, fontWeight: "700" },
  separator: { height: 1, backgroundColor: "#EEE", marginVertical: 6 },
  chartRow: { flexDirection: "row" },
  yAxisLabels: {
    width: 40,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: 4,
  },
  yLabel: { fontSize: 12 },
  chartArea: {
    flex: 1,
    height: 200,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    position: "relative",
  },
  gridLine: { position: "absolute", left: 0, right: 0, height: 1 },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },
  barCol: { alignItems: "center", width: 90 },
  bar: { width: 32, borderRadius: 6 },
  barLabel: { fontSize: 11, textAlign: "center", marginTop: 6 },
  donutWrapper: { alignItems: "center", justifyContent: "center" },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  donutText: { fontSize: 14, fontWeight: "700" },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendLabel: { fontSize: 12 },
  sensText: { fontSize: 16, fontWeight: "700" },
  loadingBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  errorBox: { borderWidth: 1, borderRadius: 12, padding: 12 },
});
