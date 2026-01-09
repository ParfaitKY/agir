import React, { useState, useEffect } from "react";
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
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // ou "react-native-vector-icons/Ionicons"
import { MaterialCommunityIcons } from "@expo/vector-icons"; // ou Ionicons
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useCompteStatistiques } from "../../../domain/compte/useCompteStatistiques";

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
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"wallet" | "bank">("bank");

  const { data: compteStats, fetchData } = useCompteStatistiques();

  useEffect(() => {
    fetchData();
  }, []);

  const accounts = compteStats?.COMPTES || [];

  const handleQuickAmount = (value: number) => {
    setAmount(value);
  };

  const handleSubmit = () => {
    const from = transferType === "walletToBank" ? walletNumber : bankAccount;
    const to = transferType === "walletToBank" ? bankAccount : walletNumber;
    alert(`Transfert de ${amount} XAF: ${from} → ${to}`);
  };

  const renderAccountItem = ({ item }: { item: any }) => {
    const isSelected =
      pickerTarget === "wallet"
        ? walletNumber === item.NUMEROCOMPTE
        : bankAccount === item.NUMEROCOMPTE;

    return (
      <TouchableOpacity
        style={[
          styles.accountItem,
          { borderBottomColor: colors.border },
          isSelected && {
            backgroundColor: colors.primary + "10",
          },
        ]}
        onPress={() => {
          if (pickerTarget === "wallet") {
            setWalletNumber(item.NUMEROCOMPTE || "");
          } else {
            setBankAccount(item.NUMEROCOMPTE || "");
          }
          setShowAccountPicker(false);
        }}
      >
        <View style={styles.accountIcon}>
          <Ionicons
            name={
              String(item.CO_INTITULECOMPTE).includes("Epargne")
                ? "wallet-outline"
                : "briefcase-outline"
            }
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.accountLabel, { color: colors.text }]}>
            {item.CO_INTITULECOMPTE || "Compte"}
          </Text>
          <Text style={[styles.accountNumber, { color: colors.text + "80" }]}>
            {item.NUMEROCOMPTE}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
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
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                ]}
                onPress={() => {
                  setPickerTarget("wallet");
                  setShowAccountPicker(true);
                }}
              >
                <Text
                  style={{
                    color: walletNumber ? colors.text : colors.text + "60",
                  }}
                >
                  {walletNumber || t("placeholders.selectAccount")}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.text + "60"}
                />
              </TouchableOpacity>

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
                placeholder={
                  t("wallet.form.bankDest.placeholder") || "Compte bancaire"
                }
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
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                ]}
                onPress={() => {
                  setPickerTarget("bank");
                  setShowAccountPicker(true);
                }}
              >
                <Text
                  style={{
                    color: bankAccount ? colors.text : colors.text + "60",
                  }}
                >
                  {bankAccount || t("placeholders.selectAccount")}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.text + "60"}
                />
              </TouchableOpacity>

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
                placeholder={
                  t("wallet.form.walletDest.placeholder") || "Numéro Wallet"
                }
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

      {/* Account Picker Modal */}
      <Modal
        visible={showAccountPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAccountPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAccountPicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContent, { backgroundColor: colors.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("placeholders.selectAccount")}
              </Text>
              <TouchableOpacity onPress={() => setShowAccountPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={accounts}
              keyExtractor={(item, index) => String(item.id || index)}
              renderItem={renderAccountItem}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  accountLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  accountNumber: {
    fontSize: 14,
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
    maxHeight: "80%",
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
});

export default WalletScreens;
