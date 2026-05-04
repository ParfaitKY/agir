import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useDernieresOperationsClient } from "../../../domain/compte/useDernieresOperationsClient";
import { useCompteStatistiques } from "../../../domain/compte/useCompteStatistiques";
import { useAnalyseDerniereTransaction } from "../../../domain/compte/useAnalyseDerniereTransaction";

export const AnalyticsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);

  // ── Sources de données serveur ──────────────────────────────────────────
  const {
    data: analyseData,
    isLoading: loadingAnalyse,
    fetchData: fetchAnalyse,
  } = useAnalyseDerniereTransaction(50);

  const {
    data: compteStats,
    isLoading: loadingStats,
    fetchData: fetchStats,
  } = useCompteStatistiques();

  const {
    operations,
    isLoading: loadingOps,
    fetchData: fetchOps,
  } = useDernieresOperationsClient(50);

  const isLoading = loadingAnalyse || loadingStats || loadingOps;

  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAnalyse(), fetchStats(), fetchOps()]);
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    refresh();
  }, []);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: colors.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 8, padding: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.text + "45",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            Tableau de bord
          </Text>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "800",
              color: colors.text,
              letterSpacing: -0.3,
            }}
          >
            Analytique
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={refresh}
          style={{
            marginRight: 12,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary + "15",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));

  // ── Données serveur (useAnalyseDerniereTransaction) ─────────────────────
  const nbCredit = analyseData?.NOMBRE_OPERATIONS_CREDIT ?? 0;
  const nbDebit = analyseData?.NOMBRE_OPERATIONS_DEBIT ?? 0;
  const nbTotal = analyseData?.NOMBRE_TOTAL_OPERATIONS ?? nbCredit + nbDebit;
  const pctCredit = analyseData?.POURCENTAGE_CREDIT ?? 0;
  const pctDebit = analyseData?.POURCENTAGE_DEBIT ?? 0;
  const sensFort = analyseData?.SENS_FORT ?? "EGAL";
  const pctSensFort = analyseData?.POURCENTAGE_SENS_FORT ?? 0;

  // ── Solde et comptes (useCompteStatistiques) ────────────────────────────
  const comptes = compteStats?.COMPTES ?? [];
  const nombreComptes = compteStats?.NOMBRE_COMPTES ?? comptes.length;
  const soldeDisponible = comptes.reduce(
    (sum, c) => sum + (Number(c.SOLDE) || 0),
    0,
  );
  const montantBloque = comptes.reduce(
    (sum, c) => sum + (Number(c.MONTANTBLOQUE) || 0),
    0,
  );
  const soldeGlobal = comptes.reduce(
    (sum, c) => sum + (Number(c.SOLDE_GLOBAL) || 0),
    0,
  );

  // ── Totaux depuis les opérations brutes ─────────────────────────────────
  let totalCredit = 0;
  let totalDebit = 0;
  (operations || []).forEach((op) => {
    totalCredit += Number(op.MC_MONTANTCREDIT || 0);
    totalDebit += Number(op.MC_MONTANTDEBIT || 0);
  });
  const totalVolume = totalCredit + totalDebit;

  // ── Couleurs selon sens fort ────────────────────────────────────────────
  const isUp = sensFort === "CREDIT";
  const isDown = sensFort === "DEBIT";
  const accentColor = isUp ? "#10B981" : isDown ? "#EF4444" : colors.primary;

  // ── Affichage pourcentages (min 1% pour visibilité) ─────────────────────
  const displayPctDebit = pctDebit > 0 && pctDebit < 1 ? 1 : Math.round(pctDebit);
  const displayPctCredit = pctCredit > 0 && pctCredit < 1 ? 1 : Math.round(pctCredit);

  if (isLoading && !analyseData && !compteStats) {
    return (
      <View
        style={[
          s.root,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <View
          style={[
            s.loadingCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.text + "60" }]}>
            Chargement des données…
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.root, { backgroundColor: colors.background }]}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* ── Hero solde ─────────────────────────────────────────────────── */}
      <View style={[s.heroCard, { backgroundColor: colors.primary }]}>
        <Text style={s.heroEyebrow}>SOLDE DISPONIBLE</Text>
        <Text style={s.heroAmount}>{fmt(soldeDisponible)}</Text>
        <Text style={s.heroCurrency}>XOF · {nombreComptes} compte{nombreComptes > 1 ? "s" : ""}</Text>

        <View style={s.heroRow}>
          <View style={s.heroStat}>
            <Ionicons name="wallet-outline" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={s.heroStatVal}>{fmt(soldeGlobal)}</Text>
            <Text style={s.heroStatLbl}>Solde global</Text>
          </View>
          <View style={s.heroSep} />
          <View style={s.heroStat}>
            <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={s.heroStatVal}>{fmt(montantBloque)}</Text>
            <Text style={s.heroStatLbl}>Bloqué</Text>
          </View>
          <View style={s.heroSep} />
          <View style={s.heroStat}>
            <Ionicons name="layers-outline" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={s.heroStatVal}>{nbTotal}</Text>
            <Text style={s.heroStatLbl}>Opérations</Text>
          </View>
        </View>
      </View>

      {/* ── Analyse serveur (SENS_FORT) ────────────────────────────────── */}
      <View
        style={[
          s.sectionCard,
          { backgroundColor: accentColor + "15", borderColor: accentColor + "40" },
        ]}
      >
        <View style={s.sectionRow}>
          <Ionicons
            name={isUp ? "trending-up" : isDown ? "trending-down" : "remove"}
            size={22}
            color={accentColor}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>
              Tendance dominante
            </Text>
            <Text style={[s.sectionSub, { color: colors.text + "70" }]}>
              Analyse serveur · {nbTotal} opérations analysées
            </Text>
          </View>
          <View style={[s.badge, { backgroundColor: accentColor }]}>
            <Text style={s.badgeText}>
              {isUp ? "ENTRÉES" : isDown ? "SORTIES" : "ÉQUILIBRÉ"}
            </Text>
          </View>
        </View>

        <View style={[s.divider, { backgroundColor: accentColor + "30" }]} />

        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: accentColor }]}>{pctSensFort}%</Text>
            <Text style={[s.statLbl, { color: colors.text + "60" }]}>Sens fort</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: "#10B981" }]}>{nbCredit}</Text>
            <Text style={[s.statLbl, { color: colors.text + "60" }]}>Entrées</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: "#EF4444" }]}>{nbDebit}</Text>
            <Text style={[s.statLbl, { color: colors.text + "60" }]}>Sorties</Text>
          </View>
        </View>
      </View>

      {/* ── Répartition flux ───────────────────────────────────────────── */}
      <View
        style={[
          s.splitCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={s.splitHeader}>
          <Text style={[s.splitTitle, { color: colors.text }]}>
            Répartition des flux
          </Text>
          <Text style={[s.splitSub, { color: colors.text + "50" }]}>
            Source : serveur
          </Text>
        </View>

        {/* Sorties */}
        <View style={s.barRow}>
          <View style={[s.barDot, { backgroundColor: "#EF4444" }]} />
          <Text style={[s.barLabel, { color: colors.text }]}>Sorties</Text>
          <View style={[s.barTrack, { backgroundColor: "#EF444420" }]}>
            <View
              style={[
                s.barFill,
                { width: `${displayPctDebit}%`, backgroundColor: "#EF4444" },
              ]}
            />
          </View>
          <Text style={[s.barPct, { color: "#EF4444" }]}>{displayPctDebit}%</Text>
        </View>

        {/* Entrées */}
        <View style={[s.barRow, { marginTop: 12 }]}>
          <View style={[s.barDot, { backgroundColor: "#10B981" }]} />
          <Text style={[s.barLabel, { color: colors.text }]}>Entrées</Text>
          <View style={[s.barTrack, { backgroundColor: "#10B98120" }]}>
            <View
              style={[
                s.barFill,
                { width: `${displayPctCredit}%`, backgroundColor: "#10B981" },
              ]}
            />
          </View>
          <Text style={[s.barPct, { color: "#10B981" }]}>{displayPctCredit}%</Text>
        </View>

        {/* Barre bicolore */}
        <View style={s.biBar}>
          <View style={[s.biLeft, { flex: Math.max(displayPctDebit, 1) }]} />
          <View style={[s.biRight, { flex: Math.max(displayPctCredit, 1) }]} />
        </View>
      </View>

      {/* ── Compteurs opérations ───────────────────────────────────────── */}
      <View style={s.pillRow}>
        <View
          style={[
            s.pill,
            { backgroundColor: "#EF444415", borderColor: "#EF444430" },
          ]}
        >
          <Ionicons name="arrow-up" size={18} color="#EF4444" />
          <Text style={[s.pillNum, { color: "#EF4444" }]}>{nbDebit}</Text>
          <Text style={[s.pillLbl, { color: "#EF444499" }]}>sorties</Text>
        </View>
        <View
          style={[
            s.pill,
            { backgroundColor: "#10B98115", borderColor: "#10B98130" },
          ]}
        >
          <Ionicons name="arrow-down" size={18} color="#10B981" />
          <Text style={[s.pillNum, { color: "#10B981" }]}>{nbCredit}</Text>
          <Text style={[s.pillLbl, { color: "#10B98199" }]}>entrées</Text>
        </View>
        <View
          style={[
            s.pill,
            {
              backgroundColor: colors.primary + "15",
              borderColor: colors.primary + "30",
            },
          ]}
        >
          <Ionicons name="layers-outline" size={18} color={colors.primary} />
          <Text style={[s.pillNum, { color: colors.primary }]}>{nbTotal}</Text>
          <Text style={[s.pillLbl, { color: colors.primary + "99" }]}>total</Text>
        </View>
      </View>

      {/* ── Volume transactions (depuis opérations brutes) ─────────────── */}
      {totalVolume > 0 && (
        <View
          style={[
            s.splitCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={s.splitHeader}>
            <Text style={[s.splitTitle, { color: colors.text }]}>
              Volume des transactions
            </Text>
            <Text style={[s.splitSub, { color: colors.text + "50" }]}>
              {operations.length} opérations
            </Text>
          </View>

          <View style={s.volumeRow}>
            {/* Sorties */}
            <View style={s.volumeItem}>
              <View style={[s.volumeBar, { backgroundColor: "#EF444420" }]}>
                <View
                  style={[
                    s.volumeBarFill,
                    {
                      height: `${totalVolume > 0 ? Math.max(4, Math.round((totalDebit / totalVolume) * 100)) : 4}%`,
                      backgroundColor: "#EF4444",
                    },
                  ]}
                />
              </View>
              <View style={[s.volumeLabel, { backgroundColor: "#EF444418" }]}>
                <Ionicons name="arrow-up" size={12} color="#EF4444" />
                <Text style={[s.volumeLabelText, { color: "#EF4444" }]}>
                  Sorties
                </Text>
              </View>
              <Text style={[s.volumeAmt, { color: "#EF4444" }]}>
                {fmt(totalDebit)} XOF
              </Text>
            </View>

            <View style={[s.volumeDivider, { backgroundColor: colors.border }]} />

            {/* Entrées */}
            <View style={s.volumeItem}>
              <View style={[s.volumeBar, { backgroundColor: "#10B98120" }]}>
                <View
                  style={[
                    s.volumeBarFill,
                    {
                      height: `${totalVolume > 0 ? Math.max(4, Math.round((totalCredit / totalVolume) * 100)) : 4}%`,
                      backgroundColor: "#10B981",
                    },
                  ]}
                />
              </View>
              <View style={[s.volumeLabel, { backgroundColor: "#10B98118" }]}>
                <Ionicons name="arrow-down" size={12} color="#10B981" />
                <Text style={[s.volumeLabelText, { color: "#10B981" }]}>
                  Entrées
                </Text>
              </View>
              <Text style={[s.volumeAmt, { color: "#10B981" }]}>
                {fmt(totalCredit)} XOF
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Détail par compte ──────────────────────────────────────────── */}
      {comptes.length > 0 && (
        <View
          style={[
            s.splitCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[s.splitHeader, { marginBottom: 12 }]}>
            <Text style={[s.splitTitle, { color: colors.text }]}>
              Détail des comptes
            </Text>
            <Text style={[s.splitSub, { color: colors.text + "50" }]}>
              {nombreComptes} compte{nombreComptes > 1 ? "s" : ""}
            </Text>
          </View>

          {comptes.map((compte, idx) => {
            const pct = Number(compte.POURCENTAGE_SOLDE || 0);
            return (
              <View key={idx}>
                {idx > 0 && (
                  <View
                    style={[
                      s.divider,
                      { backgroundColor: colors.border, marginVertical: 12 },
                    ]}
                  />
                )}
                <View style={s.compteRow}>
                  <View
                    style={[
                      s.compteIcon,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[s.compteLabel, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {compte.CO_INTITULECOMPTE || compte.PD_LIBELLE || "Compte"}
                    </Text>
                    <Text style={[s.compteNum, { color: colors.text + "60" }]}>
                      {compte.NUMEROCOMPTE || compte.CO_CODECOMPTE || ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[s.compteAmt, { color: colors.primary }]}>
                      {fmt(Number(compte.SOLDE || 0))} XOF
                    </Text>
                    {compte.MONTANTBLOQUE ? (
                      <Text style={[s.compteBloque, { color: "#EF4444" }]}>
                        -{fmt(Number(compte.MONTANTBLOQUE))} bloqué
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Barre de progression du solde */}
                <View
                  style={[
                    s.barTrack,
                    { backgroundColor: colors.primary + "15", marginTop: 8 },
                  ]}
                >
                  <View
                    style={[
                      s.barFill,
                      {
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[s.comptePct, { color: colors.text + "50" }]}>
                  {pct}% du plafond utilisé
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16 },

  loadingCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
  },
  loadingText: { fontSize: 14, fontWeight: "500", marginTop: 12 },

  // Hero
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroAmount: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  heroCurrency: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 20,
  },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, alignItems: "center", gap: 4 },
  heroStatVal: { color: "#fff", fontSize: 14, fontWeight: "700" },
  heroStatLbl: { color: "rgba(255,255,255,0.6)", fontSize: 10 },
  heroSep: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  // Section analyse
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  sectionRow: { flexDirection: "row", alignItems: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  sectionSub: { fontSize: 11, marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  divider: { height: 1, marginVertical: 12 },
  statRow: { flexDirection: "row" },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  statLbl: { fontSize: 11, marginTop: 2 },

  // Split card
  splitCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  splitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 16,
  },
  splitTitle: { fontSize: 15, fontWeight: "700" },
  splitSub: { fontSize: 11 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barDot: { width: 8, height: 8, borderRadius: 4 },
  barLabel: { fontSize: 13, fontWeight: "600", width: 50 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barPct: { fontSize: 13, fontWeight: "700", width: 38, textAlign: "right" },
  biBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 18,
  },
  biLeft: { backgroundColor: "#EF4444" },
  biRight: { backgroundColor: "#10B981" },

  // Pills
  pillRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  pill: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  pillNum: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  pillLbl: { fontSize: 10, fontWeight: "600" },

  // Volume bars
  volumeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 16,
    height: 160,
  },
  volumeItem: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  volumeBar: {
    width: 48,
    height: 100,
    justifyContent: "flex-end",
    borderRadius: 8,
    overflow: "hidden",
  },
  volumeBarFill: { width: "100%", borderRadius: 8 },
  volumeLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 10,
  },
  volumeLabelText: { fontSize: 11, fontWeight: "700" },
  volumeAmt: { fontSize: 11, fontWeight: "600", marginTop: 4 },
  volumeDivider: { width: 1, height: 100, marginBottom: 44 },

  // Comptes
  compteRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  compteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  compteLabel: { fontSize: 13, fontWeight: "700" },
  compteNum: { fontSize: 11, marginTop: 2 },
  compteAmt: { fontSize: 14, fontWeight: "800" },
  compteBloque: { fontSize: 10, marginTop: 2 },
  comptePct: { fontSize: 10, marginTop: 4 },
});

export default AnalyticsScreen;
