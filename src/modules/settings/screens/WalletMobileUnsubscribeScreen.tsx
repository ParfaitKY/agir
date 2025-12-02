import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../shared/styles/ThemeProvider";

const WalletMobileUnsubscribeScreen: React.FC = () => {
  const { colors } = useTheme();
  const [account, setAccount] = useState("");
  const [phone, setPhone] = useState("");

  const canSubmit = [account, phone].every((v) => String(v).trim().length > 0);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, shadowColor: colors.text },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Compte mobile</Text>

        <Text style={[styles.label, { color: colors.text }]}>Compte</Text>
        <View
          style={[
            styles.inputRow,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <TextInput
            style={[styles.inputField, { color: colors.text }]}
            placeholder="Compte"
            placeholderTextColor={colors.text + "60"}
            value={account}
            onChangeText={setAccount}
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
            keyboardType="phone-pad"
            placeholder="Téléphone"
            placeholderTextColor={colors.text + "60"}
            value={phone}
            onChangeText={setPhone}
          />
          <Ionicons name="chevron-down" size={18} color={colors.border} />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: "#E77A82" }]}
          activeOpacity={0.8}
          disabled={!canSubmit}
        >
          <Text style={styles.submitText}>VALIDER</Text>
        </TouchableOpacity>
      </View>
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
  submitBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontWeight: "700" },
});

export default WalletMobileUnsubscribeScreen;
