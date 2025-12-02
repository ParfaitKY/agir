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

const WalletMobileTransferBankScreen: React.FC = () => {
  const { colors } = useTheme();
  const [account, setAccount] = useState("");
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [otp, setOtp] = useState("");
  const toNumber = (s: string) =>
    parseInt(String(s).replace(/[^0-9]/g, ""), 10) || 0;
  const MIN_AMOUNT = 200;
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
          Mobile vers banque
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>Compte</Text>
        <View
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <TextInput
            style={[styles.inputField, { color: colors.text }]}
            placeholder="Sélectionnez un compte"
            placeholderTextColor={colors.text + "60"}
            value={account}
            onChangeText={setAccount}
          />
          <Ionicons name="chevron-down" size={18} color={colors.border} />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Réseau</Text>
        <View
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <TextInput
            style={[styles.inputField, { color: colors.text }]}
            placeholder="Sélectionnez un réseau"
            placeholderTextColor={colors.text + "60"}
            value={network}
            onChangeText={setNetwork}
          />
          <Ionicons name="chevron-down" size={18} color={colors.border} />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Téléphone</Text>
        <View
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <TextInput
            style={[styles.inputField, { color: colors.text }]}
            placeholder="Sélectionnez un téléphone"
            placeholderTextColor={colors.text + "60"}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Ionicons name="chevron-down" size={18} color={colors.border} />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Montant reçu</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.text,
            },
          ]}
          placeholder={`Minimum : ${MIN_AMOUNT} F CFA (obligatoire)`}
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
              Alert.alert("Information", "Remplissez tous les champs");
              return;
            }
            if (amt < MIN_AMOUNT) {
              Alert.alert(
                "Information",
                `Montant minimum : ${MIN_AMOUNT} F CFA`
              );
              return;
            }
            setShowModal(true);
          }}
        >
          <Text style={styles.submitText}>VALIDER</Text>
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
              Vérification
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.text + "90" }]}>
              Veuillez confirmer la transaction en renseignant le code de
              validation reçu par sms et/ou par Email.
            </Text>

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.text + "90" }]}>
                Téléphone
              </Text>
              <Text style={[styles.modalValue, { color: colors.text }]}>
                {phone}
              </Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.text + "90" }]}>
                Frais = 0 % + 0 FCFA
              </Text>
              <Text style={[styles.modalValue, { color: colors.text }]}>
                0 F CFA
              </Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: colors.text + "90" }]}>
                Montant envoyé
              </Text>
              <Text style={[styles.modalValue, { color: colors.text }]}>
                {toNumber(amount)} F CFA
              </Text>
            </View>

            <View style={styles.modalRow}>
              <Text style={[styles.modalLabelBold, { color: colors.text }]}>
                Montant reçu
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
              placeholder="Code de validation (obligatoire)"
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
              <Text style={styles.modalSubmitText}>TRANSFÉRER</Text>
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
});

export default WalletMobileTransferBankScreen;
