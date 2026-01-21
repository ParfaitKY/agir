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
import { useDernieresOperationsClient } from "../../../domain/compte/useDernieresOperationsClient";
import { useCompteStatistiques } from "../../../domain/compte/useCompteStatistiques";
import { useWindowDimensions, Animated } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";

export const AnalyticsScreen: React.FC = () => {
  const { t, tText } = useI18n();
  const { colors } = useTheme();

  // Fetch account stats to get Total Balance
  const { data: compteStats, fetchData: fetchStats } = useCompteStatistiques();

  // Use the full transaction list to calculate accurate volume-based analytics
  const {
    operations: transactions,
    isLoading: loadingOps,
    error,
    fetchData: fetchOps,
  } = useDernieresOperationsClient(50);

  const isLoading = loadingOps;

  const fetchData = () => {
    fetchOps();
    fetchStats();
  };

  // Calculate analytics locally
  const analytics = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        debitCount: 0,
        creditCount: 0,
        totalCount: 0,
        debitAmount: 0,
        creditAmount: 0,
        totalVolume: 0,
        percentDebit: 0,
        percentCredit: 0,
        sensFort: "EGAL",
        percentStrong: 0,
      };
    }

    let debitC = 0;
    let creditC = 0;
    let debitA = 0;
    let creditA = 0;

    transactions.forEach((op) => {
      const type = (op.TypeOperation || "").toUpperCase();
      const label = String(op.MC_LIBELLEOPERATION || "").toUpperCase();
      const dAmt = Number(op.MC_MONTANTDEBIT || 0);
      const cAmt = Number(op.MC_MONTANTCREDIT || 0);
      
      // 1. Détermination par défaut (Priorité aux montants explicites)
      let isCredit = false;
      if (cAmt > 0) isCredit = true;
      else if (dAmt > 0) isCredit = false;
      else isCredit = type === "CREDIT";

      // 2. Corrections forcées basées sur le libellé (Override)
      
      // SORTIES (Débits)
      if (
        label.includes("OUVERTURE") || 
        label.includes("ADHESION") || 
        label.includes("FRAIS") ||
        label.includes("RETRAIT") ||
        label.includes("VIREMENT") ||
        label.includes("TAXE")
      ) {
        isCredit = false;
      }

      // ENTRÉES (Crédits)
      if (
        label.includes("DEBLOCAGE") || 
        label.includes("DÉBLOCAGE") || 
        label.includes("VERSEMENT") ||
        label.includes("RECU") ||
        label.includes("RÉÇU")
      ) {
        isCredit = true;
      }

      // 3. Affectation des sommes
      // On prend le montant disponible (peu importe la colonne) car on a déterminé le sens réel
      const effectiveAmount = dAmt > 0 ? dAmt : cAmt;

      if (isCredit) {
        creditC++;
        creditA += effectiveAmount;
      } else {
        debitC++;
        debitA += effectiveAmount;
      }
    });

    const totalC = debitC + creditC;
    const totalV = debitA + creditA; // Total volume moved

    // Percentages
    // Standard calculation based on VOLUME (Amount)
    const pDebit = totalV > 0 ? Math.round((debitA / totalV) * 100) : 0;
    // Si pDebit est très petit mais non nul (ex: < 0.5% arrondi à 0), on force au moins 1% pour la visibilité si le montant > 0
    const displayPDebit = (debitA > 0 && pDebit === 0) ? 1 : pDebit;
    
    // Le reste va aux crédits
    const displayPCredit = 100 - displayPDebit;

    const sens =
      debitA > creditA ? "DEBIT" : creditA > debitA ? "CREDIT" : "EGAL";
    const pStrong = sens === "DEBIT" ? displayPDebit : displayPCredit;

    return {
      debitCount: debitC,
      creditCount: creditC,
      totalCount: totalC,
      debitAmount: debitA,
      creditAmount: creditA,
      totalVolume: totalV,
      percentDebit: displayPDebit,
      percentCredit: displayPCredit,
      sensFort: sens,
      percentStrong: pStrong,
    };
  }, [transactions, compteStats]);

  const {
    sensFort,
    percentStrong,
    debitCount,
    creditCount,
    totalCount,
    debitAmount,
    creditAmount,
    percentDebit,
    percentCredit,
  } = analytics;

  const isUp = sensFort === "CREDIT";
  const isDown = sensFort === "DEBIT";

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

  // Display just the percentage, without +/- sign for composition
  const percentDisplay = `${percentStrong}%`;

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
              {tText("Flux dominant")}:{" "}
              {sensFort === "DEBIT"
                ? "Sorties"
                : sensFort === "CREDIT"
                ? "Entrées"
                : "Équilibré"}
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
                {tText("Volume sortant")}:{" "}
                {new Intl.NumberFormat("fr-FR").format(debitAmount)} XOF
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                {tText("Volume entrant")}:{" "}
                {new Intl.NumberFormat("fr-FR").format(creditAmount)} XOF
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                {tText("Opérations")}: {totalCount} ({debitCount} sorties /{" "}
                {creditCount} entrées)
              </Text>
            </View>
            <Text
              style={[styles.title, { color: colors.text, marginBottom: 8 }]}
            >
              {tText("Volume des transactions")}
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
                labels: [tText("Sort."), tText("Entr.")],
                datasets: [
                  {
                    data: [debitAmount, creditAmount],
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
                {tText("Part des retraits")}: {String(percentDebit)}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                {tText("Part des dépôts")}: {String(percentCredit)}%
              </Text>
            </View>
            <Text
              style={[styles.title, { color: colors.text, marginBottom: 8 }]}
            >
              {tText("Répartition Dépôts vs Retraits")}
            </Text>
            <PieChart
              data={[
                {
                  name: tText("Retraits"),
                  population: percentDebit,
                  color: excelOrange,
                  legendFontColor: colors.text,
                  legendFontSize: 12,
                },
                {
                  name: tText("Dépôts"),
                  population: percentCredit,
                  color: excelBlue,
                  legendFontColor: colors.text,
                  legendFontSize: 12,
                },
              ]}
              width={pieChartWidth}
              height={220}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[10, 0]}
              absolute
            />
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
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legendContainer: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: "600",
  },
  legendSubText: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default AnalyticsScreen;
