import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, StatusBar, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useBlocagesCompte } from "../../../domain/compte/useBlocagesCompte";
import { extractErrorMessage } from "../../../services/httpClient";
import { useDernieresOperationsClient } from "../../../domain/compte/useDernieresOperationsClient";

const { width: SW } = Dimensions.get("window");

export const AccountDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute() as any;
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showBlockModal, setShowBlockModal] = React.useState(false);
  const [blockDate, setBlockDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [blockTiers, setBlockTiers] = React.useState("");
  const [balanceVisible, setBalanceVisible] = React.useState(true);

  const accountRaw = route?.params?.account ?? {};
  const fmt = (n: any) => new Intl.NumberFormat("fr-FR").format(Number(n || 0));
  const type = String(accountRaw.CO_INTITULECOMPTE ?? accountRaw.type ?? "");
  const number = String(accountRaw.NUMEROCOMPTE ?? accountRaw.number ?? "");
  const balanceNum = Number(accountRaw.SOLDE ?? accountRaw.balance ?? 0);
  const currency = String(accountRaw.currency ?? "XOF");
  const blockedNum = Number(accountRaw.blocked ?? accountRaw.MONTANTBLOQUE ?? 0);
  const sharePctParam = Number(route?.params?.sharePct ?? NaN);
  const totalParam = Number(route?.params?.total ?? NaN);
  const pourcentage = !Number.isNaN(sharePctParam)
    ? Math.max(0, Math.min(100, sharePctParam))
    : totalParam > 0
      ? Math.max(0, Math.min(100, Math.round((balanceNum / totalParam) * 100)))
      : accountRaw.progress
        ? Math.max(0, Math.min(100, Math.round(Number(accountRaw.progress) * 100)))
        : 0;
  const isActive = !accountRaw.CO_DATECLOTURE || String(accountRaw.CO_DATECLOTURE).includes("1900");
  const agency = String(accountRaw.AG_CODEAGENCE ?? "");
  const cardColor = String(accountRaw.color ?? colors.primary);
  const categoriesRaw = route?.params?.categories ?? null;
  const limitsRaw = route?.params?.limits ?? null;
  const typeLabel = type.includes("COURANT") ? "COMPTE ORDINAIRE" : tText(type);

  const { operations: ops, fetchData: fetchOps } = useDernieresOperationsClient(10);
  React.useEffect(() => { fetchOps(); }, []);

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const palette = ["#6366F1","#10B981","#F59E0B","#06B6D4","#F43F5E","#8B5CF6","#64748B"];
  const opsDebit = (ops || []).filter((op: any) => String(op.TypeOperation || "").toUpperCase() === "DEBIT");
  const groupedBySchema: Record<string, number> = {};
  for (const op of opsDebit) {
    const code = String(op.TS_CODETYPESCHEMACOMPTABLE || t("accounts.category.other"));
    const amt = Number(op.MC_MONTANTDEBIT || 0);
    groupedBySchema[code] = (groupedBySchema[code] || 0) + (isNaN(amt) ? 0 : amt);
  }
  const entries = Object.entries(groupedBySchema);
  const totalDebit = entries.reduce((s, [, v]) => s + v, 0);
  const categories = entries.length
    ? entries.map(([code, total], idx) => ({
        label: code, color: palette[idx % palette.length],
        amount: `${fmt(total)} ${currency}`,
        percent: `${totalDebit > 0 ? Math.round((total / totalDebit) * 100) : 0}%`,
        pct: totalDebit > 0 ? Math.round((total / totalDebit) * 100) : 0,
      }))
    : Array.isArray(categoriesRaw)
      ? categoriesRaw.map((c: any, idx: number) => ({
          label: String(c?.label ?? ""), color: String(c?.color ?? palette[idx % palette.length]),
          amount: `${fmt(Number(c?.amount ?? 0))} ${currency}`,
          percent: `${Math.round(Number(c?.percent ?? 0))}%`,
          pct: Math.round(Number(c?.percent ?? 0)),
        }))
      : [];

  const dailyUsed = Number(limitsRaw?.dailyWithdrawalUsed ?? 0);
  const dailyLimit = Number(limitsRaw?.dailyWithdrawalLimit ?? 50000);
  const monthlyUsed = Number(limitsRaw?.monthlyTransferUsed ?? 0);
  const monthlyLimit = Number(limitsRaw?.monthlyTransferLimit ?? 200000);
  const dailyPct = dailyLimit > 0 ? Math.min(100, Math.round((dailyUsed / dailyLimit) * 100)) : 0;
  const monthlyPct = monthlyLimit > 0 ? Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100)) : 0;

  const { blockedCount, blockedList, blockedAmountTotal, loading: loadingBlocks, error: errorBlocks, fetchData: fetchBlocks } = useBlocagesCompte();
  React.useEffect(() => {
    const accountId = String(accountRaw.CO_CODECOMPTE ?? accountRaw.NUMEROCOMPTE ?? "");
    if (accountId) fetchBlocks(accountId);
  }, [accountRaw?.CO_CODECOMPTE, accountRaw?.NUMEROCOMPTE]);

  const formatAmt = (n: any) => `${fmt(Number(n || 0))} ${currency}`;
  const displayItem = (it: any) => ({
    type: String(it?.type || it?.TYPE || it?.MC_LIBELLEOPERATION || it?.JO_CODEJOURNAL || ""),
    date: String(it?.date || it?.BL_DATEJOURNEE || it?.MC_DATEPIECE || it?.created_at || it?.DATE || ""),
    amount: formatAmt(it?.montant ?? it?.montantBlocage ?? it?.MONTANTBLOQUE ?? it?.MC_MONTANTDEBIT ?? 0),
  });

  const ACTIONS = [
    { icon: "swap-horizontal", label: t("accounts.quick.transfer"), color: "#6366F1", onPress: () => (navigation as any).navigate("Transfer", { account: accountRaw }) },
    { icon: "download-outline", label: t("accounts.quick.topup"), color: "#10B981", onPress: () => {} },
    { icon: "document-text-outline", label: t("accounts.quick.statement"), color: "#F59E0B", onPress: () => (navigation as any).navigate("Statements") },
    { icon: "lock-closed-outline", label: t("accounts.quick.block"), color: "#F43F5E", onPress: () => setShowBlockModal(true) },
  ];

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Immersive hero header ── */}
      <View style={[s.hero, { backgroundColor: cardColor, paddingTop: insets.top + 12 }]}>
        {/* Decorative blobs */}
        <View style={s.blob1} />
        <View style={s.blob2} />
        <View style={s.blob3} />

        {/* Nav bar */}
        <View style={s.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.navBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.navTitleWrap}>
            <Text style={s.navEyebrow}>CEDAICI SA</Text>
            <Text style={s.navTitle}>{typeLabel}</Text>
          </View>
          <TouchableOpacity onPress={() => setBalanceVisible(v => !v)} style={s.navEye}>
            <Ionicons name={balanceVisible ? "eye-outline" : "eye-off-outline"} size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View style={s.heroBalance}>
          <Text style={s.heroBalanceLabel}>{t("accounts.balance.available")}</Text>
          <Text style={s.heroBalanceAmount}>
            {balanceVisible ? fmt(balanceNum) : "••••••"}
          </Text>
          <Text style={s.heroBalanceCurrency}>{currency}</Text>
        </View>

        {/* Account number + status */}
        <View style={s.heroFooter}>
          <View style={s.heroNumberWrap}>
            <Ionicons name="card-outline" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={s.heroNumber}>{number.replace(/(.{4})/g, "$1 ").trim()}</Text>
          </View>
          <View style={[s.heroBadge, { backgroundColor: isActive ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)" }]}>
            <View style={[s.heroBadgeDot, { backgroundColor: isActive ? "#4ADE80" : "#F87171" }]} />
            <Text style={[s.heroBadgeText, { color: isActive ? "#4ADE80" : "#F87171" }]}>
              {isActive ? t("accounts.status.active") : "Clôturé"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── Quick actions ── */}
        <View style={[s.actionsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ACTIONS.map((a, i) => (
            <TouchableOpacity
              key={a.label}
              style={[s.actionItem, i < ACTIONS.length - 1 && { borderRightWidth: 1, borderRightColor: colors.border }]}
              onPress={a.onPress}
              activeOpacity={0.7}
            >
              <View style={[s.actionIcon, { backgroundColor: a.color + "18" }]}>
                <Ionicons name={a.icon as any} size={20} color={a.color} />
              </View>
              <Text style={[s.actionLabel, { color: colors.text + "90" }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Stats strip ── */}
        <View style={s.statsStrip}>
          {[
            { icon: "wallet-outline", color: "#6366F1", val: balanceVisible ? fmt(Math.max(0, balanceNum)) : "••••", lbl: "Solde dispo." },
            { icon: "lock-closed-outline", color: "#F43F5E", val: fmt(blockedAmountTotal || blockedNum), lbl: "Bloqué" },
            { icon: "pie-chart-outline", color: "#10B981", val: `${pourcentage}%`, lbl: "Portefeuille" },
          ].map((k, i) => (
            <View key={i} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[s.statIconWrap, { backgroundColor: k.color + "15" }]}>
                <Ionicons name={k.icon as any} size={16} color={k.color} />
              </View>
              <Text style={[s.statVal, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{k.val}</Text>
              <Text style={[s.statLbl, { color: colors.text + "55" }]}>{k.lbl}</Text>
            </View>
          ))}
        </View>

        {/* ── Limits ── */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <View style={[s.sectionDot, { backgroundColor: "#6366F1" }]} />
            <Text style={[s.sectionTitle, { color: colors.text }]}>{t("accounts.limits.title")}</Text>
          </View>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { label: t("accounts.limits.dailyWithdrawal"), used: dailyUsed, limit: dailyLimit, pct: dailyPct, color: "#6366F1" },
              { label: t("accounts.limits.monthlyTransfer"), used: monthlyUsed, limit: monthlyLimit, pct: monthlyPct, color: "#10B981" },
            ].map((lim, i) => (
              <View key={i} style={[s.limitRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={s.limitTop}>
                  <Text style={[s.limitLabel, { color: colors.text }]}>{lim.label}</Text>
                  <Text style={[s.limitPct, { color: lim.color }]}>{lim.pct}% utilisé</Text>
                </View>
                <View style={[s.limitTrack, { backgroundColor: lim.color + "18" }]}>
                  <View style={[s.limitFill, { width: `${lim.pct}%`, backgroundColor: lim.color }]} />
                </View>
                <Text style={[s.limitAmt, { color: colors.text + "50" }]}>
                  {fmt(lim.used)} / {fmt(lim.limit)} {currency}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Categories ── */}
        {categories.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <View style={[s.sectionDot, { backgroundColor: "#F59E0B" }]} />
              <Text style={[s.sectionTitle, { color: colors.text }]}>{t("accounts.expensesByCategory.title")}</Text>
            </View>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {categories.map((item, idx) => (
                <View key={item.label} style={[s.catRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View style={[s.catDot, { backgroundColor: item.color }]} />
                  <View style={s.catBody}>
                    <View style={s.catTop}>
                      <Text style={[s.catLabel, { color: colors.text }]}>{item.label}</Text>
                      <Text style={[s.catAmount, { color: colors.text }]}>{item.amount}</Text>
                    </View>
                    <View style={[s.catTrack, { backgroundColor: item.color + "18" }]}>
                      <View style={[s.catFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                    </View>
                    <Text style={[s.catPct, { color: item.color }]}>{item.percent}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Blocages ── */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <View style={[s.sectionDot, { backgroundColor: "#F43F5E" }]} />
            <Text style={[s.sectionTitle, { color: colors.text }]}>Blocages du compte</Text>
            {blockedCount > 0 && (
              <View style={[s.blockedCountBadge, { backgroundColor: "#F43F5E18" }]}>
                <Text style={s.blockedCountText}>{blockedCount}</Text>
              </View>
            )}
          </View>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: blockedCount > 0 ? "#F43F5E30" : colors.border }]}>
            {loadingBlocks && (
              <View style={s.stateRow}>
                <Ionicons name="hourglass-outline" size={18} color={colors.text + "40"} />
                <Text style={[s.stateText, { color: colors.text + "50" }]}>Chargement…</Text>
              </View>
            )}
            {!!errorBlocks && !loadingBlocks && (
              <View style={s.stateRow}>
                <View style={[s.stateIconWrap, { backgroundColor: "#F43F5E18" }]}>
                  <Ionicons name="alert-circle-outline" size={18} color="#F43F5E" />
                </View>
                <Text style={[s.stateText, { color: "#F43F5E" }]}>
                  {extractErrorMessage(errorBlocks, "Impossible de charger les blocages")}
                </Text>
              </View>
            )}
            {!loadingBlocks && !errorBlocks && blockedCount === 0 && (
              <View style={s.stateRow}>
                <View style={[s.stateIconWrap, { backgroundColor: "#10B98118" }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                </View>
                <Text style={[s.stateText, { color: colors.text + "70" }]}>Aucun blocage actif</Text>
              </View>
            )}
            {!loadingBlocks && !errorBlocks && blockedCount > 0 && (
              <>
                <View style={[s.blockedTotal, { backgroundColor: "#F43F5E08", borderBottomColor: colors.border }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={[s.stateIconWrap, { backgroundColor: "#F43F5E18" }]}>
                      <Ionicons name="lock-closed" size={14} color="#F43F5E" />
                    </View>
                    <Text style={[s.blockedTotalLabel, { color: colors.text + "60" }]}>Total bloqué</Text>
                  </View>
                  <Text style={[s.blockedTotalVal, { color: "#F43F5E" }]}>{formatAmt(blockedAmountTotal)}</Text>
                </View>
                {(blockedList || []).map((it, idx) => {
                  const d = displayItem(it);
                  return (
                    <View key={idx} style={[s.blockedItem, { borderTopColor: colors.border }]}>
                      <View style={[s.blockedItemIcon, { backgroundColor: "#F59E0B18" }]}>
                        <Ionicons name="alert-circle-outline" size={14} color="#F59E0B" />
                      </View>
                      <View style={s.blockedItemBody}>
                        <Text style={[s.blockedItemType, { color: colors.text }]}>{d.type || "Blocage"}</Text>
                        <Text style={[s.blockedItemDate, { color: colors.text + "50" }]}>{d.date}</Text>
                      </View>
                      <View style={[s.blockedItemAmtWrap, { backgroundColor: "#F43F5E10" }]}>
                        <Text style={[s.blockedItemAmt, { color: "#F43F5E" }]}>{d.amount}</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        </View>

        {/* ── Account info ── */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <View style={[s.sectionDot, { backgroundColor: "#06B6D4" }]} />
            <Text style={[s.sectionTitle, { color: colors.text }]}>{t("accounts.info.title")}</Text>
          </View>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { label: t("accounts.info.accountNumber"), value: number, icon: "card-outline", color: "#6366F1" },
              { label: t("accounts.info.accountType"), value: tText(type), icon: "briefcase-outline", color: "#06B6D4" },
              { label: t("accounts.info.currency"), value: currency, icon: "cash-outline", color: "#10B981" },
              { label: t("accounts.info.status"), value: isActive ? t("accounts.status.active") : "Clôturé", icon: "pulse-outline", color: isActive ? "#10B981" : "#F43F5E", isStatus: true },
              ...(agency ? [{ label: "Agence", value: agency, icon: "business-outline", color: "#F59E0B" }] : []),
            ].map((row: any, i) => (
              <View key={i} style={[s.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[s.infoIconWrap, { backgroundColor: row.color + "15" }]}>
                  <Ionicons name={row.icon} size={15} color={row.color} />
                </View>
                <Text style={[s.infoLabel, { color: colors.text + "60", flex: 1 }]}>{row.label}</Text>
                {row.isStatus ? (
                  <View style={[s.statusPill, { backgroundColor: row.color + "15" }]}>
                    <View style={[s.statusDot, { backgroundColor: row.color }]} />
                    <Text style={[s.statusText, { color: row.color }]}>{row.value}</Text>
                  </View>
                ) : (
                  <Text style={[s.infoValue, { color: colors.text }]}>{row.value}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── Block modal ── */}
      <Modal visible={showBlockModal} transparent animationType="slide" onRequestClose={() => setShowBlockModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
            <View style={[s.modalIconCircle, { backgroundColor: "#F43F5E15" }]}>
              <Ionicons name="lock-closed" size={26} color="#F43F5E" />
            </View>
            <Text style={[s.modalTitle, { color: colors.text }]}>Bloquer le solde</Text>
            <Text style={[s.modalSub, { color: colors.text + "55" }]}>Renseignez les champs requis pour bloquer ce compte</Text>

            <Text style={[s.fieldLabel, { color: colors.text + "60" }]}>Date de journée (YYYY-MM-DD)</Text>
            <TextInput
              value={blockDate} onChangeText={setBlockDate}
              placeholder={new Date().toISOString().slice(0, 10)}
              placeholderTextColor={colors.text + "40"}
              style={[s.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            />
            <Text style={[s.fieldLabel, { color: colors.text + "60", marginTop: 12 }]}>ID tiers (optionnel)</Text>
            <TextInput
              value={blockTiers} onChangeText={setBlockTiers}
              placeholder="ID tiers"
              placeholderTextColor={colors.text + "40"}
              style={[s.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalBtnCancel, { borderColor: colors.border }]} onPress={() => setShowBlockModal(false)}>
                <Text style={[s.modalBtnCancelText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtnConfirm, { backgroundColor: "#F43F5E" }]}
                onPress={() => {
                  const accountId = String(accountRaw.CO_CODECOMPTE ?? accountRaw.NUMEROCOMPTE ?? "");
                  if (accountId) fetchBlocks(accountId, blockDate || undefined, blockTiers || "");
                  setShowBlockModal(false);
                }}
              >
                <Ionicons name="lock-closed" size={16} color="#fff" />
                <Text style={s.modalBtnConfirmText}>Bloquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  hero: {
    paddingBottom: 28, paddingHorizontal: 20,
    overflow: "hidden",
  },
  blob1: {
    position: "absolute", width: 260, height: 260, borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.06)", top: -80, right: -60,
  },
  blob2: {
    position: "absolute", width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.04)", bottom: -40, left: -30,
  },
  blob3: {
    position: "absolute", width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)", top: 40, left: SW * 0.4,
  },
  navBar: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  navBack: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  navTitleWrap: { flex: 1, alignItems: "center" },
  navEyebrow: { color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  navTitle: { color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 2 },
  navEye: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  heroBalance: { marginBottom: 24 },
  heroBalanceLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 6 },
  heroBalanceAmount: { color: "#fff", fontSize: 42, fontWeight: "800", letterSpacing: -2 },
  heroBalanceCurrency: { color: "rgba(255,255,255,0.6)", fontSize: 15, marginTop: 4 },
  heroFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroNumberWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroNumber: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", letterSpacing: 1.5 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  heroBadgeText: { fontSize: 12, fontWeight: "700" },

  // Quick actions
  actionsRow: {
    flexDirection: "row", marginHorizontal: 16, marginTop: -1,
    borderRadius: 20, borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4,
  },
  actionItem: { flex: 1, alignItems: "center", paddingVertical: 18, gap: 7 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  actionLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },

  // Stats strip
  statsStrip: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 14 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 5, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.03, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  statIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  statVal: { fontSize: 14, fontWeight: "800", letterSpacing: -0.3 },
  statLbl: { fontSize: 9, fontWeight: "600", textAlign: "center" },

  // Section
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionDot: { width: 4, height: 16, borderRadius: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  card: {
    borderRadius: 18, borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },

  // Limits
  limitRow: { padding: 16 },
  limitTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  limitLabel: { fontSize: 13, fontWeight: "600" },
  limitPct: { fontSize: 12, fontWeight: "700" },
  limitTrack: { height: 7, borderRadius: 4, overflow: "hidden" },
  limitFill: { height: "100%", borderRadius: 4 },
  limitAmt: { fontSize: 11, marginTop: 7, textAlign: "right" },

  // Categories
  catRow: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 10 },
  catDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  catBody: { flex: 1 },
  catTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  catLabel: { fontSize: 13, fontWeight: "500", flex: 1 },
  catAmount: { fontSize: 13, fontWeight: "700" },
  catTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  catFill: { height: "100%", borderRadius: 3 },
  catPct: { fontSize: 11, fontWeight: "600", marginTop: 4, textAlign: "right" },

  // Blocages
  stateRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 10 },
  stateIconWrap: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  stateText: { fontSize: 13, fontWeight: "500", flex: 1 },
  blockedTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1 },
  blockedTotalLabel: { fontSize: 12, fontWeight: "600" },
  blockedTotalVal: { fontSize: 15, fontWeight: "800" },
  blockedItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10, borderTopWidth: 1 },
  blockedItemDot: { width: 8, height: 8, borderRadius: 4 },
  blockedItemBody: { flex: 1 },
  blockedItemType: { fontSize: 13, fontWeight: "600" },
  blockedItemDate: { fontSize: 11, marginTop: 2 },
  blockedItemAmt: { fontSize: 13, fontWeight: "700" },
  // New blocage styles
  blockedCountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginLeft: 4 },
  blockedCountText: { fontSize: 11, fontWeight: "800", color: "#F43F5E" },
  blockedItemIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  blockedItemAmtWrap: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },

  // Info rows
  infoRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  infoIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: "600" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "700" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 22 },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 14 },
  modalTitle: { fontSize: 19, fontWeight: "800", textAlign: "center" },
  modalSub: { fontSize: 13, marginTop: 4, marginBottom: 22, textAlign: "center", lineHeight: 19 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 4 },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalBtnCancel: { flex: 1, borderWidth: 1.5, borderRadius: 16, paddingVertical: 15, alignItems: "center" },
  modalBtnCancelText: { fontSize: 15, fontWeight: "600" },
  modalBtnConfirm: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 15 },
  modalBtnConfirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

export default AccountDetailsScreen;
