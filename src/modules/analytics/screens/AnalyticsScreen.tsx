import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useDernieresOperationsClient } from "../../../domain/compte/useDernieresOperationsClient";
import { useCompteStatistiques } from "../../../domain/compte/useCompteStatistiques";
import { BarChart, PieChart } from "react-native-chart-kit";

function useAnalytics(transactions: any[]) {
  return React.useMemo(() => {
    if (!transactions?.length) return { debitCount: 0, creditCount: 0, totalCount: 0, debitAmount: 0, creditAmount: 0, totalVolume: 0, percentDebit: 0, percentCredit: 0, sensFort: "EGAL", percentStrong: 0 };
    let dC = 0, cC = 0, dA = 0, cA = 0;
    transactions.forEach((op) => {
      const label = String(op.MC_LIBELLEOPERATION || "").toUpperCase();
      const dAmt = Number(op.MC_MONTANTDEBIT || 0);
      const cAmt = Number(op.MC_MONTANTCREDIT || 0);
      let isCredit = cAmt > 0 ? true : dAmt > 0 ? false : (op.TypeOperation || "").toUpperCase() === "CREDIT";
      if (["OUVERTURE","ADHESION","FRAIS","RETRAIT","VIREMENT","TAXE"].some(k => label.includes(k))) isCredit = false;
      if (["DEBLOCAGE","DÉBLOCAGE","VERSEMENT","RECU","RÉÇU"].some(k => label.includes(k))) isCredit = true;
      const eff = dAmt > 0 ? dAmt : cAmt;
      if (isCredit) { cC++; cA += eff; } else { dC++; dA += eff; }
    });
    const tot = dA + cA;
    const pD = tot > 0 ? Math.round((dA / tot) * 100) : 0;
    const displayPD = dA > 0 && pD === 0 ? 1 : pD;
    const displayPC = 100 - displayPD;
    const sens = dA > cA ? "DEBIT" : cA > dA ? "CREDIT" : "EGAL";
    return { debitCount: dC, creditCount: cC, totalCount: dC + cC, debitAmount: dA, creditAmount: cA, totalVolume: tot, percentDebit: displayPD, percentCredit: displayPC, sensFort: sens, percentStrong: sens === "DEBIT" ? displayPD : displayPC };
  }, [transactions]);
}

