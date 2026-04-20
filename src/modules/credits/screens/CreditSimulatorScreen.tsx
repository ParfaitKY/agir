import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";
import { Ionicons } from "@expo/vector-icons";

export const CreditSimulatorScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t, tText } = useI18n();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 16 }}>
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [rate, setRate] = useState("");
  const [result, setResult] = useState<{ monthly: number; total: number; interest: number } | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const calculate = () => {
    const P = parseFloat(amount.replace(/\s/g, ""));
    const n = parseFloat(duration);
    const r = parseFloat(rate);

    if (isNaN(P) || isNaN(n) || isNaN(r) || P <= 0 || n <= 0) {
      Alert.alert(t("common.error"), t("common.fillAllFields"));
      return;
    }
    const totalCost = P * (1 + (r / 100) * (n / 12));
    const monthlyPayment = totalCost / n;
    const interest = totalCost - P;

    setResult({
      monthly: Math.round(monthlyPayment),
      total: Math.round(totalCost),
      interest: Math.round(interest),
    });
  };

  const styles = getStyles(colors);

  const Field = ({
    icon,
    label,
    placeholder,
    value,
    onChange,
    suffix,
    fieldKey,
  }: {
    icon: string;
    label: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    suffix?: string;
    fieldKey: string;
  }) => {
    const isFocused = focusedField === fieldKey;
    return (
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View
          style={[
            styles.fieldRow,
            {
              borderColor: isFocused ? colors.primary : colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <View style={[styles.fieldIconBg, { backgroundColor: colors.primary + "18" }]}>
            <Ionicons name={icon as any} size={18} color={colors.primary} />
          </View>
          <TextInput
            style={[styles.fieldInput, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={colors.text + "50"}
            keyboardType="numeric"
            value={value}
            onChangeText={onChange}
            onFocus={() => setFocusedField(fieldKey)}
            onBlur={() => setFocusedField(null)}
          />
          {suffix && (
            <Text style={[styles.fieldSuffix, { color: colors.primary }]}>{suffix}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero header */}
        <View style={styles.hero}>
          <View style={[styles.heroCircle, { backgroundColor: colors.primary + "18" }]}>
            <Ionicons name="calculator" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {tText("Simulateur de crédit")}
          </Text>
          <Text style={[styles.heroSub, { color: colors.text + "70" }]}>
            {tText("Estimez vos mensualités en quelques secondes")}
          </Text>
        </View>

        {/* Form card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field
            fieldKey="amount"
            icon="cash-outline"
            label={tText("Montant du crédit")}
            placeholder="Ex : 500 000"
            value={amount}
            onChange={setAmount}
            suffix="XOF"
          />
          <Field
            fieldKey="duration"
            icon="time-outline"
            label={tText("Durée")}
            placeholder="Ex : 24"
            value={duration}
            onChange={setDuration}
            suffix={tText("mois")}
          />
          <Field
            fieldKey="rate"
            icon="trending-up-outline"
            label={tText("Taux d'intérêt annuel")}
            placeholder="Ex : 12"
            value={rate}
            onChange={setRate}
            suffix="%"
          />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={calculate}
            activeOpacity={0.85}
          >
            <Ionicons name="calculator-outline" size={20} color="#fff" />
            <Text style={styles.btnText}>{tText("Calculer")}</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {result && (
          <View style={styles.resultsWrapper}>
            <Text style={[styles.resultsHeading, { color: colors.text }]}>
              {tText("Résultats de la simulation")}
            </Text>

            {/* Main monthly card */}
            <View style={[styles.mainResultCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.mainResultLabel}>{tText("Mensualité estimée")}</Text>
              <Text style={styles.mainResultValue}>
                {result.monthly.toLocaleString("fr-FR")}
              </Text>
              <Text style={styles.mainResultCurrency}>XOF / mois</Text>
            </View>

            {/* Detail cards */}
            <View style={styles.detailRow}>
              <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.detailIcon, { backgroundColor: colors.success + "18" }]}>
                  <Ionicons name="cash-outline" size={18} color={colors.success} />
                </View>
                <Text style={[styles.detailLabel, { color: colors.text + "70" }]}>
                  {tText("Coût total")}
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {result.total.toLocaleString("fr-FR")}
                </Text>
                <Text style={[styles.detailCurrency, { color: colors.text + "60" }]}>XOF</Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.detailIcon, { backgroundColor: colors.error + "18" }]}>
                  <Ionicons name="trending-up-outline" size={18} color={colors.error} />
                </View>
                <Text style={[styles.detailLabel, { color: colors.text + "70" }]}>
                  {tText("Intérêts")}
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {result.interest.toLocaleString("fr-FR")}
                </Text>
                <Text style={[styles.detailCurrency, { color: colors.text + "60" }]}>XOF</Text>
              </View>
            </View>

            <View style={[styles.disclaimer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.disclaimerText, { color: colors.text + "80" }]}>
                {tText("Simulation indicative. Contactez votre conseiller pour une offre personnalisée.")}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingTop: 10 },

    // Hero
    hero: { alignItems: "center", paddingVertical: 24 },
    heroCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },
    heroTitle: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
    heroSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },

    // Form card
    card: {
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      marginBottom: 24,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 3,
    },

    // Field
    fieldWrapper: { marginBottom: 16 },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      opacity: 0.7,
      marginBottom: 6,
    },
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderRadius: 14,
      overflow: "hidden",
      height: 52,
    },
    fieldIconBg: {
      width: 48,
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    fieldInput: {
      flex: 1,
      fontSize: 16,
      paddingHorizontal: 8,
    },
    fieldSuffix: {
      fontSize: 14,
      fontWeight: "700",
      paddingRight: 14,
    },

    // Button
    btn: {
      marginTop: 8,
      height: 54,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 4,
    },
    btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

    // Results
    resultsWrapper: { gap: 14 },
    resultsHeading: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 4,
    },
    mainResultCard: {
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 14,
      elevation: 5,
    },
    mainResultLabel: {
      color: "rgba(255,255,255,0.8)",
      fontSize: 14,
      marginBottom: 8,
    },
    mainResultValue: {
      color: "#fff",
      fontSize: 42,
      fontWeight: "800",
      letterSpacing: -1,
    },
    mainResultCurrency: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 16,
      marginTop: 4,
    },
    detailRow: { flexDirection: "row", gap: 12 },
    detailCard: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      alignItems: "center",
      gap: 4,
    },
    detailIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 4,
    },
    detailLabel: { fontSize: 12, textAlign: "center" },
    detailValue: { fontSize: 18, fontWeight: "800" },
    detailCurrency: { fontSize: 11 },
    disclaimer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
    },
    disclaimerText: { flex: 1, fontSize: 12, lineHeight: 18 },
  });

export default CreditSimulatorScreen;
