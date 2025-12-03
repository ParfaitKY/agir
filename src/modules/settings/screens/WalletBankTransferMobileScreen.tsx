import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";

const WalletBankTransferMobileScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [account, setAccount] = useState("");
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [networkPickerVisible, setNetworkPickerVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const toNumber = (s: string) =>
    parseInt(String(s).replace(/[^0-9]/g, ""), 10) || 0;
  const MIN_AMOUNT = 300;
  const canSubmit =
    [account, network, phone].every((v) => String(v).trim().length > 0) &&
    toNumber(amount) >= MIN_AMOUNT;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, shadowColor: colors.text },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t("wallet.bankToMobile.title")}
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>
          {t("common.account")}
        </Text>
        <View
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <TextInput
            style={[styles.inputField, { color: colors.text }]}
            placeholder={t("placeholders.selectAccount")}
            placeholderTextColor={colors.text + "60"}
            value={account}
            onChangeText={setAccount}
          />
          <Ionicons name="chevron-down" size={18} color={colors.border} />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>
          {t("common.network")}
        </Text>
        <View
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <TouchableOpacity
            style={styles.inputField}
            activeOpacity={0.8}
            onPress={() => setNetworkPickerVisible(true)}
          >
            <Text style={{ color: network ? colors.text : colors.text + "60" }}>
              {network || t("placeholders.selectNetwork")}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>
          {t("common.phone")}
        </Text>
        <View
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <TextInput
            style={[styles.inputField, { color: colors.text }]}
            placeholder={t("placeholders.selectPhone")}
            keyboardType="phone-pad"
            placeholderTextColor={colors.text + "60"}
            value={phone}
            onChangeText={setPhone}
          />
          <Ionicons name="chevron-down" size={18} color={colors.border} />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>
          {t("wallet.amountReceived")}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.text,
            },
          ]}
          placeholder={`${t("placeholders.minimum")} : ${MIN_AMOUNT} F CFA (${t(
            "common.required"
          )})`}
          placeholderTextColor={colors.text + "60"}
          keyboardType="numeric"
          value={amount}
          onChangeText={(text) => setAmount(String(toNumber(text)))}
        />

        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: canSubmit ? "#E77A82" : colors.border },
          ]}
          activeOpacity={0.8}
          disabled={!canSubmit}
          onPress={() => {
            const amt = toNumber(amount);
            const hasAll = [account, network, phone].every(
              (v) => String(v).trim().length > 0
            );
            if (!hasAll) {
              Alert.alert(t("common.info"), t("common.fillAllFields"));
              return;
            }
            if (amt < MIN_AMOUNT) {
              Alert.alert(
                t("common.info"),
                `${t("placeholders.minimum")} : ${MIN_AMOUNT} F CFA`
              );
              return;
            }
            setShowModal(true);
          }}
        >
          <Text style={styles.submitText}>{t("common.validate")}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("common.verification")}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.text + "90" }]}>
              {t("wallet.verifyText")}
            </Text>

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.text + "90" }]}>
                {t("common.phone")}
              </Text>
              <Text style={[styles.modalValue, { color: colors.text }]}>
                {phone}
              </Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.text + "90" }]}>
                {t("wallet.feesZero")}
              </Text>
              <Text style={[styles.modalValue, { color: colors.text }]}>
                0 F CFA
              </Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.text + "90" }]}>
                {t("wallet.amountSent")}
              </Text>
              <Text style={[styles.modalValue, { color: colors.text }]}>
                {toNumber(amount)} F CFA
              </Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabelBold, { color: colors.text }]}>
                {t("wallet.amountReceived")}
              </Text>
              <Text style={[styles.modalValueBold, { color: colors.text }]}>
                {toNumber(amount)} F CFA
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              placeholder={`${t("wallet.validationCode")} (${t(
                "common.required"
              )})`}
              placeholderTextColor={colors.text + "60"}
              value={otp}
              onChangeText={setOtp}
            />

            <View
              style={[styles.modalDivider, { borderTopColor: colors.border }]}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: "#E77A82" }]}
              activeOpacity={0.8}
              disabled={!otp.trim().length}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalSubmitText}>{t("wallet.transfer")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={networkPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNetworkPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("placeholders.selectNetwork")}
            </Text>
            {[
              { key: "MTN", bg: "#F7D000", fg: "#000" },
              { key: "MOOV", bg: "#00A651", fg: "#fff" },
              { key: "ORANGE", bg: "#FF7900", fg: "#fff" },
              { key: "WAVE", bg: "#1C64F2", fg: "#fff" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.pickerOption}
                onPress={() => {
                  setNetwork(opt.key);
                  setNetworkPickerVisible(false);
                }}
              >
                <View style={[styles.networkLogo, { backgroundColor: opt.bg }]}>
                  <Text style={[styles.networkLogoText, { color: opt.fg }]}>
                    {opt.key}
                  </Text>
                </View>
                <Text
                  style={[styles.pickerOptionTitle, { color: colors.text }]}
                >
                  {opt.key}
                </Text>
                {network === opt.key && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 25 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  inputField: { flex: 1 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  submitBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
    alignSelf: "center",
    marginHorizontal: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  modalSubtitle: { fontSize: 13, marginBottom: 16 },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalLabel: { fontSize: 13 },
  modalValue: { fontSize: 13, fontWeight: "600" },
  modalLabelBold: { fontSize: 14, fontWeight: "700" },
  modalValueBold: { fontSize: 14, fontWeight: "700" },
  modalSubmitBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitText: { color: "#fff", fontWeight: "700" },
  modalDivider: { borderTopWidth: 1, marginVertical: 12 },

  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: { fontSize: 14, fontWeight: "600" },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  networkLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  networkLogoText: { fontSize: 12, fontWeight: "800" },
  pickerOptionTitle: { fontSize: 15, fontWeight: "600" },
});

export default WalletBankTransferMobileScreen;
