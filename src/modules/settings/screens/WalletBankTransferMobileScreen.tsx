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
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useWalletBankToMobileLogic } from "../../../domain/wallet/useWalletBankToMobileLogic";

const WalletBankTransferMobileScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useI18n();

  const {
    loading,
    calculatingFees,
    submitting,
    phones,
    accounts,
    networks,
    form,
    fees,
    balance,
    showTokenModal,
    otp,
    setForm,
    setOtp,
    setShowTokenModal,
    handleSubmit,
    confirmTransaction,
  } = useWalletBankToMobileLogic();

  const [pickerVisible, setPickerVisible] = useState<{
    type: "account" | "network" | "phone" | null;
  }>({ type: null });

  const toNumber = (s: string) =>
    parseInt(String(s).replace(/[^0-9]/g, ""), 10) || 0;
  const MIN_AMOUNT = 500;

  const canSubmit =
    !!form.account &&
    !!form.networkCode &&
    !!form.phoneId &&
    toNumber(form.amount) >= MIN_AMOUNT;

  const getDisplayValue = (type: "account" | "network" | "phone") => {
    if (type === "account") {
      const found = accounts.find((a) => a.CO_CODECOMPTE === form.account);
      return found ? found.NUMEROCOMPTE : "";
    }
    if (type === "network") {
      const found = networks.find((n) => n.IN_CODESERVICE === form.networkCode);
      return found ? found.IN_LIBELLE : "";
    }
    if (type === "phone") {
      return form.phoneNum;
    }
    return "";
  };

  const renderPickerItem = ({ item }: { item: any }) => {
    let label = "";
    let value = "";

    if (pickerVisible.type === "account") {
      label = item.NUMEROCOMPTE;
      value = item.CO_CODECOMPTE;
    } else if (pickerVisible.type === "network") {
      label = item.IN_LIBELLE;
      value = item.IN_CODESERVICE;
    } else if (pickerVisible.type === "phone") {
      label = item.SO_TELEPHONE;
      value = item.SO_CODESOUSCRIPTION;
    }

    return (
      <TouchableOpacity
        style={[styles.pickerItem, { borderBottomColor: colors.border }]}
        onPress={() => {
          if (pickerVisible.type === "account") {
            setForm((f) => ({ ...f, account: value }));
          } else if (pickerVisible.type === "network") {
            setForm((f) => ({
              ...f,
              networkCode: value,
              networkAbbr: item.IN_ABREVIATIONSERVICE,
            }));
          } else if (pickerVisible.type === "phone") {
            setForm((f) => ({
              ...f,
              phoneId: value,
              phoneNum: item.SO_TELEPHONE,
            }));
          }
          setPickerVisible({ type: null });
        }}
      >
        <Text style={[styles.pickerItemText, { color: colors.text }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

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

        {/* Phones (Load First) */}
        <Text style={[styles.label, { color: colors.text }]}>
          {t("common.phone")}
        </Text>
        <TouchableOpacity
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
          onPress={() => setPickerVisible({ type: "phone" })}
        >
          <Text
            style={[
              styles.inputText,
              { color: form.phoneId ? colors.text : colors.text + "60" },
            ]}
          >
            {getDisplayValue("phone") || t("placeholders.selectPhone")}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.border} />
        </TouchableOpacity>

        {/* Accounts */}
        <Text style={[styles.label, { color: colors.text }]}>
          {t("common.account")}
        </Text>
        <TouchableOpacity
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
          onPress={() => setPickerVisible({ type: "account" })}
        >
          <Text
            style={[
              styles.inputText,
              { color: form.account ? colors.text : colors.text + "60" },
            ]}
          >
            {getDisplayValue("account") || t("placeholders.selectAccount")}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.border} />
        </TouchableOpacity>
        {!!form.account && (
          <Text
            style={{ fontSize: 12, color: colors.primary, marginBottom: 10 }}
          >
            Solde disponible: {balance} F CFA
          </Text>
        )}

        {/* Networks */}
        <Text style={[styles.label, { color: colors.text }]}>
          {t("common.network")}
        </Text>
        <TouchableOpacity
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
          onPress={() => setPickerVisible({ type: "network" })}
        >
          <Text
            style={[
              styles.inputText,
              { color: form.networkCode ? colors.text : colors.text + "60" },
            ]}
          >
            {getDisplayValue("network") || t("placeholders.selectNetwork")}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.border} />
        </TouchableOpacity>

        {/* Amount */}
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
          value={form.amount}
          onChangeText={(text) =>
            setForm((f) => ({ ...f, amount: String(toNumber(text)) }))
          }
        />

        {/* Fees Display */}
        {calculatingFees ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginBottom: 10 }}
          />
        ) : fees ? (
          <View
            style={[
              styles.feesContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={{ color: colors.text }}>
              Frais: {fees.commission} F CFA
            </Text>
            <Text style={{ color: colors.text, fontWeight: "bold" }}>
              Total débité: {fees.total} F CFA
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: canSubmit ? colors.primary : colors.border },
          ]}
          activeOpacity={0.8}
          disabled={!canSubmit || loading || submitting}
          onPress={handleSubmit}
        >
          {loading || submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{t("common.validate")}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Picker Modal */}
      <Modal
        visible={!!pickerVisible.type}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible({ type: null })}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, width: "90%", maxHeight: "70%" },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("common.select")}
            </Text>
            <FlatList
              data={
                pickerVisible.type === "account"
                  ? accounts
                  : pickerVisible.type === "network"
                  ? networks
                  : pickerVisible.type === "phone"
                  ? phones
                  : []
              }
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderPickerItem}
              ListEmptyComponent={
                <Text
                  style={{
                    padding: 20,
                    textAlign: "center",
                    color: colors.text,
                  }}
                >
                  {loading ? "Chargement..." : "Aucune donnée disponible"}
                </Text>
              }
            />
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.border }]}
              onPress={() => setPickerVisible({ type: null })}
            >
              <Text style={{ color: colors.text }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OTP Modal */}
      <Modal
        visible={showTokenModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTokenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("common.verification")}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.text + "90" }]}>
              Un code de validation a été envoyé par SMS/Email.
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
              placeholder={t("wallet.validationCode")}
              placeholderTextColor={colors.text + "60"}
              value={otp}
              onChangeText={setOtp}
            />

            <View
              style={[styles.modalDivider, { borderTopColor: colors.border }]}
            />

            <TouchableOpacity
              style={[
                styles.modalSubmitBtn,
                { backgroundColor: colors.primary },
              ]}
              activeOpacity={0.8}
              disabled={!otp.trim()}
              onPress={confirmTransaction}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSubmitText}>
                  {t("common.validate")}
                </Text>
              )}
            </TouchableOpacity>
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
  inputText: { flex: 1 },
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  modalSubtitle: { fontSize: 13, marginBottom: 16 },
  modalSubmitBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitText: { color: "#fff", fontWeight: "700" },
  modalDivider: { borderTopWidth: 1, marginVertical: 12 },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 16,
  },
  closeBtn: {
    marginTop: 10,
    padding: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  feesContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
});

export default WalletBankTransferMobileScreen;
