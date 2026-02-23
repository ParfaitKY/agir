import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { secureGetItem } from "../../../shared/utils/secureStorage";
import { dernieresOperationsClient } from "../../../services/compte/dernieresOperationsClient";
import { EmptyState } from "../../../shared/components/EmptyState";

export const TransactionsScreen: React.FC = () => {
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState<
    "toutes" | "entrees" | "sorties"
  >("toutes");
  const [items, setItems] = useState<
    Array<{
      id: string;
      title: string;
      amountText: string;
      amountNum: number;
      date: string;
      type: "entree" | "sortie";
      status: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parseNum = (s: any) => Number(String(s ?? "0").replace(/[,"\s]/g, ""));
  React.useEffect(() => {
    const run = async () => {
      setError(null);
      setLoading(true);
      try {
        const clientId = await secureGetItem("client_id");
        const token = await secureGetItem("auth_token");
        const login = await secureGetItem("user_login");
        const agency = (await secureGetItem("user_agency")) || "1000";
        const accountCode = (await secureGetItem("user_account_number")) || "";

        if (!clientId || !token || !accountCode) {
          setError("Identifiants manquants");
          return;
        }

        const today = new Date();
        const dd = String(today.getDate()).padStart(2, "0");
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const yyyy = today.getFullYear();
        const dateFin = `${dd}/${mm}/${yyyy}`;

        const headers: any = {
          Authorization: `Bearer ${token}`,
          "X-CLIENT-ID": clientId,
          ...(login ? { "X-LOGIN": login } : {}),
        };

        const result: any = await dernieresOperationsClient(
          {
            AG_CODEAGENCE: String(agency).replace(/\D/g, ""),
            CO_CODECOMPTE: String(accountCode).replace(/\D/g, ""),
            CODECRYPTAGE: "Y}@128eVIXfoi7",
            DateDebut: "01/01/2000",
            DateFin: dateFin,
            Nombretransactions: "50",
          } as any,
          headers,
        );

        if (result?.error) {
          const err: any = result.error;
          const server = err?.response?.data;
          const msg = server?.message || err?.message || "Erreur";
          setError(msg);
          return;
        }

        const payload = result?.data;
        // Gestion robuste de la structure de réponse
        const arr = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.data?.operations)
            ? payload.data.operations
            : Array.isArray(payload?.operations)
              ? payload.operations
              : [];

        const normalized = arr.map((r: any, idx: number) => {
          let debit = parseNum(r?.MC_MONTANTDEBIT);
          let credit = parseNum(r?.MC_MONTANTCREDIT);
          const title = String(r?.MC_LIBELLEOPERATION ?? "Opération");

          // FIX: Les ouvertures de comptes sont toujours des débits (sorties)
          // Même si la banque les envoie parfois en crédit ou mal formatés
          if (title.toUpperCase().includes("OUVERTURE")) {
            if (credit > 0 && debit === 0) {
              debit = credit;
              credit = 0;
            }
          }

          // Utilisation stricte des données serveur
          // MC_SENS prime : 'D' = Débit (Sortie), 'C' = Crédit (Entrée)
          let type: "entree" | "sortie" = "sortie";

          if (r?.MC_SENS === "C") {
            type = "entree";
          } else if (r?.MC_SENS === "D") {
            type = "sortie";
          } else {
            // Fallback montant
            type = credit > 0 ? "entree" : "sortie";
          }

          // Force type sortie for Ouverture
          if (title.toUpperCase().includes("OUVERTURE")) {
            type = "sortie";
          }

          // Correction auto-validation: Si SENS contredit les montants
          if (type === "entree" && credit === 0 && debit > 0) {
            type = "sortie";
          } else if (type === "sortie" && debit === 0 && credit > 0) {
            type = "entree";
          }

          const num = type === "entree" ? credit : debit;

          return {
            id: String(r?.MC_NUMSEQUENCE ?? idx),
            title,
            amountText: `${type === "entree" ? "+" : "-"}${num.toLocaleString()} XOF`,
            amountNum: num,
            date: String(r?.MC_DATEPIECE ?? r?.MC_DATESAISIE ?? ""),
            type,
            status: t("common.success"),
          };
        });

        // Deduplication basée sur le contenu pour éviter les doublons visuels
        // (Surtout utile si le backend renvoie des données dupliquées)
        const uniqueItems = normalized.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex(
              (t: any) =>
                t.title === item.title &&
                t.amountNum === item.amountNum &&
                t.date === item.date,
            ),
        );

        setItems(uniqueItems);
      } catch (e: any) {
        setError(e?.message || "Erreur réseau");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [t]);

  const totalEntrees = items.reduce(
    (s, it) => s + (it.type === "entree" ? it.amountNum : 0),
    0,
  );
  const totalSorties = items.reduce(
    (s, it) => s + (it.type === "sortie" ? it.amountNum : 0),
    0,
  );

  // Filtrer les transactions selon le filtre actif
  const filteredTransactions = items.filter((transaction) => {
    if (activeFilter === "toutes") return true;
    if (activeFilter === "entrees") return transaction.type === "entree";
    if (activeFilter === "sorties") return transaction.type === "sortie";
    return true;
  });

  const translateTitle = (title: string) => title;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => (navigation as any).goBack()}
          style={{ paddingHorizontal: 12 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      ),
    } as any);
  }, [navigation, colors.text]);

  const styles = getStyles(colors);
  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: colors.text }}>{tText("Chargement…")}</Text>
        </View>
      )}
      {!!error && (
        <EmptyState
          type="error"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError(null);
            // Re-run the effect logic, ideally move logic to a function
          }}
          compact
        />
      )}

      {/* Résumé des transactions */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryHeader}>
            <Ionicons name="trending-up" size={16} color={colors.success} />
            <Text style={styles.summaryLabel}>
              {t("transactions.summary.in")}
            </Text>
          </View>
          <Text style={styles.entreeAmount}>
            {totalEntrees.toLocaleString()} XOF
          </Text>
        </View>
        <View style={styles.summarySeparator} />
        <View style={styles.summaryItem}>
          <View style={styles.summaryHeader}>
            <Ionicons name="trending-down" size={16} color={colors.error} />
            <Text style={styles.summaryLabel}>
              {t("transactions.summary.out")}
            </Text>
          </View>
          <Text style={styles.sortieAmount}>
            {totalSorties.toLocaleString()} XOF
          </Text>
        </View>
      </View>

      {/* Filtres - Les trois boutons côte à côte à droite */}
      <View style={styles.filterMainContainer}>
        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "toutes" && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter("toutes")}
          >
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === "toutes" && styles.filterButtonTextActive,
              ]}
            >
              {t("transactions.filter.all")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "entrees" && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter("entrees")}
          >
            <View style={styles.filterButtonContent}>
              <Ionicons
                name="trending-up"
                size={14}
                color={activeFilter === "entrees" ? "white" : colors.success}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === "entrees" && styles.filterButtonTextActive,
                ]}
              >
                {t("transactions.filter.in")}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={14}
              color={activeFilter === "entrees" ? "white" : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "sorties" && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter("sorties")}
          >
            <View style={styles.filterButtonContent}>
              <Ionicons
                name="trending-down"
                size={14}
                color={activeFilter === "sorties" ? "white" : colors.error}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === "sorties" && styles.filterButtonTextActive,
                ]}
              >
                {t("transactions.filter.out")}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={14}
              color={activeFilter === "sorties" ? "white" : colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des transactions filtrées */}
      <ScrollView style={styles.content}>
        {filteredTransactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>
                {translateTitle(transaction.title)}
              </Text>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
              <Text style={styles.transactionStatus}>{transaction.status}</Text>
            </View>
            <Text
              style={[
                styles.amountText,
                transaction.type === "entree"
                  ? styles.positive
                  : styles.negative,
              ]}
            >
              {transaction.amountText}
            </Text>
          </View>
        ))}

        {filteredTransactions.length === 0 && !loading && !error && (
          <EmptyState
            type="empty"
            message={`${t("transactions.empty.none")} ${
              activeFilter === "entrees"
                ? t("transactions.empty.inSuffix")
                : activeFilter === "sorties"
                  ? t("transactions.empty.outSuffix")
                  : ""
            }`}
            compact
            style={{ marginTop: 40 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    navHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    navTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    summaryContainer: {
      flexDirection: "row",
      backgroundColor: colors.card,
      margin: 16,
      borderRadius: 12,
      padding: 20,
      shadowColor: colors.border,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryItem: {
      flex: 1,
      alignItems: "center",
    },

    summarySeparator: {
      width: 1,
      backgroundColor: colors.border,
      marginHorizontal: 10,
    },

    summaryHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 4,
    },
    filterButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    // Les styles existants modifiés pour les boutons de filtre
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    // Les autres styles restent les mêmes...
    summaryLabel: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
    },
    entreeAmount: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.success,
    },
    sortieAmount: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.error,
    },

    // Nouveaux styles pour la disposition correcte des filtres
    filterMainContainer: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginBottom: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "flex-start", // Aligne les boutons à droite
    },
    filterButtonsContainer: {
      flexDirection: "row",
      gap: 8,
    },

    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
      fontWeight: "500",
    },
    filterButtonTextActive: {
      color: "white",
      fontWeight: "600",
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    transactionCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.card,
      padding: 16,
      marginVertical: 4,
      borderRadius: 8,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    transactionDate: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
    },
    transactionStatus: {
      fontSize: 12,
      color: colors.success,
      marginTop: 2,
      fontWeight: "500",
    },
    amountText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    positive: {
      color: colors.success,
    },
    negative: {
      color: colors.error,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.text,
      opacity: 0.7,
      textAlign: "center",
    },
    bottomNav: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 12,
    },
    navItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    navText: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.7,
      marginTop: 4,
    },
    navTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
  });
