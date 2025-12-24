import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // ou "react-native-vector-icons/Ionicons"
import { MaterialCommunityIcons } from "@expo/vector-icons"; // ou Ionicons
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";

const WalletScreens: React.FC = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [transferType, setTransferType] = useState<
    "walletToBank" | "bankToWallet"
  >("walletToBank");
  const [walletNumber, setWalletNumber] = useState<string>("");
  const [bankAccount, setBankAccount] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

  const handleQuickAmount = (value: number) => {
    setAmount(value);
  };

  const handleSubmit = () => {
    const from = transferType === "walletToBank" ? walletNumber : bankAccount;
    const to = transferType === "walletToBank" ? bankAccount : walletNumber;
    alert(`Transfert de ${amount} XAF: ${from} → ${to}`);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            padding: width < 360 ? 12 : 16,
          },
        ]}
      >
        {/* HEADER */}
        <View
          style={[
            styles.headerCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={{
              backgroundColor: colors.primary, // fond bleu du thème
              borderRadius: 25, // rond si largeur = hauteur
              width: 50,
              height: 50,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="wallet-outline"
              size={28}
              color={colors.background}
            />
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("wallet.header.title")}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.text + "80" }]}
            >
              {t("wallet.header.subtitle")}
            </Text>
          </View>
        </View>

        {/* TRANSFER TYPE */}
        <View style={styles.transferTypeRow}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              transferType === "walletToBank" && [
                styles.typeBtnActive,
                { backgroundColor: colors.primary },
              ],
              {
                backgroundColor:
                  transferType === "walletToBank"
                    ? colors.primary
                    : colors.card,
                borderColor:
                  transferType === "walletToBank"
                    ? colors.primary
                    : colors.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => setTransferType("walletToBank")}
          >
            <View style={{ marginBottom: 8 }}>
              <Ionicons
                name="arrow-up-circle-outline"
                size={28}
                color={
                  transferType === "walletToBank"
                    ? colors.background
                    : colors.primary
                }
              />
            </View>
            <Text
              style={{
                fontWeight: "bold",
                color:
                  transferType === "walletToBank"
                    ? colors.background
                    : colors.text,
              }}
            >
              {t("wallet.type.walletToBank.title")}
            </Text>
            <Text
              style={[
                styles.typeBtnText,
                {
                  color:
                    transferType === "walletToBank"
                      ? colors.background
                      : colors.text + "80",
                },
              ]}
            >
              {t("wallet.type.walletToBank.subtitle")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              transferType === "bankToWallet" && [
                styles.typeBtnActive,
                { backgroundColor: "#4CAF50" }, // Vert pour Bank to Wallet (Entrée)
              ],
              {
                backgroundColor:
                  transferType === "bankToWallet" ? "#4CAF50" : colors.card,
                borderColor:
                  transferType === "bankToWallet" ? "#4CAF50" : colors.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => setTransferType("bankToWallet")}
          >
            <View style={{ marginBottom: 8 }}>
              <Ionicons
                name="arrow-down-circle-outline"
                size={28}
                color={
                  transferType === "bankToWallet"
                    ? colors.background
                    : "#4CAF50"
                }
              />
            </View>
            <Text
              style={{
                fontWeight: "bold",
                color:
                  transferType === "bankToWallet"
                    ? colors.background
                    : colors.text,
              }}
            >
              {t("wallet.type.bankToWallet.title")}
            </Text>
            <Text
              style={[
                styles.typeBtnText,
                {
                  color:
                    transferType === "bankToWallet"
                      ? colors.background
                      : colors.text + "80",
                },
              ]}
            >
              {t("wallet.type.bankToWallet.subtitle")}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Ionicons
            name={
              transferType === "walletToBank"
                ? "arrow-forward-outline"
                : "arrow-back-outline"
            }
            size={18}
            color={colors.primary}
          />
        </View>

        {/* FORM */}
        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {transferType === "walletToBank" ? (
            <>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("wallet.form.walletSource.label")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t("wallet.form.walletSource.placeholder")}
                placeholderTextColor={colors.text + "60"}
                value={walletNumber}
                onChangeText={setWalletNumber}
              />

              <Text style={[styles.label, { color: colors.text }]}>
                {t("wallet.form.bankDest.label")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t("wallet.form.bankDest.placeholder")}
                placeholderTextColor={colors.text + "60"}
                value={bankAccount}
                onChangeText={setBankAccount}
              />
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("wallet.form.bankSource.label")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t("wallet.form.bankDest.placeholder")}
                placeholderTextColor={colors.text + "60"}
                value={bankAccount}
                onChangeText={setBankAccount}
              />

              <Text style={[styles.label, { color: colors.text }]}>
                {t("wallet.form.walletDest.label")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t("wallet.form.walletSource.placeholder")}
                placeholderTextColor={colors.text + "60"}
                value={walletNumber}
                onChangeText={setWalletNumber}
              />
            </>
          )}

          <Text style={[styles.label, { color: colors.text }]}>
            {t("wallet.form.amount.label")}
          </Text>
          <View style={styles.amountRow}>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 1,
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              keyboardType="numeric"
              placeholderTextColor={colors.text + "60"}
              value={amount.toString()}
              onChangeText={(text) => setAmount(Number(text) || 0)}
            />
            <Text style={[styles.currency, { color: colors.text }]}>
              {t("common.currency.xaf")}
            </Text>
          </View>

          {/* QUICK AMOUNTS */}
          <View style={styles.quickRow}>
            {[10000, 25000, 50000, 100000].map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.quickBtn,
                  {
                    backgroundColor: colors.success + "20",
                    borderColor: colors.success,
                  },
                ]}
                onPress={() => handleQuickAmount(val)}
              >
                <Text style={{ color: colors.success, fontWeight: "bold" }}>
                  {val / 1000}k
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={colors.background}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.submitText, { color: colors.background }]}>
                {t("wallet.action.submit")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.success,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 8,
              }}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={14}
                color={colors.background}
              />
            </View>
            <Text style={[styles.secure, { color: colors.text + "80" }]}>
              {t("wallet.note.secure")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7", padding: 16 },

  headerCard: {
    backgroundColor: "#fff",
    alignItems: "center",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { fontSize: 14, color: "#666", marginTop: 5 },

  transferTypeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: "center",
  },
  typeBtnActive: { backgroundColor: "#0066CC" },
  typeBtnText: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
    textAlign: "center",
  },

  formCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  label: { fontWeight: "bold", marginBottom: 5, marginTop: 10 },
  input: {
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  amountRow: { flexDirection: "row", alignItems: "center" },
  currency: { marginLeft: 8, fontWeight: "bold", fontSize: 16 },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    flexWrap: "wrap",
  },
  quickBtn: {
    flex: 1,
    backgroundColor: "#b2ffb8ff",
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#7cbe81ff", // couleur de la bordure
  },

  submitBtn: {
    backgroundColor: "#0066CC",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "bold" },
  secure: {
    color: "#727272ff",
  },
});

export default WalletScreens;
