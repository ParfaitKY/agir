import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { secureGetItem } from "../../../shared/utils/secureStorage";
import { dernieresOperationsClient } from "../../../services/compte/dernieresOperationsClient";
import { EmptyState } from "../../../shared/components/EmptyState";

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterKey = "toutes" | "entrees" | "sorties";

interface TxItem {
  id: string;
  title: string;
  amountText: string;
  amountNum: number;
  date: string;
  rawDate: string;
  type: "entree" | "sortie";
  status: string;
  MC_NUMPIECE?: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonBox: React.FC<{ width?: any; height?: number; radius?: number; style?: any }> = ({
  width = "100%", height = 16, radius = 8, style,
}) => {
  const anim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: "#E0E0E0", opacity: anim }, style]} />;
};

const TransactionSkeleton: React.FC<{ colors: any }> = ({ colors }) => (
  <View>
    {/* Filter skeleton */}
    <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 16, marginTop: 8 }}>
      {[70, 90, 90].map((w, i) => <SkeletonBox key={i} width={w} height={36} radius={18} />)}
    </View>
    {/* Rows skeleton */}
    {[1, 2, 3, 4, 5].map(i => (
      <View key={i} style={[sk.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonBox width={44} height={44} radius={22} />
        <View style={{ flex: 1, marginLeft: 12, gap: 7 }}>
          <SkeletonBox width="65%" height={13} radius={6} />
          <SkeletonBox width="40%" height={11} radius={5} />
        </View>
        <View style={{ alignItems: "flex-end", gap: 7 }}>
          <SkeletonBox width={90} height={14} radius={6} />
          <SkeletonBox width={50} height={10} radius={5} />
        </View>
      </View>
    ))}
  </View>
);

const sk = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 14, borderWidth: 1 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseNum = (s: any) => Number(String(s ?? "0").replace(/[,"\s]/g, ""));
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

/** Retourne icône + couleur de fond selon le libellé */
const getTxMeta = (title: string, type: "entree" | "sortie", colors: any) => {
  const up = title.toUpperCase();
  if (up.includes("VIREMENT") || up.includes("TRANSFER"))
    return { icon: "swap-horizontal", bg: colors.primary + "20", color: colors.primary };
  if (up.includes("RETRAIT") || up.includes("CASH"))
    return { icon: "cash-outline", bg: colors.warning + "20", color: colors.warning };
  if (up.includes("DEPOT") || up.includes("DÉPÔT"))
    return { icon: "arrow-down-circle-outline", bg: colors.success + "20", color: colors.success };
  if (up.includes("OUVERTURE"))
    return { icon: "folder-open-outline", bg: "#8B5CF620", color: "#8B5CF6" };
  if (up.includes("FRAIS") || up.includes("COMMISSION"))
    return { icon: "receipt-outline", bg: colors.error + "15", color: colors.error };
  if (up.includes("SALAIRE") || up.includes("PAIE"))
    return { icon: "briefcase-outline", bg: colors.success + "20", color: colors.success };
  if (type === "entree")
    return { icon: "arrow-down-circle-outline", bg: colors.success + "20", color: colors.success };
  return { icon: "arrow-up-circle-outline", bg: colors.error + "15", color: colors.error };
};

/** Formate une date brute en label lisible */
const formatDate = (raw: string) => {
  if (!raw) return "";
  // formats: DD/MM/YYYY or YYYY-MM-DD or DD/MM/YYYY HH:MM:SS
  const clean = raw.split(" ")[0];
  const parts = clean.includes("/") ? clean.split("/") : clean.split("-");
  if (parts.length !== 3) return raw;
  const [a, b, c] = parts;
  // detect YYYY-MM-DD vs DD/MM/YYYY
  const day = a.length === 4 ? c : a;
  const month = a.length === 4 ? b : b;
  const year = a.length === 4 ? a : c;
  const months = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];
  const mIdx = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${months[mIdx] ?? month} ${year}`;
};

/** Groupe les transactions par date */
const groupByDate = (items: TxItem[]) => {
  const map = new Map<string, TxItem[]>();
  items.forEach(it => {
    const key = it.rawDate.split(" ")[0] || "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  });
  return Array.from(map.entries()).map(([date, txs]) => ({ date, txs }));
};

// ─── Main component ───────────────────────────────────────────────────────────
export const TransactionsScreen: React.FC = () => {
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [activeFilter, setActiveFilter] = useState<FilterKey>("toutes");
  const [items, setItems] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const clientId = await secureGetItem("client_id");
      const token = await secureGetItem("auth_token");
      const agency = (await secureGetItem("user_agency")) || "1000";
      const accountCode = (await secureGetItem("user_account_number")) || "";

      if (!token) { 
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        setRefreshing(false);
        return; 
      }

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();

      const result: any = await dernieresOperationsClient(
        {
          AG_CODEAGENCE: String(agency).replace(/\D/g, ""),
          ...(accountCode ? { CO_CODECOMPTE: String(accountCode).replace(/\D/g, "") } : {}),
          ...(clientId ? { CLIENT_ID: clientId } : {}),
          CODECRYPTAGE: "Y}@128eVIXfoi7",
          DateDebut: "01/01/2000",
          DateFin: `${dd}/${mm}/${yyyy}`,
          Nombretransactions: "50",
        } as any,
        { Authorization: `Bearer ${token}` },
      );

      if (result?.error) {
        const err: any = result.error;
        const errorMsg = err?.response?.data?.message || err?.message || "Erreur lors du chargement des transactions";
        setError(errorMsg);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const payload = result?.data;
      const arr = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.operations)
          ? payload.data.operations
          : Array.isArray(payload?.operations)
            ? payload.operations
            : [];

      const normalized: TxItem[] = arr.map((r: any, idx: number) => {
        let debit = parseNum(r?.MC_MONTANTDEBIT);
        let credit = parseNum(r?.MC_MONTANTCREDIT);
        const title = String(r?.MC_LIBELLEOPERATION ?? "Opération");

        if (title.toUpperCase().includes("OUVERTURE") && credit > 0 && debit === 0) {
          debit = credit; credit = 0;
        }

        let type: "entree" | "sortie" =
          r?.MC_SENS === "C" ? "entree" : r?.MC_SENS === "D" ? "sortie" : credit > 0 ? "entree" : "sortie";

        if (title.toUpperCase().includes("OUVERTURE")) type = "sortie";
        if (type === "entree" && credit === 0 && debit > 0) type = "sortie";
        else if (type === "sortie" && debit === 0 && credit > 0) type = "entree";

        const num = type === "entree" ? credit : debit;
        const rawDate = String(r?.MC_DATEPIECE ?? r?.MC_DATESAISIE ?? "");

        return {
          id: String(r?.MC_NUMSEQUENCE ?? idx),
          title,
          amountText: `${type === "entree" ? "+" : "-"}${fmt(num)} XOF`,
          amountNum: num,
          date: formatDate(rawDate),
          rawDate,
          type,
          status: t("common.success"),
          MC_NUMPIECE: r?.MC_NUMPIECE,
        };
      });

      // Deduplication
      const seenPieces = new Set<string>();
      const seenMirrors = new Set<string>();
      const unique = normalized.filter((item) => {
        const np = String(item.MC_NUMPIECE || "").trim();
        if (np) { if (seenPieces.has(np)) return false; seenPieces.add(np); }
        const mk = `${item.title}_${item.rawDate.split(" ")[0]}_${item.amountNum}`;
        if (seenMirrors.has(mk)) return false;
        seenMirrors.add(mk);
        return true;
      });

      setItems(unique);
    } catch (e: any) {
      console.error("[TransactionsScreen] Error loading transactions:", e);
      setError(e?.message || "Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: colors.card, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
      headerLeft: () => (
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={{ marginLeft: 8, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text + "45", letterSpacing: 1.5, textTransform: "uppercase" }}>Historique</Text>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: -0.3 }}>Transactions</Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => load()} style={{ marginRight: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="refresh-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, load]);



  const filtered = items.filter(it =>
    activeFilter === "toutes" ? true : activeFilter === "entrees" ? it.type === "entree" : it.type === "sortie"
  );
  const grouped = groupByDate(filtered);

  const FILTERS: { key: FilterKey; label: string; icon: string; color?: string }[] = [
    { key: "toutes", label: t("transactions.filter.all"), icon: "list-outline" },
    { key: "entrees", label: t("transactions.filter.in"), icon: "trending-up", color: colors.success },
    { key: "sorties", label: t("transactions.filter.out"), icon: "trending-down", color: colors.error },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <TransactionSkeleton colors={colors} />
        ) : (
          <>
            {/* ── Stats summary ── */}
            {items.length > 0 && (() => {
              const totalIn  = items.filter(x => x.type === "entree").reduce((a, x) => a + x.amountNum, 0);
              const totalOut = items.filter(x => x.type === "sortie").reduce((a, x) => a + x.amountNum, 0);
              const countIn  = items.filter(x => x.type === "entree").length;
              const countOut = items.filter(x => x.type === "sortie").length;
              return (
                <View style={styles.statsRowCompact}>
                  <View style={[styles.statCompact, { borderLeftColor: colors.success }]}>
                    <View style={styles.statCompactRow}>
                      <Ionicons name="arrow-down" size={14} color={colors.success} />
                      <Text style={[styles.statCompactLabel, { color: colors.text + "60" }]}>Entrées</Text>
                    </View>
                    <Text style={[styles.statCompactAmount, { color: colors.success }]}>+{fmt(totalIn)}</Text>
                    <Text style={[styles.statCompactCount, { color: colors.text + "40" }]}>{countIn} op.</Text>
                  </View>
                  
                  <View style={[styles.statCompact, { borderLeftColor: colors.error }]}>
                    <View style={styles.statCompactRow}>
                      <Ionicons name="arrow-up" size={14} color={colors.error} />
                      <Text style={[styles.statCompactLabel, { color: colors.text + "60" }]}>Sorties</Text>
                    </View>
                    <Text style={[styles.statCompactAmount, { color: colors.error }]}>-{fmt(totalOut)}</Text>
                    <Text style={[styles.statCompactCount, { color: colors.text + "40" }]}>{countOut} op.</Text>
                  </View>
                  
                  <View style={[styles.statCompact, { borderLeftColor: colors.primary }]}>
                    <View style={styles.statCompactRow}>
                      <Ionicons name="list" size={14} color={colors.primary} />
                      <Text style={[styles.statCompactLabel, { color: colors.text + "60" }]}>Total</Text>
                    </View>
                    <Text style={[styles.statCompactAmount, { color: colors.primary }]}>{items.length}</Text>
                    <Text style={[styles.statCompactCount, { color: colors.text + "40" }]}>transactions</Text>
                  </View>
                </View>
              );
            })()}

            {/* ── Filters ── */}
            <View style={styles.filtersRow}>
              {FILTERS.map(({ key, label, icon, color }) => {
                const active = activeFilter === key;
                const accentColor = color ?? colors.primary;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.chip, { backgroundColor: active ? accentColor : colors.card, borderColor: active ? accentColor : colors.border }]}
                    onPress={() => setActiveFilter(key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={icon as any} size={14} color={active ? "#fff" : accentColor} />
                    <Text style={[styles.chipText, { color: active ? "#fff" : colors.text + "80" }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Error ── */}
            {!!error && <EmptyState type="error" message={error} onRetry={() => load()} style={{ marginTop: 20 }} />}

            {/* ── Grouped list ── */}
            {!error && grouped.length === 0 && (
              <EmptyState
                type="empty"
                message={`${t("transactions.empty.none")} ${activeFilter === "entrees" ? t("transactions.empty.inSuffix") : activeFilter === "sorties" ? t("transactions.empty.outSuffix") : ""}`}
                style={{ marginTop: 40 }}
              />
            )}

            {grouped.map(({ date, txs }) => (
              <View key={date}>
                {/* Date separator */}
                <View style={styles.dateSep}>
                  <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dateLabel, { color: colors.text + "55", backgroundColor: colors.background }]}>
                    {formatDate(date)}
                  </Text>
                  <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                </View>

                {txs.map((tx, i) => {
                  const meta = getTxMeta(tx.title, tx.type, colors);
                  return (
                    <View
                      key={tx.id}
                      style={[
                        styles.txCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        i === txs.length - 1 && { marginBottom: 4 },
                      ]}
                    >
                      {/* Left accent */}
                      <View style={[styles.txAccent, { backgroundColor: meta.color }]} />

                      {/* Icon */}
                      <View style={[styles.txIcon, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                      </View>

                      {/* Info */}
                      <View style={styles.txInfo}>
                        <Text style={[styles.txTitle, { color: colors.text }]} numberOfLines={1}>
                          {tx.title}
                        </Text>
                        <View style={styles.txMeta}>
                          <View style={[styles.txStatusDot, { backgroundColor: colors.success }]} />
                          <Text style={[styles.txStatus, { color: colors.text + "50" }]}>{tx.status}</Text>
                        </View>
                      </View>

                      {/* Amount */}
                      <View style={styles.txRight}>
                        <Text style={[styles.txAmount, { color: tx.type === "entree" ? colors.success : colors.error }]}>
                          {tx.amountText}
                        </Text>
                        <View style={[styles.txTypeBadge, { backgroundColor: tx.type === "entree" ? colors.success + "15" : colors.error + "12" }]}>
                          <Text style={[styles.txTypeBadgeText, { color: tx.type === "entree" ? colors.success : colors.error }]}>
                            {tx.type === "entree" ? tText("Crédit") : tText("Débit")}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Hero
  hero: {
    margin: 16, borderRadius: 24, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.18, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 7,
  },
  heroEyebrow: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },
  heroAmount: { color: "#fff", fontSize: 38, fontWeight: "800", letterSpacing: -1.5, marginTop: 6 },
  heroCurrency: { color: "rgba(255,255,255,0.65)", fontSize: 14, marginTop: 2, marginBottom: 20 },
  heroCards: { flexDirection: "row", gap: 10 },
  heroCard: { flex: 1, borderRadius: 14, padding: 12 },
  heroCardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  heroCardIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  heroCardLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" },
  heroCardAmount: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: -0.5 },
  heroCardCurrency: { color: "rgba(255,255,255,0.55)", fontSize: 10, marginTop: 2 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 16, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroBadgeText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600" },

  // Filters
  filtersRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 8, marginTop: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "600" },

  // Date separator
  dateSep: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginVertical: 10 },
  dateLine: { flex: 1, height: 1 },
  dateLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, paddingHorizontal: 10 },

  // Transaction card
  txCard: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 16, borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },
  txAccent: { width: 3, alignSelf: "stretch" },
  txIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginLeft: 12, marginVertical: 14 },
  txInfo: { flex: 1, marginLeft: 12, marginVertical: 14 },
  txTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.1, marginBottom: 5 },
  txMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  txStatusDot: { width: 5, height: 5, borderRadius: 3 },
  txStatus: { fontSize: 11 },
  txRight: { alignItems: "flex-end", marginRight: 14, marginVertical: 14 },
  txAmount: { fontSize: 14, fontWeight: "800", letterSpacing: -0.3, marginBottom: 5 },
  txTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  txTypeBadgeText: { fontSize: 10, fontWeight: "700" },

  // Stats summary - Compact version
  statsRowCompact: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 12, marginBottom: 8 },
  statCompact: {
    flex: 1, 
    borderLeftWidth: 3, 
    paddingLeft: 10, 
    paddingVertical: 8,
  },
  statCompactRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  statCompactLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  statCompactAmount: { fontSize: 15, fontWeight: "800", letterSpacing: -0.5, marginBottom: 2 },
  statCompactCount: { fontSize: 9, fontWeight: "500" },

  // Old stats (kept for reference, can be removed)
  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 12, marginBottom: 4 },
  statCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, gap: 6,
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  statIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statTexts: { gap: 1 },
  statLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  statAmount: { fontSize: 13, fontWeight: "800", letterSpacing: -0.3 },
  statCount: { fontSize: 10 },
});
