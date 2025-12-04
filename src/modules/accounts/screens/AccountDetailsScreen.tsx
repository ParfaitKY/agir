import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
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
  const [blockDate, setBlockDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [blockTiers, setBlockTiers] = React.useState("");
  const accountRaw = route?.params?.account ?? {};
  const fmt = (n: any) => new Intl.NumberFormat("fr-FR").format(Number(n || 0));
  const type = String(accountRaw.CO_INTITULECOMPTE ?? accountRaw.type ?? "");
  const number = String(accountRaw.NUMEROCOMPTE ?? accountRaw.number ?? "");
  const balanceNum = Number(accountRaw.SOLDE ?? accountRaw.balance ?? 0);
  const currency = String(accountRaw.currency ?? "XAF");
  const blockedNum = Number(
    accountRaw.blocked ?? accountRaw.MONTANTBLOQUE ?? 0
  );
  const sharePctParam = Number((route as any)?.params?.sharePct ?? NaN);
  const totalParam = Number((route as any)?.params?.total ?? NaN);
  const pourcentage = !Number.isNaN(sharePctParam)
    ? Math.max(0, Math.min(100, sharePctParam))
    : totalParam > 0
    ? Math.max(0, Math.min(100, Math.round((balanceNum / totalParam) * 100)))
    : accountRaw.progress
    ? Math.max(0, Math.min(100, Math.round(Number(accountRaw.progress) * 100)))
    : 0;
  const isActive =
    !accountRaw.CO_DATECLOTURE ||
    String(accountRaw.CO_DATECLOTURE).includes("1900");
  const closedDate = isActive ? "" : String(accountRaw.CO_DATECLOTURE);
  const agency = String(accountRaw.AG_CODEAGENCE ?? "");
  const color = String(accountRaw.color ?? colors.primary);
  const categoriesRaw = route?.params?.categories ?? null;
  const limitsRaw = route?.params?.limits ?? null;
  const {
    operations: ops,
    isLoading: loadingOps,
    fetchData: fetchOps,
  } = useDernieresOperationsClient(10);
  React.useEffect(() => {
    fetchOps();
  }, []);
  const palette = [
    "#2196F3",
    "#00C853",
    "#FFC400",
    "#26A69A",
    "#FF7043",
    "#9C27B0",
    "#607D8B",
  ];
  const opsForClientDebit = (ops || []).filter((op: any) => {
    const type = String(op.TypeOperation || "").toUpperCase();
    return type === "DEBIT";
  });
  const groupedBySchema: Record<string, number> = {};
  for (const op of opsForClientDebit) {
    const code = String(
      op.TS_CODETYPESCHEMACOMPTABLE || t("accounts.category.other")
    );
    const amtRaw =
      typeof op.MC_MONTANTDEBIT === "string"
        ? Number(op.MC_MONTANTDEBIT)
        : Number(op.MC_MONTANTDEBIT || 0);
    const amt = isNaN(amtRaw) ? 0 : amtRaw;
    groupedBySchema[code] = (groupedBySchema[code] || 0) + amt;
  }
  const entries = Object.entries(groupedBySchema);
  const totalDebit = entries.reduce((sum, [, total]) => sum + (total || 0), 0);
  const categoriesDynamic = entries.map(([code, total], idx) => ({
    label: String(code || t("accounts.category.other")),
    color: palette[idx % palette.length],
    amount: `${fmt(Number(total || 0))} ${currency}`,
    percent: `${
      totalDebit > 0 ? Math.round(((total || 0) / totalDebit) * 100) : 0
    }%`,
  }));
  const categories = categoriesDynamic.length
    ? categoriesDynamic
    : Array.isArray(categoriesRaw)
    ? categoriesRaw.map((c: any) => ({
        label: String(c?.label ?? ""),
        color: String(c?.color ?? colors.primary),
        amount: `${fmt(Number(c?.amount ?? 0))} ${currency}`,
        percent: `${Math.round(Number(c?.percent ?? 0))}%`,
      }))
    : [];
  const dailyUsed = Number(limitsRaw?.dailyWithdrawalUsed ?? 25000);
  const dailyLimit = Number(limitsRaw?.dailyWithdrawalLimit ?? 50000);
  const monthlyUsed = Number(limitsRaw?.monthlyTransferUsed ?? 87500);
  const monthlyLimit = Number(limitsRaw?.monthlyTransferLimit ?? 200000);
  const dailyPct =
    dailyLimit > 0
      ? Math.min(100, Math.round((dailyUsed / dailyLimit) * 100))
      : 0;
  const monthlyPct =
    monthlyLimit > 0
      ? Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100))
      : 0;

  const styles = getStyles(colors);
  const {
    blockedCount,
    blockedList,
    blockedAmountTotal,
    isBlocked,
    loading: loadingBlocks,
    error: errorBlocks,
    fetchData: fetchBlocks,
  } = useBlocagesCompte();
  React.useEffect(() => {
    const accountId = String(
      accountRaw.CO_CODECOMPTE ?? accountRaw.NUMEROCOMPTE ?? ""
    );
    if (accountId) fetchBlocks(accountId);
  }, [accountRaw?.CO_CODECOMPTE, accountRaw?.NUMEROCOMPTE]);
  const formatAmt = (n: any) => `${fmt(Number(n || 0))} ${currency}`;
  const displayItem = (it: any) => {
    const type = String(
      it?.type ||
        it?.TYPE ||
        it?.MC_LIBELLEOPERATION ||
        it?.JO_CODEJOURNAL ||
        ""
    );
    const date = String(
      it?.date ||
        it?.BL_DATEJOURNEE ||
        it?.MC_DATEPIECE ||
        it?.created_at ||
        it?.DATE ||
        ""
    );
    const desc = String(
      it?.description || it?.DESC || it?.CO_DESCRIPTION || ""
    );
    const amtRaw =
      it?.montant ??
      it?.montantBlocage ??
      it?.MONTANTBLOQUE ??
      it?.MC_MONTANTDEBIT ??
      0;
    const amount = formatAmt(amtRaw);
    return { type, date, desc, amount };
  };
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Blue account card */}
      <View style={[styles.blueCard, { backgroundColor: colors.primary }]}>
        <View style={styles.blueCardHeader}>
          <View>
            <Text style={styles.blueCardType}>{tText(type)}</Text>
            <Text style={styles.blueCardNumber}>{number}</Text>
          </View>
          <View style={[styles.blueIconBg]}>
            <Ionicons name="card" size={20} color="#fff" />
          </View>
        </View>
        <View style={styles.blueCardBalanceBlock}>
          <Text style={styles.blueCardLabel}>
            {t("accounts.balance.available")}
          </Text>
          <Text style={styles.blueCardBalance}>
            {fmt(balanceNum)} {currency}
          </Text>
        </View>
        <View style={styles.blueCardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={14} color="#E3EEFF" />
            <Text style={styles.blueCardDate}>
              {isActive
                ? t("accounts.status.active")
                : `${t("accounts.details.closedOn")} ${closedDate}`}
            </Text>
          </View>
          <View style={styles.secureRow}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
            <Text style={styles.secureText}>
              {t("accounts.details.secured")}
            </Text>
          </View>
          {isBlocked && (
            <View style={styles.secureRow}>
              <Ionicons name="lock-closed" size={14} color="#fff" />
              <Text style={styles.secureText}>{tText("Bloqué")}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        {[
          {
            icon: "swap-horizontal",
            label: t("accounts.quick.transfer"),
            color: "#2196F3",
          },
          {
            icon: "download-outline",
            label: t("accounts.quick.topup"),
            color: "#34C759",
          },
          {
            icon: "document-text-outline",
            label: t("accounts.quick.statement"),
            color: "#FFCC00",
          },
          {
            icon: "lock-closed-outline",
            label: t("accounts.quick.block"),
            color: "#FF3B30",
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.quickItem}
            activeOpacity={0.85}
            onPress={() => {
              if (item.icon === "swap-horizontal") {
                (navigation as any).navigate("Transfer", {
                  account: accountRaw,
                });
              } else if (item.icon === "document-text-outline") {
                (navigation as any).navigate("Statements");
              } else if (item.icon === "lock-closed-outline") {
                setShowBlockModal(true);
              }
            }}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.card }]}>
              <Ionicons name={item.icon as any} size={18} color={item.color} />
            </View>
            <Text style={styles.quickText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={showBlockModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {" "}
              {tText("Bloquer le solde")}
            </Text>
            <Text style={{ color: colors.text + "70", marginBottom: 8 }}>
              {tText("Renseignez les champs requis")}
            </Text>
            <Text style={[styles.limitLabel, { marginBottom: 4 }]}>
              {tText("Date de journée (YYYY-MM-DD)")}
            </Text>
            <TextInput
              value={blockDate}
              onChangeText={setBlockDate}
              placeholder={new Date().toISOString().slice(0, 10)}
              placeholderTextColor={colors.text + "50"}
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
            />
            <Text
              style={[styles.limitLabel, { marginTop: 10, marginBottom: 4 }]}
            >
              {tText("ID tiers (optionnel)")}
            </Text>
            <TextInput
              value={blockTiers}
              onChangeText={setBlockTiers}
              placeholder={tText("ID tiers")}
              placeholderTextColor={colors.text + "50"}
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 14,
                gap: 10,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.chip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => setShowBlockModal(false)}
              >
                <Text style={[styles.chipText, { color: colors.text }]}>
                  {tText("Annuler")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roundActionBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  const accountId = String(
                    accountRaw.CO_CODECOMPTE ?? accountRaw.NUMEROCOMPTE ?? ""
                  );
                  if (accountId) {
                    fetchBlocks(
                      accountId,
                      blockDate || undefined,
                      blockTiers || ""
                    );
                  }
                  setShowBlockModal(false);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="lock-closed" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stats of the month */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="arrow-down" size={16} color={colors.success} />
          <Text style={[styles.statValue, { color: colors.success }]}>
            {fmt(Math.max(0, balanceNum))}
          </Text>
          <Text style={styles.statLabel}>{tText("Solde")}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="lock-closed" size={16} color={colors.error} />
          <Text style={[styles.statValue, { color: colors.error }]}>
            {fmt(blockedAmountTotal || blockedNum)}
          </Text>
          <Text style={styles.statLabel}>{tText("Bloqué")}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
          <Text style={styles.statValue}>{`${Math.round(pourcentage)}%`}</Text>
          <Text style={styles.statLabel}>{tText("% du portefeuille")}</Text>
        </View>
      </View>

      {/* Category expenses */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {t("accounts.expensesByCategory.title")}
          </Text>
          <TouchableOpacity>
            <Text style={styles.link}>{t("common.details")}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoryCard}>
          {categories.map((item, idx, arr) => (
            <React.Fragment key={item.label}>
              <View style={styles.categoryRow}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.categoryLabel}>{item.label}</Text>
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryAmount}>{item.amount}</Text>
                  <Text style={styles.categoryPercent}>{item.percent}</Text>
                </View>
              </View>
              {idx < arr.length - 1 && <View style={styles.categoryDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Limits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("accounts.limits.title")}</Text>
        <View style={styles.limitBox}>
          <View style={styles.limitHeaderRow}>
            <Text style={styles.limitLabel}>
              {t("accounts.limits.dailyWithdrawal")}
            </Text>
            <Text style={styles.limitAmount}>
              {fmt(dailyUsed)} / {fmt(dailyLimit)} {currency}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${dailyPct}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>
        <View style={styles.limitBox}>
          <View style={styles.limitHeaderRow}>
            <Text style={styles.limitLabel}>
              {t("accounts.limits.monthlyTransfer")}
            </Text>
            <Text style={styles.limitAmount}>
              {fmt(monthlyUsed)} / {fmt(monthlyLimit)} {currency}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${monthlyPct}%`, backgroundColor: colors.success },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{tText("Blocages du compte")}</Text>
        <View style={styles.limitBox}>
          {loadingBlocks && (
            <Text style={styles.limitAmount}>{tText("Chargement…")}</Text>
          )}
          {!!errorBlocks && (
            <Text style={[styles.limitAmount, { color: colors.error }]}>
              {String(errorBlocks)}
            </Text>
          )}
          {!loadingBlocks && !errorBlocks && blockedCount === 0 && (
            <View>
              <Text style={styles.limitLabel}>
                {tText("Aucun blocage actif sur ce compte.")}
              </Text>
              <Text style={styles.limitAmount}>
                {tText("Solde bloqué :")} {formatAmt(0)}
              </Text>
            </View>
          )}
          {!loadingBlocks && !errorBlocks && blockedCount > 0 && (
            <View>
              <View style={styles.limitHeaderRow}>
                <Text style={styles.limitLabel}>
                  {tText("État du compte :")}
                </Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {tText("Compte bloqué")}
                  </Text>
                </View>
              </View>
              <Text style={styles.limitAmount}>
                {tText("Total bloqué :")} {formatAmt(blockedAmountTotal)}
              </Text>
              <View style={[styles.categoryCard, { marginTop: 12 }]}>
                {(blockedList || []).map((it, idx, arr) => {
                  const d = displayItem(it);
                  return (
                    <React.Fragment key={`bl-${idx}`}>
                      <View style={styles.categoryRow}>
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: colors.warning },
                          ]}
                        />
                        <Text style={styles.categoryLabel}>
                          {String(d.type || tText("Blocage"))}
                        </Text>
                        <View style={styles.categoryRight}>
                          <Text style={styles.categoryAmount}>{d.amount}</Text>
                          <Text style={styles.categoryPercent}>
                            {String(d.date || "")}
                          </Text>
                        </View>
                      </View>
                      {!!d.desc && idx < arr.length - 1 && (
                        <View style={styles.categoryDivider} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Account information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("accounts.info.title")}</Text>
        <View style={styles.infoBox}>
          <View style={styles.infoRowFirst}>
            <Text style={styles.infoLabel}>
              {t("accounts.info.accountNumber")}
            </Text>
            <Text style={styles.infoValue}>{number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {t("accounts.info.accountType")}
            </Text>
            <Text style={styles.infoValue}>{tText(type)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("accounts.info.currency")}</Text>
            <Text style={styles.infoValue}>{currency}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("accounts.info.status")}</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                {isActive ? t("accounts.status.active") : tText("Clôturé")}
              </Text>
            </View>
          </View>
          {!!agency && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{tText("Agence")}</Text>
              <Text style={styles.infoValue}>{agency}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      marginBottom: 8,
    },
    backBtn: {
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },

    blueCard: {
      marginHorizontal: 16,
      marginTop: 14,
      borderRadius: 16,
      padding: 16,
      shadowColor: colors.border,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 3,
    },
    blueCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    blueIconBg: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    blueCardType: { color: "#fff", fontSize: 14, fontWeight: "700" },
    blueCardNumber: { color: "#E3EEFF", fontSize: 12, marginTop: 2 },
    blueCardBalanceBlock: { marginTop: 16 },
    blueCardLabel: { color: "#E3EEFF", fontSize: 12 },
    blueCardBalance: {
      color: "#fff",
      fontSize: 28,
      fontWeight: "800",
      marginTop: 4,
    },
    blueCardFooter: {
      marginTop: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    blueCardDate: { color: "#E3EEFF", fontSize: 12 },
    secureRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    secureText: { color: "#fff", fontSize: 12 },

    quickRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginTop: 14,
    },
    quickItem: { alignItems: "center", width: "23%" },
    quickIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 6,
    },
    quickText: { fontSize: 12, color: colors.text, opacity: 0.7 },

    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginTop: 18,
    },
    statBox: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      width: "32%",
      alignItems: "center",
      shadowColor: colors.border,
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: { fontSize: 16, fontWeight: "700" },
    statLabel: { fontSize: 12, color: colors.text, opacity: 0.7, marginTop: 6 },

    section: { paddingHorizontal: 16, marginTop: 18 },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    link: { fontSize: 12, color: colors.primary },

    categoryCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 14,
      shadowColor: colors.border,
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    categoryLabel: { flex: 1, color: colors.text, fontSize: 13 },
    categoryRight: { alignItems: "flex-end" },
    categoryAmount: { color: colors.text, fontWeight: "700", fontSize: 13 },
    categoryPercent: {
      color: colors.text,
      opacity: 0.7,
      fontSize: 12,
      marginTop: 2,
    },
    categoryDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 24,
    },

    limitBox: {
      backgroundColor: colors.card,
      borderRadius: 22,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.border,
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    limitHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    limitLabel: { fontSize: 13, color: colors.text, fontWeight: "700" },
    limitAmount: { fontSize: 12, color: colors.text, opacity: 0.7 },
    progressTrack: {
      position: "relative",
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      marginTop: 10,
      overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 4 },

    infoBox: {
      backgroundColor: colors.card,
      borderRadius: 22,
      paddingHorizontal: 16,
      shadowColor: colors.border,
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoRowFirst: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 16,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    infoLabel: { color: colors.text, opacity: 0.7, fontSize: 13 },
    infoValue: { color: colors.text, fontSize: 13, fontWeight: "700" },
    statusPill: {
      backgroundColor: "rgba(39,174,96,0.15)",
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    statusPillText: { color: colors.success, fontSize: 13, fontWeight: "700" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalCard: {
      width: "90%",
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      shadowColor: colors.border,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 3,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.background,
    },
    chip: {
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    chipText: {
      fontSize: 13,
      fontWeight: "600",
    },
    roundActionBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.border,
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 4,
    },
  });

export default AccountDetailsScreen;