export const AnalyticsScreen: React.FC = () => {
  const { tText } = useI18n();
  const { colors } = useTheme();
  const { width: sw } = useWindowDimensions();
  const chartW = sw - 48;
  const navigation = useNavigation();

  const { data: compteStats, fetchData: fetchStats } = useCompteStatistiques();
  const { operations: transactions, isLoading, error, fetchData: fetchOps } = useDernieresOperationsClient(50);

  const refresh = () => { fetchOps(); fetchStats(); };
  React.useEffect(() => { refresh(); }, []);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: colors.background, elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 },
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 8, padding: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text + "45", letterSpacing: 1.5, textTransform: "uppercase" }}>
            Tableau de bord
          </Text>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: -0.3 }}>
            Analytique
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={refresh}
          style={{
            marginRight: 12,
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.primary + "15",
            justifyContent: "center", alignItems: "center",
          }}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const a = useAnalytics(transactions || []);
  const isUp = a.sensFort === "CREDIT";
  const isDown = a.sensFort === "DEBIT";
  const accentColor = isUp ? "#10B981" : isDown ? "#EF4444" : colors.primary;
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (o = 1) => `rgba(99,102,241,${o})`,
    labelColor: () => colors.text + "99",
    propsForLabels: { fontSize: 11 },
    propsForBackgroundLines: { stroke: colors.border + "60" },
  } as const;

  if (isLoading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <View style={[s.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="bar-chart-outline" size={40} color={colors.primary + "60"} />
          <Text style={[s.loadingText, { color: colors.text + "60" }]}>Chargement des données…</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.root, { backgroundColor: colors.background }]}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Refresh button removed — now in header ── */}

      {/* ── Big balance-style hero ── */}
      <View style={[s.heroCard, { backgroundColor: accentColor }]}>
        <Text style={s.heroEyebrow}>VOLUME TOTAL ANALYSÉ</Text>
        <Text style={s.heroAmount}>{fmt(a.totalVolume)}</Text>
        <Text style={s.heroCurrency}>XOF · {a.totalCount} opérations</Text>

        <View style={s.heroRow}>
          <View style={s.heroStat}>
            <Ionicons name="arrow-up-circle" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={s.heroStatVal}>{fmt(a.debitAmount)}</Text>
            <Text style={s.heroStatLbl}>Sorties</Text>
          </View>
          <View style={s.heroSep} />
          <View style={s.heroStat}>
            <Ionicons name="arrow-down-circle" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={s.heroStatVal}>{fmt(a.creditAmount)}</Text>
            <Text style={s.heroStatLbl}>Entrées</Text>
          </View>
          <View style={s.heroSep} />
          <View style={s.heroStat}>
            <Ionicons name={isUp ? "trending-up" : isDown ? "trending-down" : "remove"} size={16} color="rgba(255,255,255,0.7)" />
            <Text style={s.heroStatVal}>{a.percentStrong}%</Text>
            <Text style={s.heroStatLbl}>{isUp ? "Entrées" : isDown ? "Sorties" : "Équil."} dom.</Text>
          </View>
        </View>
      </View>

      {/* ── Split bar ── */}
      <View style={[s.splitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.splitHeader}>
          <Text style={[s.splitTitle, { color: colors.text }]}>Répartition des flux</Text>
          <Text style={[s.splitSub, { color: colors.text + "50" }]}>En % du volume</Text>
        </View>

        {/* Sorties row */}
        <View style={s.barRow}>
          <View style={[s.barDot, { backgroundColor: "#EF4444" }]} />
          <Text style={[s.barLabel, { color: colors.text }]}>Sorties</Text>
          <View style={[s.barTrack, { backgroundColor: "#EF444420" }]}>
            <View style={[s.barFill, { width: `${a.percentDebit}%`, backgroundColor: "#EF4444" }]} />
          </View>
          <Text style={[s.barPct, { color: "#EF4444" }]}>{a.percentDebit}%</Text>
        </View>

        {/* Entrées row */}
        <View style={[s.barRow, { marginTop: 12 }]}>
          <View style={[s.barDot, { backgroundColor: "#10B981" }]} />
          <Text style={[s.barLabel, { color: colors.text }]}>Entrées</Text>
          <View style={[s.barTrack, { backgroundColor: "#10B98120" }]}>
            <View style={[s.barFill, { width: `${a.percentCredit}%`, backgroundColor: "#10B981" }]} />
          </View>
          <Text style={[s.barPct, { color: "#10B981" }]}>{a.percentCredit}%</Text>
        </View>

        {/* Bicolor bar */}
        <View style={s.biBar}>
          <View style={[s.biLeft, { flex: Math.max(a.percentDebit, 1) }]} />
          <View style={[s.biRight, { flex: Math.max(a.percentCredit, 1) }]} />
        </View>
        <View style={s.biLabels}>
          <Text style={[s.biLabelText, { color: "#EF4444" }]}>{fmt(a.debitAmount)} XOF</Text>
          <Text style={[s.biLabelText, { color: "#10B981" }]}>{fmt(a.creditAmount)} XOF</Text>
        </View>
      </View>

      {/* ── Count pills ── */}
      <View style={s.pillRow}>
        <View style={[s.pill, { backgroundColor: "#EF444415", borderColor: "#EF444430" }]}>
          <Ionicons name="arrow-up" size={18} color="#EF4444" />
          <Text style={[s.pillNum, { color: "#EF4444" }]}>{a.debitCount}</Text>
          <Text style={[s.pillLbl, { color: "#EF444499" }]}>sorties</Text>
        </View>
        <View style={[s.pill, { backgroundColor: "#10B98115", borderColor: "#10B98130" }]}>
          <Ionicons name="arrow-down" size={18} color="#10B981" />
          <Text style={[s.pillNum, { color: "#10B981" }]}>{a.creditCount}</Text>
          <Text style={[s.pillLbl, { color: "#10B98199" }]}>entrées</Text>
        </View>
        <View style={[s.pill, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
          <Ionicons name="layers-outline" size={18} color={colors.primary} />
          <Text style={[s.pillNum, { color: colors.primary }]}>{a.totalCount}</Text>
          <Text style={[s.pillLbl, { color: colors.primary + "99" }]}>total</Text>
        </View>
      </View>

      {/* ── Bar chart custom ── */}
      <View style={[s.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.chartTitle, { color: colors.text }]}>Volume des transactions</Text>
        <Text style={[s.chartSub, { color: colors.text + "50" }]}>Sorties vs Entrées (XOF)</Text>

        <View style={s.customBarWrap}>
          {/* Sorties bar */}
          <View style={s.customBarItem}>
            <Text style={[s.customBarAmt, { color: "#EF4444" }]}>{fmt(a.debitAmount)}</Text>
            <View style={s.customBarTrack}>
              <View style={[
                s.customBarFill,
                {
                  height: `${a.totalVolume > 0 ? Math.max(4, Math.round((a.debitAmount / a.totalVolume) * 100)) : 4}%`,
                  backgroundColor: "#EF4444",
                }
              ]} />
            </View>
            <View style={[s.customBarLabel, { backgroundColor: "#EF444418" }]}>
              <Ionicons name="arrow-up" size={12} color="#EF4444" />
              <Text style={[s.customBarLabelText, { color: "#EF4444" }]}>Sorties</Text>
            </View>
            <Text style={[s.customBarCount, { color: colors.text + "50" }]}>{a.debitCount} opér.</Text>
          </View>

          {/* Divider */}
          <View style={[s.customBarDivider, { backgroundColor: colors.border }]} />

          {/* Entrées bar */}
          <View style={s.customBarItem}>
            <Text style={[s.customBarAmt, { color: "#10B981" }]}>{fmt(a.creditAmount)}</Text>
            <View style={s.customBarTrack}>
              <View style={[
                s.customBarFill,
                {
                  height: `${a.totalVolume > 0 ? Math.max(4, Math.round((a.creditAmount / a.totalVolume) * 100)) : 4}%`,
                  backgroundColor: "#10B981",
                }
              ]} />
            </View>
            <View style={[s.customBarLabel, { backgroundColor: "#10B98118" }]}>
              <Ionicons name="arrow-down" size={12} color="#10B981" />
              <Text style={[s.customBarLabelText, { color: "#10B981" }]}>Entrées</Text>
            </View>
            <Text style={[s.customBarCount, { color: colors.text + "50" }]}>{a.creditCount} opér.</Text>
          </View>
        </View>
      </View>

      {/* ── Donut-style répartition ── */}
      <View style={[s.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.chartTitle, { color: colors.text }]}>Répartition Dépôts / Retraits</Text>
        <Text style={[s.chartSub, { color: colors.text + "50" }]}>En pourcentage du volume</Text>

        <View style={s.donutWrap}>
          {/* Left: visual ring simulation */}
          <View style={s.donutLeft}>
            <View style={[s.donutOuter, { borderColor: "#EF4444" }]}>
              <View style={[s.donutInner, { backgroundColor: colors.card }]}>
                <Text style={[s.donutPct, { color: colors.text }]}>{a.percentDebit}%</Text>
                <Text style={[s.donutPctLbl, { color: colors.text + "50" }]}>Retraits</Text>
              </View>
            </View>
          </View>

          {/* Right: legend */}
          <View style={s.donutLegend}>
            <View style={s.donutLegendItem}>
              <View style={[s.donutLegendDot, { backgroundColor: "#EF4444" }]} />
              <View>
                <Text style={[s.donutLegendLabel, { color: colors.text }]}>Retraits</Text>
                <Text style={[s.donutLegendVal, { color: "#EF4444" }]}>{a.percentDebit}% · {fmt(a.debitAmount)} XOF</Text>
              </View>
            </View>
            <View style={[s.donutLegendSep, { backgroundColor: colors.border }]} />
            <View style={s.donutLegendItem}>
              <View style={[s.donutLegendDot, { backgroundColor: "#10B981" }]} />
              <View>
                <Text style={[s.donutLegendLabel, { color: colors.text }]}>Dépôts</Text>
                <Text style={[s.donutLegendVal, { color: "#10B981" }]}>{a.percentCredit}% · {fmt(a.creditAmount)} XOF</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stacked bar */}
        <View style={[s.stackBar, { backgroundColor: "#EF444420" }]}>
          <View style={[s.stackFill, { width: `${a.percentDebit}%`, backgroundColor: "#EF4444" }]} />
        </View>
        <View style={[s.stackBar, { backgroundColor: "#10B98120", marginTop: 6 }]}>
          <View style={[s.stackFill, { width: `${a.percentCredit}%`, backgroundColor: "#10B981" }]} />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16 },

  loadingCard: { borderRadius: 20, padding: 40, alignItems: "center", gap: 14, borderWidth: 1 },
  loadingText: { fontSize: 14, fontWeight: "500" },

  refreshRow: {
    flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-end",
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16,
  },
  refreshText: { fontSize: 13, fontWeight: "600" },

  // Hero
  heroCard: {
    borderRadius: 24, padding: 24, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 8,
  },
  heroEyebrow: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  heroAmount: { color: "#fff", fontSize: 36, fontWeight: "800", letterSpacing: -1 },
  heroCurrency: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2, marginBottom: 20 },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, alignItems: "center", gap: 4 },
  heroStatVal: { color: "#fff", fontSize: 14, fontWeight: "700" },
  heroStatLbl: { color: "rgba(255,255,255,0.6)", fontSize: 10 },
  heroSep: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },

  // Split card
  splitCard: {
    borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },
  splitHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 },
  splitTitle: { fontSize: 15, fontWeight: "700" },
  splitSub: { fontSize: 11 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barDot: { width: 8, height: 8, borderRadius: 4 },
  barLabel: { fontSize: 13, fontWeight: "600", width: 50 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barPct: { fontSize: 13, fontWeight: "700", width: 38, textAlign: "right" },
  biBar: { flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden", marginTop: 18 },
  biLeft: { backgroundColor: "#EF4444" },
  biRight: { backgroundColor: "#10B981" },
  biLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  biLabelText: { fontSize: 11, fontWeight: "600" },

  // Pills
  pillRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  pill: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 4, borderWidth: 1 },
  pillNum: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  pillLbl: { fontSize: 10, fontWeight: "600" },

  // Charts
  chartCard: {
    borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },
  chartTitle: { fontSize: 15, fontWeight: "700" },
  chartSub: { fontSize: 11, marginTop: 2 },

  // Custom bar chart
  customBarWrap: { flexDirection: "row", alignItems: "flex-end", marginTop: 20, height: 180 },
  customBarItem: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" },
  customBarAmt: { fontSize: 12, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  customBarTrack: { width: 48, height: 120, justifyContent: "flex-end", borderRadius: 8, overflow: "hidden", backgroundColor: "transparent" },
  customBarFill: { width: "100%", borderRadius: 8 },
  customBarLabel: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginTop: 10 },
  customBarLabelText: { fontSize: 11, fontWeight: "700" },
  customBarCount: { fontSize: 10, marginTop: 4 },
  customBarDivider: { width: 1, height: 120, marginBottom: 44 },

  // Donut
  donutWrap: { flexDirection: "row", alignItems: "center", marginTop: 18, gap: 20 },
  donutLeft: { alignItems: "center", justifyContent: "center" },
  donutOuter: { width: 100, height: 100, borderRadius: 50, borderWidth: 12, justifyContent: "center", alignItems: "center" },
  donutInner: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  donutPct: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  donutPctLbl: { fontSize: 9, fontWeight: "600", marginTop: 1 },
  donutLegend: { flex: 1, gap: 12 },
  donutLegendItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  donutLegendDot: { width: 10, height: 10, borderRadius: 5 },
  donutLegendLabel: { fontSize: 13, fontWeight: "600" },
  donutLegendVal: { fontSize: 11, fontWeight: "500", marginTop: 1 },
  donutLegendSep: { height: 1, opacity: 0.4 },
  stackBar: { height: 6, borderRadius: 3, overflow: "hidden", marginTop: 16 },
  stackFill: { height: "100%", borderRadius: 3 },
});

export default AnalyticsScreen;
