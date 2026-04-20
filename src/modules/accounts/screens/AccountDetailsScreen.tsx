import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useBlocagesCompte } from "../../../domain/compte/useBlocagesCompte";
import { useDernieresOperationsClient } from "../../../domain/compte/useDernieresOperationsClient";

export const AccountDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute() as any;
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const [showBlockModal, setShowBlockModal] = React.useState(false);
  const [blockDate, setBlockDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [blockTiers, setBlockTiers] = React.useState("");

  const accountRaw = route?.params?.account ?? {};
  const fmt = (n: any) => new Intl.NumberFormat("fr-FR").format(Number(n || 0));
  const type = String(accountRaw.CO_INTITULECOMPTE ?? accountRaw.type ?? "");
  const number = String(accountRaw.NUMEROCOMPTE ?? accountRaw.number ?? "");
  const balanceNum = Number(accountRaw.SOLDE ?? accountRaw.balance ?? 0);
  const currency = String(accountRaw.currency ?? "XOF");
  const blockedNum = Number(accountRaw.blocked ?? accountRaw.MONTANTBLOQUE ?? 0);
  const sharePctParam = Number((route as any)?.params?.sharePct ?? NaN);
  const totalParam = Number((route as any)?.params?.total ?? NaN);
  const pourcentage = !Number.isNaN(sharePctParam)
    ? Math.max(0, Math.min(100, sharePctParam))
    : totalParam > 0 ? Math.max(0, Math.min(100, Math.round((balanceNum / totalParam) * 100)))
    : accountRaw.progress ? Math.max(0, Math.min(100, Math.round(Number(accountRaw.progress) * 100))) : 0;
  const isActive = !accountRaw.CO_DATECLOTURE || String(accountRaw.CO_DATECLOTURE).includes("1900");
  const closedDate = isActive ? "" : String(accountRaw.CO_DATECLOTURE);
  const agency = String(accountRaw.AG_CODEAGENCE ?? "");
  const color = String(accountRaw.color ?? colors.primary);
  const categoriesRaw = route?.params?.categories ?? null;
  const limitsRaw = route?.params?.limits ?? null;

  const { operations: ops, isLoading: loadingOps, fetchData: fetchOps } = useDernieresOperationsClient(10);
  React.useEffect(() => { fetchOps(); }, []);

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
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text + "45", letterSpacing: 1.5, textTransform: "uppercase" }}>Compte</Text>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: -0.3 }}>Détails</Text>
        </View>
      ),
    });
  }, [navigation, colors]);

  const palette = ["#2196F3","#00C853","#FFC400","#26A69A","#FF7043","#9C27B0","#607D8B"];
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

  const { blockedCount, blockedList, blockedAmountTotal, isBlocked, loading: loadingBlocks, error: errorBlocks, fetchData: fetchBlocks } = useBlocagesCompte();
  React.useEffect(() => {
    const accountId = String(accountRaw.CO_CODECOMPTE ?? accountRaw.NUMEROCOMPTE ?? "");
    if (accountId) fetchBlocks(accountId);
  }, [accountRaw?.CO_CODECOMPTE, accountRaw?.NUMEROCOMPTE]);

  const formatAmt = (n: any) => `${fmt(Number(n || 0))} ${currency}`;
  const displayItem = (it: any) => ({
    type: String(it?.type || it?.TYPE || it?.MC_LIBELLEOPERATION || it?.JO_CODEJOURNAL || ""),
    date: String(it?.date || it?.BL_DATEJOURNEE || it?.MC_DATEPIECE || it?.created_at || it?.DATE || ""),
    desc: String(it?.description || it?.DESC || it?.CO_DESCRIPTION || ""),
    amount: formatAmt(it?.montant ?? it?.montantBlocage ?? it?.MONTANTBLOQUE ?? it?.MC_MONTANTDEBIT ?? 0),
  });

  const ACTIONS = [
    { icon: "swap-horizontal", label: t("accounts.quick.transfer"), color: colors.primary, onPress: () => (navigation as any).navigate("Transfer", { account: accountRaw }) },
    { icon: "download-outline", label: t("accounts.quick.topup"), color: colors.success, onPress: () => {} },
    { icon: "document-text-outline", label: t("accounts.quick.statement"), color: "#F59E0B", onPress: () => (navigation as any).navigate("Statements") },
    { icon: "lock-closed-outline", label: t("accounts.quick.block"), color: colors.error, onPress: () => setShowBlockModal(true) },
  ];

  return (
    <ScrollView style={[s.root, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

      {/* ── Account card ── */}
      <View style={[s.card, { backgroundColor: color }]}>
        <View style={s.cardTop}>
          <View>
            <Text style={s.cardEyebrow}>
              {type.includes("COURANT") ? "COMPTE ORDINAIRE" : tText(type)}
            </Text>
            <Text style={s.cardNumber}>{number}</Text>
          </View>
          <View style={[s.cardIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="card-outline" size={22} color="#fff" />
          </View>
        </View>

        <View style={s.cardBalanceBlock}>
          <Text style={s.cardBalanceLabel}>{t("accounts.balance.available")}</Text>
          <Text style={s.cardBalance}>{fmt(balanceNum)}</Text>
          <Text style={s.cardCurrency}>{currency}</Text>
        </View>

        <View style={[s.cardFooter, { borderTopColor: "rgba(255,255,255,0.2)" }]}>
          <View style={s.cardFooterItem}>
            <Ionicons name={isActive ? "checkmark-circle" : "close-circle"} size={13} color="rgba(255,255,255,0.8)" />
            <Text style={s.cardFooterText}>{isActive ? t("accounts.status.active") : `Clôturé ${closedDate}`}</Text>
          </View>
          <View style={s.cardFooterItem}>
            <Ionicons name="shield-checkmark" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={s.cardFooterText}>{t("accounts.details.secured")}</Text>
          </View>
          {isBlocked && (
            <View style={s.cardFooterItem}>
              <Ionicons name="lock-closed" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={s.cardFooterText}>Bloqué</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Quick actions ── */}
      <View style={s.actionsRow}>
        {ACTIONS.map((a) => (
          <TouchableOpacity key={a.label} style={s.actionItem} onPress={a.onPress} activeOpacity={0.8}>
            <View style={[s.actionIcon, { backgroundColor: a.color + "18" }]}>
              <Ionicons name={a.icon as any} size={20} color={a.color} />
            </View>
            <Text style={[s.actionLabel, { color: colors.text + "70" }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Stats pills ── */}
      <View style={s.statsRow}>
        <View style={[s.statPill, { backgroundColor: colors.success + "12", borderColor: colors.success + "25" }]}>
          <Ionicons name="arrow-down-circle" size={18} color={colors.success} />
          <Text style={[s.statVal, { color: colors.success }]}>{fmt(Math.max(0, balanceNum))}</Text>
          <Text style={[s.statLbl, { color: colors.success + "99" }]}>Solde</Text>
        </View>
        <View style={[s.statPill, { backgroundColor: colors.error + "12", borderColor: colors.error + "25" }]}>
          <Ionicons name="lock-closed" size={18} color={colors.error} />
          <Text style={[s.statVal, { color: colors.error }]}>{fmt(blockedAmountTotal || blockedNum)}</Text>
          <Text style={[s.statLbl, { color: colors.error + "99" }]}>Bloqué</Text>
        </View>
        <View style={[s.statPill, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25" }]}>
          <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
          <Text style={[s.statVal, { color: colors.primary }]}>{pourcentage}%</Text>
          <Text style={[s.statLbl, { color: colors.primary + "99" }]}>Portefeuille</Text>
        </View>
      </View>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>{t("accounts.expensesByCategory.title")}</Text>
            <TouchableOpacity><Text style={[s.sectionLink, { color: colors.primary }]}>{t("common.details")}</Text></TouchableOpacity>
          </View>
          <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {categories.map((item, idx) => (
              <View key={item.label}>
                <View style={s.catRow}>
                  <View style={[s.catDot, { backgroundColor: item.color }]} />
                  <Text style={[s.catLabel, { color: colors.text }]}>{item.label}</Text>
                  <View style={s.catRight}>
                    <Text style={[s.catAmount, { color: colors.text }]}>{item.amount}</Text>
                    <Text style={[s.catPct, { color: colors.text + "55" }]}>{item.percent}</Text>
                  </View>
                </View>
                <View style={[s.catBar, { backgroundColor: item.color + "20" }]}>
                  <View style={[s.catBarFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                </View>
                {idx < categories.length - 1 && <View style={[s.sep, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Limits ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>{t("accounts.limits.title")}</Text>
        {[
          { label: t("accounts.limits.dailyWithdrawal"), used: dailyUsed, limit: dailyLimit, pct: dailyPct, color: colors.primary },
          { label: t("accounts.limits.monthlyTransfer"), used: monthlyUsed, limit: monthlyLimit, pct: monthlyPct, color: colors.success },
        ].map((lim, i) => (
          <View key={i} style={[s.limitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.limitTop}>
              <Text style={[s.limitLabel, { color: colors.text }]}>{lim.label}</Text>
              <Text style={[s.limitAmt, { color: colors.text + "60" }]}>{fmt(lim.used)} / {fmt(lim.limit)} {currency}</Text>
            </View>
            <View style={[s.limitTrack, { backgroundColor: colors.border }]}>
              <View style={[s.limitFill, { width: `${lim.pct}%`, backgroundColor: lim.color }]} />
            </View>
            <Text style={[s.limitPct, { color: lim.color }]}>{lim.pct}% utilisé</Text>
          </View>
        ))}
      </View>

      {/* ── Blocages ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Blocages du compte</Text>
        <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {loadingBlocks && <Text style={[s.infoVal, { color: colors.text + "60" }]}>Chargement…</Text>}
          {!!errorBlocks && <Text style={[s.infoVal, { color: colors.error }]}>{String(errorBlocks)}</Text>}
          {!loadingBlocks && !errorBlocks && blockedCount === 0 && (
            <View style={s.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={[s.infoVal, { color: colors.text + "70" }]}>Aucun blocage actif</Text>
            </View>
          )}
          {!loadingBlocks && !errorBlocks && blockedCount > 0 && (
            <>
              <View style={s.infoRow}>
                <Text style={[s.infoLbl, { color: colors.text + "60" }]}>Total bloqué</Text>
                <Text style={[s.infoVal, { color: colors.error, fontWeight: "700" }]}>{formatAmt(blockedAmountTotal)}</Text>
              </View>
              {(blockedList || []).map((it, idx) => {
                const d = displayItem(it);
                return (
                  <View key={idx} style={[s.infoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <View style={[s.catDot, { backgroundColor: colors.warning }]} />
                    <Text style={[s.infoLbl, { color: colors.text, flex: 1 }]}>{d.type || "Blocage"}</Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[s.infoVal, { color: colors.text }]}>{d.amount}</Text>
                      <Text style={[s.catPct, { color: colors.text + "50" }]}>{d.date}</Text>
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
        <Text style={[s.sectionTitle, { color: colors.text }]}>{t("accounts.info.title")}</Text>
        <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: t("accounts.info.accountNumber"), value: number },
            { label: t("accounts.info.accountType"), value: tText(type) },
            { label: t("accounts.info.currency"), value: currency },
            { label: t("accounts.info.status"), value: isActive ? t("accounts.status.active") : "Clôturé", highlight: isActive },
            ...(agency ? [{ label: "Agence", value: agency }] : []),
          ].map((row, i) => (
            <View key={i} style={[s.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[s.infoLbl, { color: colors.text + "60" }]}>{row.label}</Text>
              {(row as any).highlight !== undefined ? (
                <View style={[s.statusBadge, { backgroundColor: isActive ? colors.success + "15" : colors.error + "15" }]}>
                  <Text style={[s.statusBadgeText, { color: isActive ? colors.success : colors.error }]}>{row.value}</Text>
                </View>
              ) : (
                <Text style={[s.infoVal, { color: colors.text }]}>{row.value}</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* ── Block modal ── */}
      <Modal visible={showBlockModal} transparent animationType="slide" onRequestClose={() => setShowBlockModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.modalTitle, { color: colors.text }]}>Bloquer le solde</Text>
            <Text style={[s.modalSub, { color: colors.text + "55" }]}>Renseignez les champs requis</Text>

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
                style={[s.modalBtnConfirm, { backgroundColor: colors.error }]}
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
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },

  // Account card
  card: { margin: 16, borderRadius: 24, padding: 22, shadowColor: "#000", shadowOpacity: 0.18, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 7 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardEyebrow: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  cardNumber: { color: "#fff", fontSize: 14, fontWeight: "600", marginTop: 4, letterSpacing: 1 },
  cardIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  cardBalanceBlock: { marginTop: 20 },
  cardBalanceLabel: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  cardBalance: { color: "#fff", fontSize: 34, fontWeight: "800", letterSpacing: -1, marginTop: 4 },
  cardCurrency: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 2 },
  cardFooter: { flexDirection: "row", gap: 16, marginTop: 18, paddingTop: 14, borderTopWidth: 1, flexWrap: "wrap" },
  cardFooterItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardFooterText: { color: "rgba(255,255,255,0.8)", fontSize: 12 },

  // Actions
  actionsRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, marginBottom: 8 },
  actionItem: { alignItems: "center", gap: 6 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  actionLabel: { fontSize: 11, fontWeight: "500" },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  statPill: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 4, borderWidth: 1 },
  statVal: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  statLbl: { fontSize: 10, fontWeight: "600" },

  // Section
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  sectionLink: { fontSize: 12, fontWeight: "600" },
  sectionCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
  sep: { height: 1 },

  // Categories
  catRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catLabel: { flex: 1, fontSize: 13, fontWeight: "500" },
  catRight: { alignItems: "flex-end" },
  catAmount: { fontSize: 13, fontWeight: "700" },
  catPct: { fontSize: 11, marginTop: 1 },
  catBar: { height: 4, marginHorizontal: 14, marginBottom: 2, borderRadius: 2, overflow: "hidden" },
  catBarFill: { height: "100%", borderRadius: 2 },

  // Limits
  limitCard: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
  limitTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  limitLabel: { fontSize: 13, fontWeight: "600" },
  limitAmt: { fontSize: 11 },
  limitTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  limitFill: { height: "100%", borderRadius: 3 },
  limitPct: { fontSize: 11, fontWeight: "600", marginTop: 6, textAlign: "right" },

  // Info rows
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  infoLbl: { fontSize: 13 },
  infoVal: { fontSize: 13, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { fontSize: 13, marginTop: 4, marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 4 },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalBtnCancel: { flex: 1, borderWidth: 1.5, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  modalBtnCancelText: { fontSize: 15, fontWeight: "600" },
  modalBtnConfirm: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 14 },
  modalBtnConfirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

export default AccountDetailsScreen;
