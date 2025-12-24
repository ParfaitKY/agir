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
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const CreditSimulatorScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t, tText } = useI18n();
  const insets = useSafeAreaInsets();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 16 }}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [rate, setRate] = useState("");
  const [result, setResult] = useState<{
    monthly: number;
    total: number;
  } | null>(null);

  const calculate = () => {
    const P = parseFloat(amount);
    const n = parseFloat(duration); // mois
    const r = parseFloat(rate); // % annuel

    if (isNaN(P) || isNaN(n) || isNaN(r) || P <= 0 || n <= 0) {
      Alert.alert(t("common.error"), t("common.fillAllFields"));
      return;
    }

    // Formule mensualité : M = P * [i(1 + i)^n] / [(1 + i)^n – 1]
    // i = taux mensuel = r / 12 / 100
    const i = r / 12 / 100;

    let monthlyPayment = 0;
    let totalCost = 0;

    if (i === 0) {
      monthlyPayment = P / n;
      totalCost = P;
    } else {
      monthlyPayment = (P * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
      totalCost = monthlyPayment * n;
    }

    setResult({
      monthly: Math.round(monthlyPayment),
      total: Math.round(totalCost),
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, shadowColor: "#000" },
            ]}
          >
            {/* Montant */}
            <View
              style={[styles.inputContainer, { borderColor: colors.border }]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("credit.simulator.amount")}
                placeholderTextColor={colors.text + "80"}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              <Text style={[styles.mandatory, { color: colors.error }]}>
                {t("credit.simulator.mandatory")}
              </Text>
            </View>

            {/* Durée */}
            <View
              style={[styles.inputContainer, { borderColor: colors.border }]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("credit.simulator.duration")}
                placeholderTextColor={colors.text + "80"}
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
              <Text style={[styles.mandatory, { color: colors.error }]}>
                {t("credit.simulator.mandatory")}
              </Text>
            </View>

            {/* Taux */}
            <View
              style={[styles.inputContainer, { borderColor: colors.border }]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("credit.simulator.rate")}
                placeholderTextColor={colors.text + "80"}
                keyboardType="numeric"
                value={rate}
                onChangeText={setRate}
              />
              <Text style={[styles.mandatory, { color: colors.error }]}>
                {t("credit.simulator.mandatory")}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={calculate}
            >
              <Text style={styles.buttonText}>
                {t("credit.simulator.validate")}
              </Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                {t("credit.simulator.result")}
              </Text>

              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: colors.text }]}>
                  {t("credit.simulator.monthlyPayment")}:
                </Text>
                <Text style={[styles.resultValue, { color: colors.primary }]}>
                  {result.monthly.toLocaleString("fr-FR")} XAF
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: colors.text }]}>
                  {t("credit.simulator.totalCost")}:
                </Text>
                <Text style={[styles.resultValue, { color: colors.text }]}>
                  {result.total.toLocaleString("fr-FR")} XAF
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 55,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  mandatory: {
    fontSize: 12,
    color: "#FF8A80",
    opacity: 0.8,
  },
  button: {
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  resultCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
