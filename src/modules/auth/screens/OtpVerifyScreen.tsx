import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { secureGetItem } from "../../../shared/utils/secureStorage";

const OtpVerifyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const route = useRoute<any>();
  const [accountMasked, setAccountMasked] = useState("");

  const DIGITS = 6;
  const [values, setValues] = useState<string[]>(Array(DIGITS).fill(""));
  const [active, setActive] = useState(0);
  const inputs = useRef<TextInput[]>([]);
  const DEFAULT_CODE = "123456";

  useEffect(() => {
    (async () => {
      try {
        const acc = await secureGetItem("user_account_number");
        if (acc) {
          const s = String(acc).replace(/\s+/g, "");
          const tail = s.slice(-4);
          const masked = `•••• •••• ${tail}`;
          setAccountMasked(masked);
        }
      } catch {}
    })();
  }, []);

  // pas de timer nécessaire selon le design

  useEffect(() => {
    inputs.current[active]?.focus?.();
  }, [active]);

  const handleChange = (index: number, text: string) => {
    const v = text.replace(/\D/g, "").slice(0, 1);
    const next = [...values];
    next[index] = v;
    setValues(next);
    if (v && index < DIGITS - 1) setActive(index + 1);
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === "Backspace") {
      const next = [...values];
      if (next[index]) {
        next[index] = "";
        setValues(next);
      } else if (index > 0) {
        setActive(index - 1);
        const prev = [...values];
        prev[index - 1] = "";
        setValues(prev);
      }
    }
  };

  const code = values.join("");
  const canSubmit = code.length === DIGITS;

  // pas de renvoi de code ni minuterie dans ce rendu

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Vérification
        </Text>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.lockCircle}>
            <View
              style={[styles.lockInner, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="lock-closed" size={22} color="#fff" />
            </View>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Connexion en cours
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
            Code reçu automatiquement. Vous pouvez valider.
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Numéro de compte
          </Text>
          <View
            style={[
              styles.accountInput,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          >
            <Text style={[styles.accountText, { color: colors.text + "88" }]}>
              {accountMasked || "FR76 •••• •••• 3790"}
            </Text>
            <Ionicons name="lock-closed" size={18} color={colors.text + "70"} />
          </View>

          <View style={styles.otpHeaderRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Code OTP
            </Text>
            <View
              style={[
                styles.detectPill,
                { backgroundColor: colors.success + "18" },
              ]}
            >
              <Ionicons
                name="checkmark-done"
                size={16}
                color={colors.success}
              />
              <Text style={[styles.detectText, { color: colors.success }]}>
                Détecté
              </Text>
            </View>
          </View>

          <View style={styles.otpRow}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={`otp-a-${i}`}
                style={[
                  styles.otpItem,
                  {
                    borderColor: colors.primary,
                    backgroundColor: colors.background,
                    ...(i === active
                      ? { shadowOpacity: 0.1, shadowRadius: 6 }
                      : {}),
                  },
                ]}
              >
                <TextInput
                  ref={(r) => (inputs.current[i] = r as any)}
                  value={values[i]}
                  onChangeText={(t) => handleChange(i, t)}
                  onKeyPress={(e) => handleKeyPress(i, e)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[styles.otpInput, { color: colors.text }]}
                  selectionColor={colors.primary}
                />
              </View>
            ))}
            <Text style={[styles.dash, { color: colors.text + "70" }]}>-</Text>
            {Array.from({ length: 3 }).map((_, j) => (
              <View
                key={`otp-b-${j}`}
                style={[
                  styles.otpItem,
                  {
                    borderColor: colors.primary,
                    backgroundColor: colors.background,
                    ...(j + 3 === active
                      ? { shadowOpacity: 0.1, shadowRadius: 6 }
                      : {}),
                  },
                ]}
              >
                <TextInput
                  ref={(r) => (inputs.current[j + 3] = r as any)}
                  value={values[j + 3]}
                  onChangeText={(t) => handleChange(j + 3, t)}
                  onKeyPress={(e) => handleKeyPress(j + 3, e)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[styles.otpInput, { color: colors.text }]}
                  selectionColor={colors.primary}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.6 },
            ]}
            disabled={!canSubmit}
            onPress={() => {
              if (code === DEFAULT_CODE) {
                try {
                  (route as any)?.params?.onSuccess?.();
                } catch {}
                navigation.goBack();
              }
            }}
          >
            <View style={styles.submitInnerRow}>
              <Text style={[styles.submitText, { color: colors.background }]}>
                Valider
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color="#fff"
                style={{ marginLeft: 8 }}
              />
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        >
          <Text
            style={{
              color: colors.text + "80",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            Ce n'est pas moi ? Annuler
          </Text>
        </TouchableOpacity>
        <View style={styles.securityRow}>
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={colors.text + "60"}
          />
          <Text style={[styles.securityText, { color: colors.text + "60" }]}>
            Connexion sécurisée par la banque
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackBtn: { position: "absolute", left: 16, top: 8 },
  headerTitle: { fontSize: 16, fontWeight: "700", marginLeft: 12 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginHorizontal: 4,
  },
  lockCircle: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  lockInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontSize: 24, fontWeight: "800", marginTop: 6, textAlign: "center" },
  subtitle: { fontSize: 13, marginTop: 6, textAlign: "center" },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginTop: 16 },
  accountInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginTop: 8,
  },
  accountText: { fontSize: 14, fontWeight: "700" },
  otpHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
  },
  detectPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  detectText: { fontSize: 12, fontWeight: "700", marginLeft: 6 },
  otpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    paddingHorizontal: 4,
  },
  otpItem: {
    width: "14.5%",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  otpInput: {
    fontSize: 22,
    textAlign: "center",
    paddingVertical: 6,
    width: "100%",
  },
  dash: { marginHorizontal: 8, fontSize: 20, fontWeight: "800" },
  submitBtn: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  submitInnerRow: { flexDirection: "row", alignItems: "center" },
  submitText: { fontSize: 16, fontWeight: "700" },

  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  securityText: { fontSize: 12, fontWeight: "600" },
});

export default OtpVerifyScreen;
