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
import { useWindowDimensions, Animated } from "react-native";
import { BarChart, PieChart, ProgressChart } from "react-native-chart-kit";

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
  const { width: screenWidth } = useWindowDimensions();
  const contentPadding = 16;
  const cardPadding = 14;
  const [barWidth, setBarWidth] = React.useState(0);
  const [pieWidth, setPieWidth] = React.useState(0);
  const fallbackChartWidth = Math.max(
    220,
    screenWidth - contentPadding * 2 - cardPadding * 2
  );
  const barChartWidth = Math.max(
    220,
    barWidth ? barWidth - cardPadding * 2 : fallbackChartWidth
  );
  const pieChartWidth = Math.max(
    220,
    pieWidth ? pieWidth - cardPadding * 2 : fallbackChartWidth
  );
  const computeHeight = (w: number) =>
    Math.max(200, Math.min(300, Math.round(w * 0.6)));
  const barChartHeight = computeHeight(barChartWidth);
  const pieChartHeight = computeHeight(pieChartWidth);
  const labelRotation = barChartWidth < 320 ? 30 : 0;
  const excelBlue = "#4472C4";
  const excelOrange = "#ED7D31";
  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(68, 114, 196, ${opacity})`,
    labelColor: (opacity = 1) =>
      `rgba( ${parseInt(colors.text.slice(1, 3), 16)}, ${parseInt(
        colors.text.slice(3, 5),
        16
      )}, ${parseInt(colors.text.slice(5, 7), 16)}, ${opacity})`,
    propsForLabels: { fill: colors.text, fontSize: 9 },
    propsForBackgroundLines: { stroke: colors.border },
  } as const;
  const ShimmerView: React.FC<{
    height: number;
    borderRadius?: number;
    style?: any;
  }> = ({ height, borderRadius = 8, style }) => {
    const [w, setW] = React.useState(0);
    const progress = React.useRef(new Animated.Value(0))
      .current as Animated.Value;
    React.useEffect(() => {
      const duration = w ? 1200 + Math.min(w, 400) : 1600;
      Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        })
      ).start();
    }, [w]);
    const translateX = (progress as any).interpolate({
      inputRange: [0, 1],
      outputRange: [-w, w],
    });
    return (
      <View
        style={[
          { borderRadius, overflow: "hidden", backgroundColor: colors.card },
          style,
        ]}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
      >
        <View style={{ height, backgroundColor: colors.border }} />
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            height,
            width: Math.max(80, w * 0.35),
            transform: [{ translateX }],
            backgroundColor: "rgba(255,255,255,0.15)",
          }}
        />
      </View>
    );
  };
  const SkeletonAnalytics: React.FC = () => {
    return (
      <View>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ShimmerView height={24} style={{ marginBottom: 10 }} />
          <ShimmerView height={14} style={{ marginBottom: 6 }} />
          <ShimmerView height={12} style={{ width: "60%" }} />
        </View>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ShimmerView height={barChartHeight} />
        </View>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ShimmerView height={pieChartHeight} />
        </View>
      </View>
    );
  };
  React.useEffect(() => {
    fetchData();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16 }}
    >
      <View
        style={[
          styles.appbar,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
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

      {isLoading && <SkeletonAnalytics />}
      {!!error && (
        <Text style={[styles.error, { color: colors.error }]}>
          {String(error)}
        </Text>
      )}

      {!isLoading && (
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

          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
          >
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                {tText("nombres d'opérations sortantes")}: {String(debitCount)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                {tText("nombres d'opérations entrantes")}: {String(creditCount)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                {tText("Cumul")}: {String(totalCount)}
              </Text>
            </View>
            <Text
              style={[styles.title, { color: colors.text, marginBottom: 8 }]}
            >
              {tText("Titre du graphique")}
            </Text>
            <BarChart
              width={barChartWidth}
              height={barChartHeight}
              fromZero
              chartConfig={chartConfig}
              style={{ borderRadius: 8 }}
              yAxisLabel=""
              yAxisSuffix=""
              verticalLabelRotation={labelRotation}
              showValuesOnTopOfBars
              xLabelsOffset={-4}
              data={{
                labels: [tText("Sort."), tText("Entr."), tText("Cum.")],
                datasets: [
                  {
                    data: [debitCount, creditCount, totalCount],
                  },
                ],
              }}
            />
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onLayout={(e) => setPieWidth(e.nativeEvent.layout.width)}
          >
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                {tText("Pourcentage debit")}: {String(percentDebit)}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                {tText("Pourcentage credit")}: {String(percentCredit)}%
              </Text>
            </View>
            <Text
              style={[styles.title, { color: colors.text, marginBottom: 8 }]}
            >
              {tText("Répartition")}
            </Text>
            {(() => {
              const debitProgress = Math.max(
                0,
                Math.min(1, percentDebit / 100)
              );
              const creditProgress = Math.max(
                0,
                Math.min(1, percentCredit / 100)
              );
              const strokeWidth = Math.max(
                10,
                Math.round(pieChartWidth * 0.06)
              );
              const radius = Math.max(28, Math.round(pieChartWidth * 0.18));
              return (
                <ProgressChart
                  width={pieChartWidth}
                  height={pieChartHeight}
                  strokeWidth={strokeWidth}
                  radius={radius}
                  hideLegend={true}
                  chartConfig={chartConfig}
                  data={{
                    labels: [tText("Débit"), tText("Crédit")],
                    data: [debitProgress, creditProgress],
                  }}
                  style={{ borderRadius: 8 }}
                />
              );
            })()}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: 6,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: excelOrange,
                    marginRight: 6,
                    borderRadius: 2,
                  }}
                />
                <Text style={{ color: colors.text }} numberOfLines={1}>
                  {tText("Débit")}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: excelBlue,
                    marginRight: 6,
                    borderRadius: 2,
                  }}
                />
                <Text style={{ color: colors.text }} numberOfLines={1}>
                  {tText("Crédit")}
                </Text>
              </View>
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
  appbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    // shadow/elevation
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  refreshBtn: { flexDirection: "row", alignItems: "center" },
  refreshText: { marginLeft: 6, fontWeight: "600" },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  grid: { flexDirection: "row", justifyContent: "space-between" },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  metricMain: { marginLeft: 8, fontSize: 22, fontWeight: "800" },
  metricValue: { fontSize: 18, fontWeight: "700" },
  metricLabel: { fontSize: 12 },
  error: { fontSize: 14 },
});

export default AnalyticsScreen;
