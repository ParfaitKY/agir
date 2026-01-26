import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";

export interface NewBeneficiaire {
  name: string;
  accountNumber: string;
  bank: string;
  email?: string;
}

interface AddBeneficiaireModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (beneficiaire: NewBeneficiaire) => void;
}

const BANKS = [
  "CEDAICI SA",
  "Ecobank",
  "SGBCI",
  "NSIA Banque",
  "BOA",
  "SIB",
  "BICICI",
  "BNI",
  "Coris Bank",
  "UBA",
  "BGFI Bank",
  "Orabank",
  "Afriland First Bank",
  "GTBank",
  "Bridge Bank Group",
  "Versus Bank",
  "Autre Banque",
];

export default function AddBeneficiaireModal({
  visible,
  onClose,
  onAdd,
}: AddBeneficiaireModalProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bank, setBank] = useState("");
  const [email, setEmail] = useState("");
  const [showBankPicker, setShowBankPicker] = useState(false);

  const handleAdd = () => {
    if (!name.trim() || !accountNumber.trim() || !bank) return;

    onAdd({
      name: name.trim(),
      accountNumber: accountNumber.trim(),
      bank,
      email: email.trim() || undefined,
    });

    resetForm();
  };

  const resetForm = () => {
    setName("");
    setAccountNumber("");
    setBank("");
    setEmail("");
    setShowBankPicker(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={resetForm}
    >
      <View
        style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("beneficiaries.modal.title")}
            </Text>
            <TouchableOpacity onPress={resetForm}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("beneficiaries.modal.fullName")}{" "}
                <Text style={[styles.required, { color: colors.error }]}>
                  *
                </Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Ex: Jean Dupont"
                placeholderTextColor={colors.text + "80"}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("beneficiaries.modal.accountNumber")}{" "}
                <Text style={[styles.required, { color: colors.error }]}>
                  *
                </Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                autoCapitalize="characters"
                placeholder="Ex: 00007950001"
                placeholderTextColor={colors.text + "80"}
                value={accountNumber}
                onChangeText={(text) => setAccountNumber(text.toUpperCase())}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("beneficiaries.modal.bank")}{" "}
                <Text style={[styles.required, { color: colors.error }]}>
                  *
                </Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowBankPicker(!showBankPicker)}
              >
                <Text
                  style={
                    !bank
                      ? [styles.placeholder, { color: colors.text + "80" }]
                      : { color: colors.text }
                  }
                >
                  {bank || t("beneficiaries.modal.selectBank")}
                </Text>
                <Text style={{ color: colors.text }}>
                  {showBankPicker ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>
              {showBankPicker && (
                <View style={styles.pickerList}>
                  {BANKS.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[
                        styles.pickerItem,
                        bank === b && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        setBank(b);
                        setShowBankPicker(false);
                      }}
                    >
                      <Text>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t("beneficiaries.modal.emailOptional")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: jean.dupont@email.com"
                value={email}
                onChangeText={(text) => setEmail(text.toUpperCase())}
              />
            </View>
          </ScrollView>

          <View
            style={[styles.modalFooter, { borderTopColor: colors.border }]}
          >
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: colors.border }]}
              onPress={resetForm}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.addBtn,
                { backgroundColor: colors.primary },
                !name.trim() || !accountNumber.trim() || !bank
                  ? styles.disabledBtn
                  : null,
              ]}
              disabled={!name.trim() || !accountNumber.trim() || !bank}
              onPress={handleAdd}
            >
              <Text style={[styles.addText, { color: colors.card }]}>
                {t("beneficiaries.modal.save")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end", // aligné en bas
    alignItems: "center",
    padding: 0,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  modalContent: { padding: 16 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  required: { color: "#f44336" },
  input: {
    width: "100%",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    textTransform: "uppercase",
  },
  pickerButton: {
    width: "100%",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  placeholder: {},
  pickerList: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerItemSelected: {
    backgroundColor: "#e6f0ff",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  cancelText: { color: "#666", fontWeight: "600" },
  addBtn: {
    flex: 1,
    backgroundColor: "#0066cc",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  addText: { color: "#fff", fontWeight: "600" },
  disabledBtn: { backgroundColor: "#ccc" },
});
