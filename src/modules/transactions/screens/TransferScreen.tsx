import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useVirement } from "../../../domain/compte/useVirement";
import { useCompteStatistiques } from "../../../domain/compte/useCompteStatistiques";
import { ActivityIndicator } from "react-native";
import { secureGetItem } from "../../../shared/utils/secureStorage";

export const TransferScreen: React.FC = () => {
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const route = useRoute();

  const [sourceAccount, setSourceAccount] = useState("");
  const [destinationAccount, setDestinationAccount] = useState("");
  const [amount, setAmount] = useState("");
  const { submit, isLoading, error, data } = useVirement();
  const { data: compteStats, fetchData: fetchAccounts } =
    useCompteStatistiques();
  const [done, setDone] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const sanitize = (s: string) => s.replace(/\D/g, "");

  React.useEffect(() => {
    const run = async () => {
      // 1. Check params first
      const params = route.params as any;
      if (params?.account) {
        setSelectedAccount(params.account);
        setSourceAccount(sanitize(params.account.number));
        return;
      }

      // 2. Fallback to storage or fetch
      const acc = (await secureGetItem("user_account_number")) || "";
      if (acc) {
        setSourceAccount(sanitize(acc));
        // Try to find full object in stats if available
        if (compteStats?.COMPTES) {
          const found = compteStats.COMPTES.find(
            (c: any) => String(c.NUMEROCOMPTE) === acc
          );
          if (found) {
            // Adapt found account to expected structure if needed
            const type = String(found.CO_INTITULECOMPTE ?? "");
            const color =
              type.includes("Épargne") || type.includes("EPARGNE")
                ? colors.success
                : colors.primary;
            setSelectedAccount({
              type,
              number: String(found.NUMEROCOMPTE ?? ""),
              balance: String(found.SOLDE ?? found.SOLDE_GLOBAL ?? 0),
              blocked: Number(found.MONTANTBLOQUE ?? 0),
              currency: "XOF",
              active:
                !found.CO_DATECLOTURE ||
                String(found.CO_DATECLOTURE).includes("1900"),
              color,
            });
          }
        } else {
          fetchAccounts();
        }
      }
    };
    run();
  }, [route.params, compteStats]);

  const canSubmit =
    sanitize(sourceAccount).length > 0 &&
    sanitize(destinationAccount).length > 0 &&
    Number(String(amount).replace(/[,\s]/g, "")) > 0;

  const styles = getStyles(colors);

  const parseAmount = (s: string) => Number(s.replace(/\s/g, ""));
  // Portfolio total estimation for progress bar (fallback to balance if single)
  const portfolioTotal = Number(
    compteStats?.SOLDE_GLOBAL ||
      parseAmount(selectedAccount?.balance || "0") ||
      1
  );

  const renderSourceAccountCard = () => {
    // Affichage simplifié (type Input) pour correspondre à la maquette
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t("transfer.form.source.label")}</Text>
        <TextInput
          style={[
            styles.input,
            { opacity: 0.8, backgroundColor: colors.card + "40" },
          ]}
          placeholder={t("transfer.form.source.placeholder")}
          value={sourceAccount}
          editable={false} // Le compte source est pré-sélectionné
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header visuel */}
        <View style={styles.headerIconWrapper}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="swap-horizontal" size={28} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.headerTitle}>{t("transfer.header.title")}</Text>
        <Text style={styles.headerSubtitle}>
          {t("transfer.header.subtitle")}
        </Text>

        {/* Formulaire de virement interne (affiché par défaut) */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>
            {t("transfer.form.internal.title")}
          </Text>

          {renderSourceAccountCard()}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {t("transfer.form.beneficiary.label.internal")}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t("transfer.form.beneficiary.placeholder.internal")}
              value={destinationAccount}
              onChangeText={(v) => setDestinationAccount(sanitize(v))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {t("transfer.form.amount.label")}
            </Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                keyboardType="numeric"
                underlineColorAndroid="transparent"
                value={amount}
                onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
              />
              <Text style={styles.amountCurrency}>XOF</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={async () => {
            setDone(false);
            if (!canSubmit) return;
            const ok = await submit({
              emitter: sourceAccount,
              beneficiary: destinationAccount,
              amount,
            });
            setDone(ok);
          }}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>
            {t("transfer.action.submit")}
          </Text>
        </TouchableOpacity>

        {isLoading && (
          <View style={{ marginTop: 10, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        {!!error && (
          <View style={{ marginTop: 10, alignItems: "center" }}>
            <Text style={{ color: colors.error }}>{error}</Text>
          </View>
        )}
        {!isLoading && !error && !canSubmit && (
          <View style={{ marginTop: 10, alignItems: "center" }}>
            <Text style={{ color: colors.text }}>
              {tText("Entrées invalides")}
            </Text>
          </View>
        )}
        {done && !error && (
          <View style={{ marginTop: 10, alignItems: "center" }}>
            <Text style={{ color: colors.success }}>
              {t("transfer.action.submit")} {tText("réussi")}
            </Text>
          </View>
        )}

        {/* Note de sécurité */}
        <View style={styles.secureNote}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.secureNoteText}>{t("transfer.note.secure")}</Text>
        </View>
      </ScrollView>
      {/* Espace en bas pour la navigation (comme Dashboard) */}
      <View style={styles.bottomSpace} />
    </SafeAreaView>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 40,
    },
    headerIconWrapper: {
      alignItems: "center",
      marginTop: 6,
      marginBottom: 12,
    },
    headerIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginTop: 14,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
      textAlign: "center",
      marginTop: 6,
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
      opacity: 0.7,
      marginBottom: 10,
    },
    formSection: {
      marginTop: 20,
    },
    formTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 12,
    },
    inputGroup: {
      marginBottom: 14,
    },
    inputLabel: {
      fontSize: 13,
      color: colors.text,
      opacity: 0.7,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.text,
    },
    // Styles pour la carte compte
    accountCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.text,
    },
    accountNumber: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      backgroundColor: "rgba(52, 199, 89, 0.1)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 6,
    },
    statusText: {
      fontSize: 12,
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
      color: colors.text,
      opacity: 0.7,
    },
    balanceValue: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      marginTop: 6,
    },
    balanceCurrency: {
      color: colors.primary,
      fontWeight: "800",
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
      textAlign: "right",
    },
    // Champ Montant stylé (comme le mockup)
    amountInputContainer: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: colors.primary,
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 2,
      overflow: "hidden",
    },
    amountInput: {
      flex: 1,
      fontSize: 36,
      fontWeight: "700",
      color: colors.text,
      paddingVertical: 0,
      backgroundColor: "transparent",
      borderWidth: 0,
      outlineWidth: 0,
      outlineColor: "transparent",
    },
    amountCurrency: {
      marginLeft: 12,
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      opacity: 0.7,
    },
    primaryButton: {
      marginTop: 24,
      backgroundColor: colors.primary,
      borderRadius: 24,
      paddingVertical: 16,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      shadowColor: colors.border,
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 4,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    secureNote: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    secureNoteText: {
      fontSize: 13,
      color: colors.text,
      opacity: 0.7,
    },
    // Espace en bas pour éviter le chevauchement avec la barre de navigation
    bottomSpace: {
      height: 30,
    },
  });

export default TransferScreen;
