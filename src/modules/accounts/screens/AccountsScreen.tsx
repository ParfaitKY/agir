import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useCompteStatistiques } from "../../../domain/compte/useCompteStatistiques";
import { EmptyState } from "../../../shared/components/EmptyState";

type FilterKey = "tous" | "ordinaire" | "projet" | "dat" | "credit";

export const AccountsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [filter, setFilter] = useState<FilterKey>("tous");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const { data: compteStats, isLoading, error, fetchData } = useCompteStatistiques();

  React.useEffect(() => { fetchData(); }, []);
  React.useEffect(() => {
    const unsub = (navigation as any).addListener("focus", () => fetchData());
    return unsub;
  }, [navigation]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: colors.card, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 8, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text + "45", letterSpacing: 1.5, textTransform: "uppercase" }}>Finances</Text>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: -0.3 }}>Mes Comptes</Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={fetchData} style={{ marginRight: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="refresh-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const parseAmount = (s: string) => Number(String(s).replace(/\s/g, ""));

  const rawAccounts = (compteStats?.COMPTES ?? []).map((c, idx) => {
    const type = String(c.CO_INTITULECOMPTE ?? "").toUpperCase();
    const productLabel = String(c.PD_LIBELLE ?? "").toUpperCase();
    const isEpargne = type.includes("EPARGNE");
    const color = isEpargne ? colors.success : colors.primary;
    const cleanNumber = String(c.NUMEROCOMPTE ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return {
      id: c.id ?? idx, type, productLabel,
      CO_CODECOMPTE: String(c.CO_CODECOMPTE ?? ""),
      number: cleanNumber,
      balance: String(c.SOLDE ?? c.SOLDE_GLOBAL ?? 0),
      blocked: Number(c.MONTANTBLOQUE ?? 0),
      currency: "XOF",
      active: !c.CO_DATECLOTURE || String(c.CO_DATECLOTURE).includes("1900"),
      color, duration: c.duration || "24 mois", nextDueDate: c.nextDueDate || "—",
    } as any;
  });

  const accounts = Array.from(new Map(rawAccounts.map((a: any) => [a.number, a])).values()) as any[];
  const portfolioTotal = accounts.reduce((s, a) => s + parseAmount(a.balance), 0);
  const blockedTotal = (compteStats?.COMPTES ?? []).reduce((s: number, c: any) => s + Number(c?.MONTANTBLOQUE || 0), 0);
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

  const FILTERS: { key: FilterKey; label: string; icon: string }[] = [
    { key: "tous", label: "Tous", icon: "apps-outline" },
    { key: "ordinaire", label: "Ordinaire", icon: "wallet-outline" },
    { key: "projet", label: "Projet", icon: "construct-outline" },
    { key: "dat", label: "DAT", icon: "time-outline" },
    { key: "credit", label: "Crédit", icon: "cash-outline" },
  ];

  const isCredit = (a: any) =>
    ["CREDIT","PRET","CRÉDIT","PRÊT"].some(k => a.type.includes(k) || a.productLabel.includes(k));

  const filtered = accounts.filter((a) => {
    const type = a.type.toUpperCase();
    if (filter === "ordinaire") return (type.includes("COURANT") || type.includes("EPARGNE")) && !type.includes("PROJET") && !type.includes("DAT") && !type.includes("TERME");
    if (filter === "projet") return type.includes("PROJET");
    if (filter === "dat") return type.includes("DAT") || type.includes("TERME");
    if (filter === "credit") return isCredit(a);
    return true;
  });

  return (
    <ScrollView
      style={[s.root, { backgroundColor: colors.background }]}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Portfolio hero ── */}
      <View style={[s.hero, { backgroundColor: colors.primary }]}>
        <Text style={s.heroEyebrow}>PORTEFEUILLE TOTAL</Text>
        <Text style={s.heroAmount}>{fmt(portfolioTotal)}</Text>
        <Text style={s.heroCurrency}>XOF</Text>

        <View style={s.heroStats}>
          <View style={s.heroStat}>
            <Ionicons name="layers-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={s.heroStatVal}>{compteStats?.NOMBRE_COMPTES ?? accounts.length}</Text>
            <Text style={s.heroStatLbl}>Comptes</Text>
          </View>
          <View style={s.heroSep} />
          <View style={s.heroStat}>
            <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={s.heroStatVal}>{fmt(blockedTotal)}</Text>
            <Text style={s.heroStatLbl}>Bloqué (XOF)</Text>
          </View>
          <View style={s.heroSep} />
          <View style={s.heroStat}>
            <Ionicons name="checkmark-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={s.heroStatVal}>{accounts.filter(a => a.active).length}</Text>
            <Text style={s.heroStatLbl}>Actifs</Text>
          </View>
        </View>
      </View>

      {/* ── Filters ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
        {FILTERS.map(({ key, label, icon }) => {
          const active = filter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[s.chip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
              onPress={() => setFilter(key)}
              activeOpacity={0.8}
            >
              <Ionicons name={icon as any} size={14} color={active ? "#fff" : colors.text + "70"} />
              <Text style={[s.chipText, { color: active ? "#fff" : colors.text + "80" }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Section title ── */}
      <View style={s.sectionRow}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>{t("accounts.list")}</Text>
        <Text style={[s.sectionCount, { color: colors.text + "50" }]}>{filtered.length} compte{filtered.length > 1 ? "s" : ""}</Text>
      </View>

      {/* ── States ── */}
      {isLoading && (
        <View style={s.loadingRow}>
          {[1,2].map(i => (
            <View key={i} style={[s.skeleton, { backgroundColor: colors.card, borderColor: colors.border }]} />
          ))}
        </View>
      )}
      {!!error && <EmptyState type="error" message={String(error)} onRetry={fetchData} style={{ marginTop: 20 }} />}
      {!isLoading && !error && accounts.length === 0 && <EmptyState type="empty" message="Aucun compte trouvé" style={{ marginTop: 20 }} />}

      {/* ── Account cards ── */}
      {filtered.map((a) => {
        const credit = isCredit(a);
        const pct = portfolioTotal > 0 ? Math.round((parseAmount(a.balance) / portfolioTotal) * 100) : 0;
        const expanded = expandedId === a.id;

        return (
          <TouchableOpacity
            key={a.id}
            style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.85}
            onPress={() => {
              if (credit) { setExpandedId(expanded ? null : a.id); }
              else { (navigation as any).navigate("AccountDetails", { account: a, sharePct: pct, total: portfolioTotal }); }
            }}
          >
            {/* Left accent */}
            <View style={[s.cardAccent, { backgroundColor: a.color }]} />

            <View style={s.cardBody}>
              {/* Top row */}
              <View style={s.cardTop}>
                <View style={[s.cardIconWrap, { backgroundColor: a.color + "18" }]}>
                  <Ionicons name={a.type.includes("COURANT") ? "briefcase-outline" : "wallet-outline"} size={20} color={a.color} />
                </View>
                <View style={s.cardTitleWrap}>
                  <Text style={[s.cardType, { color: colors.text }]} numberOfLines={1}>
                    {a.type.includes("COURANT") ? "COMPTE ORDINAIRE" : tText(a.type)}
                  </Text>
                  <Text style={[s.cardNumber, { color: colors.text + "50" }]}>{a.number}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: a.active ? colors.success + "15" : colors.error + "15" }]}>
                  <View style={[s.statusDot, { backgroundColor: a.active ? colors.success : colors.error }]} />
                  <Text style={[s.statusText, { color: a.active ? colors.success : colors.error }]}>
                    {a.active ? t("accounts.status.active") : tText("Clôturé")}
                  </Text>
                </View>
              </View>

              {/* Balance */}
              <View style={s.balanceRow}>
                <View>
                  <Text style={[s.balanceLabel, { color: colors.text + "50" }]}>
                    {credit ? "Solde à rembourser" : t("accounts.balance.available")}
                  </Text>
                  <View style={s.balanceAmountRow}>
                    <Text style={[s.balanceAmount, { color: colors.text }]}>{fmt(parseAmount(a.balance))}</Text>
                    <Text style={[s.balanceCurrency, { color: a.color }]}> {a.currency}</Text>
                  </View>
                  {a.blocked > 0 && (
                    <View style={s.blockedRow}>
                      <Ionicons name="lock-closed" size={11} color={colors.warning} />
                      <Text style={[s.blockedText, { color: colors.warning }]}>
                        {fmt(a.blocked)} {a.currency} bloqué
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[s.transferBtn, { backgroundColor: a.color }]}
                  onPress={() => (navigation as any).navigate("Transfer", { account: a })}
                  activeOpacity={0.85}
                >
                  <Ionicons name="swap-horizontal" size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Progress bar */}
              {!credit && (
                <View style={s.progressWrap}>
                  <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
                    <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: a.color }]} />
                  </View>
                  <Text style={[s.progressText, { color: colors.text + "45" }]}>{pct}% du portefeuille</Text>
                </View>
              )}

              {/* Credit expanded */}
              {credit && expanded && (
                <View style={[s.creditExpanded, { borderTopColor: colors.border }]}>
                  {[
                    { label: "Durée du crédit", value: a.duration },
                    { label: "Prochaine échéance", value: a.nextDueDate },
                    { label: "Montant restant", value: `${fmt(parseAmount(a.balance))} ${a.currency}`, highlight: true },
                  ].map((row, i) => (
                    <View key={i} style={s.creditRow}>
                      <Text style={[s.creditLabel, { color: colors.text + "60" }]}>{row.label}</Text>
                      <Text style={[s.creditValue, { color: row.highlight ? colors.primary : colors.text }]}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Credit chevron */}
              {credit && (
                <View style={s.chevronRow}>
                  <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.text + "40"} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 40 },

  // Hero
  hero: {
    margin: 16, borderRadius: 24, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.18, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 7,
  },
  heroEyebrow: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },
  heroAmount: { color: "#fff", fontSize: 38, fontWeight: "800", letterSpacing: -1.5, marginTop: 6 },
  heroCurrency: { color: "rgba(255,255,255,0.65)", fontSize: 14, marginTop: 2, marginBottom: 20 },
  heroStats: { flexDirection: "row", alignItems: "center", paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  heroStat: { flex: 1, alignItems: "center", gap: 3 },
  heroStatVal: { color: "#fff", fontSize: 14, fontWeight: "700" },
  heroStatLbl: { color: "rgba(255,255,255,0.6)", fontSize: 10 },
  heroSep: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" },

  // Filters
  filtersRow: { paddingHorizontal: 16, paddingBottom: 4, gap: 8, paddingTop: 4 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "600" },

  // Section
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionCount: { fontSize: 12 },

  // Loading skeleton
  loadingRow: { paddingHorizontal: 16, gap: 12 },
  skeleton: { height: 130, borderRadius: 20, borderWidth: 1 },

  // Account card
  card: {
    flexDirection: "row", marginHorizontal: 16, marginBottom: 12,
    borderRadius: 20, borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3,
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  cardTitleWrap: { flex: 1 },
  cardType: { fontSize: 13, fontWeight: "700", letterSpacing: 0.2 },
  cardNumber: { fontSize: 11, marginTop: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },

  // Balance
  balanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  balanceLabel: { fontSize: 11, marginBottom: 3 },
  balanceAmountRow: { flexDirection: "row", alignItems: "baseline" },
  balanceAmount: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  balanceCurrency: { fontSize: 14, fontWeight: "700" },
  blockedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  blockedText: { fontSize: 11, fontWeight: "600" },
  transferBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.12, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 3 },

  // Progress
  progressWrap: { marginTop: 14 },
  progressTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 10, marginTop: 4, textAlign: "right" },

  // Credit expanded
  creditExpanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, gap: 8 },
  creditRow: { flexDirection: "row", justifyContent: "space-between" },
  creditLabel: { fontSize: 13 },
  creditValue: { fontSize: 13, fontWeight: "600" },
  chevronRow: { alignItems: "center", marginTop: 8 },
});
