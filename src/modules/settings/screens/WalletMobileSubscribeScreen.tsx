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

const WalletMobileSubscribeScreen: React.FC = () => {
  const { colors } = useTheme();
  const [accountType, setAccountType] = useState("");
  const [country, setCountry] = useState("CÔTE D'IVOIRE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, shadowColor: colors.text },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Compte mobile
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
            placeholder="Compte (obligatoire)"
            placeholderTextColor={colors.text + "60"}
            value={accountType}
            onChangeText={setAccountType}
          />
          <Ionicons name="chevron-down" size={18} color={colors.border} />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Pays</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.text,
            },
          ]}
          placeholder="Pays (obligatoire)"
          placeholderTextColor={colors.text + "60"}
          value={country}
          onChangeText={setCountry}
        />

        <Text style={[styles.label, { color: colors.text }]}>Téléphone</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.text,
            },
          ]}
          keyboardType="phone-pad"
          placeholder="Téléphone • Ex.: 01XXXXXXXX (obligatoire)"
          placeholderTextColor={colors.text + "60"}
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.text,
            },
          ]}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Email (obligatoire)"
          placeholderTextColor={colors.text + "60"}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={[styles.label, { color: colors.text }]}>Localisation</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.text,
            },
          ]}
          placeholder="Localisation (obligatoire)"
          placeholderTextColor={colors.text + "60"}
          value={location}
          onChangeText={setLocation}
        />

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: "#E77A82" }]}
          activeOpacity={0.8}
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  required: { fontSize: 12 },
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
});

export default WalletMobileSubscribeScreen;
