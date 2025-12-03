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
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useVirement } from "../../../domain/compte/useVirement";
import { ActivityIndicator } from "react-native";
import { secureGetItem } from "../../../shared/utils/secureStorage";

export const TransferScreen: React.FC = () => {
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const [type, setType] = useState<"interne" | "externe">("interne");
  const [sourceAccount, setSourceAccount] = useState("");
  const [destinationAccount, setDestinationAccount] = useState("");
  const [amount, setAmount] = useState("");
  const { submit, isLoading, error, data } = useVirement();
  const [done, setDone] = useState(false);
  const sanitize = (s: string) => s.replace(/\D/g, "");
  React.useEffect(() => {
    const run = async () => {
      const acc = (await secureGetItem("user_account_number")) || "";
      setSourceAccount(sanitize(acc));
    };
    run();
  }, []);
  const canSubmit =
    sanitize(sourceAccount).length > 0 &&
    sanitize(destinationAccount).length > 0 &&
    Number(String(amount).replace(/[,\s]/g, "")) > 0;

  const styles = getStyles(colors);

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

        {/* Type de virement */}
        <Text style={styles.sectionLabel}>{t("transfer.section.type")}</Text>

        <TouchableOpacity
          style={[styles.typeCard, type === "interne" && styles.typeCardActive]}
          onPress={() => setType("interne")}
          activeOpacity={0.8}
        >
          <View style={styles.typeLeft}>
            <View
              style={[
                styles.typeIconCircle,
                type === "interne" && styles.typeIconCircleActive,
              ]}
            >
              <Ionicons
                name="swap-horizontal"
                size={22}
                color={type === "interne" ? "#fff" : colors.primary}
              />
            </View>
            <View>
              <Text
                style={[
                  styles.typeTitle,
                  type === "interne" && styles.typeTitleActive,
                ]}
              >
                {t("transfer.type.internal.title")}
              </Text>
              <Text
                style={[
                  styles.typeSubtitle,
                  type === "interne" && styles.typeSubtitleActive,
                ]}
              >
                {t("transfer.type.internal.subtitle")}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.checkCircle,
              type === "interne" && styles.checkCircleActive,
            ]}
          >
            {type === "interne" && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeCard, type === "externe" && styles.typeCardActive]}
          onPress={() => setType("externe")}
          activeOpacity={0.8}
        >
          <View style={styles.typeLeft}>
            <View
              style={[
                styles.typeIconCircle,
                styles.typeIconCircleAlt,
                type === "externe" && styles.typeIconCircleActive,
              ]}
            >
              <Ionicons
                name="send-outline"
                size={20}
                color={type === "externe" ? "#fff" : colors.primary}
              />
            </View>
            <View>
              <Text
                style={[
                  styles.typeTitle,
                  type === "externe" && styles.typeTitleActive,
                ]}
              >
                {t("transfer.type.external.title")}
              </Text>
              <Text
                style={[
                  styles.typeSubtitle,
                  type === "externe" && styles.typeSubtitleActive,
                ]}
              >
                {t("transfer.type.external.subtitle")}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.checkCircle,
              type === "externe" && styles.checkCircleActive,
            ]}
          >
            {type === "externe" && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>

        {/* Formulaire de virement interne */}
        {type === "interne" && (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>
              {t("transfer.form.internal.title")}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t("transfer.form.source.label")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("transfer.form.source.placeholder")}
                value={sourceAccount}
                onChangeText={(v) => setSourceAccount(sanitize(v))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t("transfer.form.beneficiary.label.internal")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t(
                  "transfer.form.beneficiary.placeholder.internal"
                )}
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
                <Text style={styles.amountCurrency}>XAF</Text>
              </View>
            </View>
          </View>
        )}

        {/* Formulaire de virement externe (même structure) */}
        {type === "externe" && (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>
              {t("transfer.form.external.title")}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t("transfer.form.source.label")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("transfer.form.source.placeholder")}
                value={sourceAccount}
                onChangeText={(v) => setSourceAccount(sanitize(v))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t("transfer.form.beneficiary.label.external")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t(
                  "transfer.form.beneficiary.placeholder.external"
                )}
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
                <Text style={styles.amountCurrency}>XAF</Text>
              </View>
            </View>
          </View>
        )}

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
    typeCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    typeCardActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    typeIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
    },
    typeIconCircleActive: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
    },
    typeIconCircleAlt: {
      backgroundColor: colors.card,
    },
    typeTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    typeSubtitle: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    typeTitleActive: {
      color: "#fff",
    },
    typeSubtitleActive: {
      color: "#E6F0FF",
    },
    checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.card,
    },
    checkCircleActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
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
