import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useCompteStatistiques } from "../../../domain/compte/useCompteStatistiques";
import { EmptyState } from "../../../shared/components/EmptyState";

export const AccountsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [filter, setFilter] = useState<
    "tous" | "cheque" | "epargne" | "courant" | "credit"
  >("tous");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const {
    data: compteStats,
    isLoading,
    error,
    fetchData,
  } = useCompteStatistiques();
  React.useEffect(() => {
    fetchData();
  }, []);
  React.useEffect(() => {
    const unsub = (navigation as any).addListener("focus", () => fetchData());
    return unsub;
  }, [navigation]);

  const stats = [
    {
      id: 1,
      label: `${new Intl.NumberFormat("fr-FR").format(
        Number(compteStats?.SOLDE_GLOBAL || 0)
      )} XAF`,
      sub: tText("Total"),
      icon: "wallet-outline",
      bg: colors.primary + "15",
      iconColor: colors.primary,
    },
    {
      id: 2,
      label: String(compteStats?.NOMBRE_COMPTES ?? 0),
      sub: t("accounts.stats.accounts"),
      icon: "list-outline",
      bg: colors.success + "15",
      iconColor: colors.success,
    },
    {
      id: 3,
      label: `${new Intl.NumberFormat("fr-FR").format(
        (compteStats?.COMPTES ?? []).reduce(
          (s: number, c: any) => s + Number(c?.MONTANTBLOQUE || 0),
          0
        )
      )} XAF`,
      sub: tText("Bloqué"),
      icon: "lock-closed-outline",
      bg: colors.warning + "15",
      iconColor: colors.warning,
    },
  ];

  const accounts = (compteStats?.COMPTES ?? []).map((c, idx) => {
    const type = String(c.CO_INTITULECOMPTE ?? "");
    const color =
      type.includes("Épargne") || type.includes("EPARGNE")
        ? colors.success
        : colors.primary;
    return {
      id: c.id ?? idx,
      type,
      CO_CODECOMPTE: String(c.CO_CODECOMPTE ?? ""),
      number: String(c.NUMEROCOMPTE ?? ""),
      balance: String(c.SOLDE ?? c.SOLDE_GLOBAL ?? 0),
      blocked: Number(c.MONTANTBLOQUE ?? 0),
      currency: "XAF",
      progress: (() => {
        const g = Number(compteStats?.SOLDE_GLOBAL ?? 0);
        const b = Number(c.SOLDE ?? c.SOLDE_GLOBAL ?? 0);
        return g > 0 ? Math.max(0, Math.min(1, b / g)) : 0;
      })(),
      active: !c.CO_DATECLOTURE || String(c.CO_DATECLOTURE).includes("1900"),
      color,
      duration: c.duration || "24 mois", // Default mock if not present
      nextDueDate: c.nextDueDate || "15/05/2024", // Default mock if not present
    } as any;
  });

  const parseAmount = (s: string) => Number(s.replace(/\s/g, ""));
  const portfolioTotal = Number(
    compteStats?.SOLDE_GLOBAL ??
      accounts.reduce((sum, a) => sum + parseAmount(a.balance), 0)
  );

  const renderStat = (s: any) => (
    <View
      key={s.id}
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
        <Ionicons
          name={s.icon as any}
          size={20}
          color={s.iconColor || colors.text}
        />
      </View>
      <Text
        style={[styles.statValue, { color: colors.text }]}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {s.label}
      </Text>
      <Text style={[styles.statSub, { color: colors.text + "70" }]}>
        {s.sub}
      </Text>
    </View>
  );

  const renderFilter = (
    key: "tous" | "cheque" | "epargne" | "courant" | "credit",
    label: string,
    icon?: any
  ) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.chip,
        { backgroundColor: colors.card, borderColor: colors.border },
        filter === key && {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
      ]}
      onPress={() => setFilter(key)}
      activeOpacity={0.8}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={filter === key ? "#fff" : colors.primary}
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        style={[
          styles.chipText,
          { color: colors.text },
          filter === key && styles.chipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      {/* Bande blanche avec Portfolio Total */}
      <View
        style={[
          styles.whiteHeader,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.portfolioLabel, { color: colors.text + "70" }]}>
            {t("accounts.header.portfolioTotal")}
          </Text>
          <Text style={[styles.portfolioValue, { color: colors.primary }]}>
            {new Intl.NumberFormat("fr-FR").format(portfolioTotal)} XAF
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.notifyBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={fetchData}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          <View style={[styles.notifyDot, { backgroundColor: colors.error }]} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>{stats.map(renderStat)}</View>

      {/* Titre + Filtres */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("accounts.list")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {renderFilter("tous", t("accounts.filters.all"))}
          {renderFilter(
            "cheque",
            t("accounts.filters.checking"),
            "card-outline"
          )}
          {renderFilter(
            "epargne",
            t("accounts.filters.savings"),
            "wallet-outline"
          )}
          {renderFilter(
            "courant",
            t("accounts.filters.current"),
            "briefcase-outline"
          )}
          {renderFilter("credit", t("accounts.filters.credit"), "cash-outline")}
        </ScrollView>
      </View>

      {/* Carte compte */}
      {isLoading && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: colors.text }}>Chargement…</Text>
        </View>
      )}
      {!!error && (
        <EmptyState
          type="error"
          message={String(error)}
          onRetry={fetchData}
          style={{ marginTop: 20 }}
        />
      )}
      {!isLoading && !error && accounts.length === 0 && (
        <EmptyState
          type="empty"
          message="Aucun compte trouvé"
          style={{ marginTop: 20 }}
        />
      )}
      {(accounts || [])
        .filter((a) => {
          const type = a.type.toUpperCase();
          if (filter === "cheque") return type.includes("CHEQUE");
          if (filter === "epargne") return type.includes("EPARGNE");
          if (filter === "courant") return type.includes("COURANT");
          if (filter === "credit")
            return (
              type.includes("CREDIT") ||
              type.includes("PRET") ||
              type.includes("CRÉDIT")
            );
          return true;
        })
        .map((a) => {
          const isCredit =
            a.type.toUpperCase().includes("CREDIT") ||
            a.type.toUpperCase().includes("PRET") ||
            a.type.toUpperCase().includes("CRÉDIT");
          return (
            <TouchableOpacity
              key={a.id}
              style={[
                styles.accountCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              activeOpacity={0.85}
              onPress={() => {
                if (isCredit) {
                  setExpandedId(expandedId === a.id ? null : a.id);
                } else {
                  // Ouvrir l'écran de détails pour tout type de compte
                  (navigation as any).navigate("AccountDetails", {
                    account: a,
                    sharePct: Math.round(
                      (parseAmount(a.balance) / portfolioTotal) * 100
                    ),
                    total: portfolioTotal,
                  });
                }
              }}
            >
              <View style={styles.accountTop}>
                <View
                  style={[
                    styles.accountIcon,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Ionicons
                    name={
                      (a.type.includes("Courant")
                        ? "briefcase"
                        : "wallet") as any
                    }
                    size={22}
                    color={a.color}
                  />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountType, { color: colors.text }]}>
                    {tText(a.type)}
                  </Text>
                  <Text
                    style={[
                      styles.accountNumber,
                      { color: colors.text + "70" },
                    ]}
                  >
                    {a.number}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: a.active
                        ? colors.success + "15"
                        : colors.error + "15",
                    },
                  ]}
                >
                  <Ionicons
                    name={a.active ? "checkmark-circle" : "close-circle"}
                    size={14}
                    color={a.active ? colors.success : colors.error}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: a.active ? colors.success : colors.error },
                    ]}
                  >
                    {a.active ? t("accounts.status.active") : tText("Clôturé")}
                  </Text>
                  {Number(a.blocked) > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginLeft: 8,
                      }}
                    >
                      <Ionicons
                        name="lock-closed"
                        size={14}
                        color={colors.warning}
                      />
                      <Text
                        style={{
                          color: colors.warning,
                          fontSize: 12,
                          fontWeight: "700",
                          marginLeft: 4,
                        }}
                      >
                        {tText("Bloqué")}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.accountBalanceRow}>
                <View>
                  <Text
                    style={[styles.balanceLabel, { color: colors.text + "70" }]}
                  >
                    {isCredit
                      ? "Solde à rembourser"
                      : t("accounts.balance.available")}
                  </Text>
                  <Text style={[styles.balanceValue, { color: colors.text }]}>
                    {new Intl.NumberFormat("fr-FR").format(
                      parseAmount(a.balance)
                    )}{" "}
                    <Text
                      style={[
                        styles.balanceCurrency,
                        { color: colors.primary },
                      ]}
                    >
                      {a.currency}
                    </Text>
                  </Text>
                  {Number(a.blocked) > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 6,
                      }}
                    >
                      <Ionicons
                        name="lock-closed"
                        size={14}
                        color={colors.warning}
                      />
                      <Text
                        style={{
                          marginLeft: 6,
                          color: colors.warning,
                          fontWeight: "700",
                        }}
                      >
                        {tText("Bloqué:")}{" "}
                        {new Intl.NumberFormat("fr-FR").format(
                          Number(a.blocked)
                        )}{" "}
                        {a.currency}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.roundActionBtn, { backgroundColor: a.color }]}
                  onPress={() =>
                    (navigation as any).navigate("Transfer", { account: a })
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons name="swap-horizontal" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.progressBarWrapper}>
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: colors.border },
                  ]}
                />
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.round(
                        (parseAmount(a.balance) / portfolioTotal) * 100
                      )}%`,
                      backgroundColor: a.color,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.progressText, { color: colors.text + "70" }]}
              >
                {isCredit
                  ? `Crédit accordé: ${new Intl.NumberFormat("fr-FR").format(
                      parseAmount(a.balance)
                    )} ${a.currency}`
                  : `${Math.round(
                      (parseAmount(a.balance) / portfolioTotal) * 100
                    )}% du portfolio`}
              </Text>

              {isCredit && expandedId === a.id && (
                <View
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={styles.modalRow}>
                    <Text
                      style={[styles.modalLabel, { color: colors.text + "90" }]}
                    >
                      Durée du crédit
                    </Text>
                    <Text style={[styles.modalValue, { color: colors.text }]}>
                      {a.duration}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text
                      style={[styles.modalLabel, { color: colors.text + "90" }]}
                    >
                      Prochaine échéance
                    </Text>
                    <Text style={[styles.modalValue, { color: colors.text }]}>
                      {a.nextDueDate}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text
                      style={[styles.modalLabel, { color: colors.text + "90" }]}
                    >
                      Montant restant
                    </Text>
                    <Text
                      style={[
                        styles.modalValue,
                        { color: colors.primary, fontWeight: "bold" },
                      ]}
                    >
                      {new Intl.NumberFormat("fr-FR").format(
                        parseAmount(a.balance)
                      )}{" "}
                      {a.currency}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

      {/* Floating add button */}
      <View style={styles.bottomSpacer} />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB", // Sera remplacé par le thème
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 250,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBody: {
    gap: 15,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  modalLabel: {
    fontSize: 16,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  whiteHeader: {
    backgroundColor: "#fff", // Sera remplacé par le thème
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0", // Sera remplacé par le thème
  },
  portfolioLabel: {
    fontSize: 13,
    color: "#7F8C8D", // Sera remplacé par le thème
    marginBottom: 6,
  },
  portfolioValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#007AFF", // Sera remplacé par le thème
  },
  notifyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F8FF", // Sera remplacé par le thème
    borderColor: "#E0E0E0", // Sera remplacé par le thème
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notifyDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30", // Sera remplacé par le thème
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingHorizontal: 16,
  },
  statCard: {
    backgroundColor: "#fff", // Sera remplacé par le thème
    borderRadius: 16,
    padding: 16,
    width: "31%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0", // Sera remplacé par le thème
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A", // Sera remplacé par le thème
    textAlign: "center",
  },
  statSub: {
    fontSize: 12,
    color: "#7F8C8D", // Sera remplacé par le thème
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A", // Sera remplacé par le thème
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 10,
  },
  chip: {
    backgroundColor: "#fff", // Sera remplacé par le thème
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0", // Sera remplacé par le thème
    flexDirection: "row",
    alignItems: "center",
  },
  chipText: {
    fontSize: 13,
    color: "#7F8C8D", // Sera remplacé par le thème
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },
  accountCard: {
    backgroundColor: "#fff", // Sera remplacé par le thème
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0", // Sera remplacé par le thème
  },
  accountTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountType: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A", // Sera remplacé par le thème
  },
  accountNumber: {
    fontSize: 12,
    color: "#7F8C8D", // Sera remplacé par le thème
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F0FFF5", // Sera remplacé par le thème
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#34C759", // Sera remplacé par le thème
    fontWeight: "700",
  },
  accountBalanceRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 13,
    color: "#7F8C8D", // Sera remplacé par le thème
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A", // Sera remplacé par le thème
    marginTop: 6,
  },
  balanceCurrency: {
    color: "#007AFF", // Sera remplacé par le thème
    fontWeight: "800",
  },
  roundActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  progressBarWrapper: {
    position: "relative",
    marginTop: 12,
    height: 6,
  },
  progressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F0F0F0", // Sera remplacé par le thème
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    color: "#7F8C8D", // Sera remplacé par le thème
    textAlign: "right",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0A84FF", // Sera remplacé par le thème
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  bottomSpacer: {
    height: 0,
  },
});
