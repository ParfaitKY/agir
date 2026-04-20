import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { verifyOtpSimple } from "../../../services/auth/verifyOtpSimple";

const DIGITS = 4;

const OtpSimpleScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();

  const userId: string = route.params?.user_id ?? "";
  const debugOtp: string = route.params?.debug_otp ?? "";

  const [values, setValues] = useState<string[]>(Array(DIGITS).fill(""));
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const inputs = useRef<TextInput[]>([]);

  const resetFields = () => {
    setValues(Array(DIGITS).fill(""));
    setActive(0);
    setTimeout(() => inputs.current[0]?.focus(), 50);
  };

  const handleChange = (index: number, text: string) => {
    const v = text.replace(/\D/g, "").slice(0, 1);
    const next = [...values];
    next[index] = v;
    setValues(next);

    if (v && index < DIGITS - 1) {
      setActive(index + 1);
    } else if (v && index === DIGITS - 1) {
      // Auto-submit au 4ème chiffre
      const code = [...next].join("");
      if (code.length === DIGITS) {
        submitOtp(code);
      }
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === "Backspace") {
      const next = [...values];
      if (next[index]) {
        next[index] = "";
        setValues(next);
      } else if (index > 0) {
        next[index - 1] = "";
        setValues(next);
        setActive(index - 1);
      }
    }
  };

  const submitOtp = async (codeOverride?: string) => {
    const code = codeOverride ?? values.join("");
    if (code.length !== DIGITS) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: reqError } = await verifyOtpSimple(
        { user_id: userId, otp_code: code },
        { "X-NO-AUTH": "true" },
      );

      if (reqError || !data?.success) {
        const msg =
          (reqError as any)?.response?.data?.message ||
          data?.message ||
          "Code OTP invalide ou expiré";
        setError(msg);
        resetFields();
        return;
      }

      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch (e: any) {
      setError(e?.message ?? "Erreur réseau");
      resetFields();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: "#FFFFFF", paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vérification</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Icône */}
            <View style={styles.iconWrap}>
              <View
                style={[
                  styles.iconInner,
                  { backgroundColor: colors.primary + "25" },
                ]}
              >
                <Ionicons name="lock-closed" size={28} color={colors.primary} />
              </View>
            </View>

            <Text style={styles.title}>Code de vérification</Text>
            <Text style={styles.subtitle}>
              Saisissez le code à 4 chiffres reçu par SMS ou e-mail.
            </Text>

            {/* Code reçu (debug/test) */}
            {!!debugOtp && debugOtp !== "****" && (
              <TouchableOpacity
                onPress={() => {
                  const digits = debugOtp.replace(/\D/g, "").slice(0, DIGITS);
                  const filled = digits.split("").concat(Array(DIGITS).fill("")).slice(0, DIGITS);
                  setValues(filled);
                  if (digits.length === DIGITS) submitOtp(digits);
                }}
                style={styles.debugBanner}
              >
                <Text style={styles.debugLabel}>Code reçu (test)</Text>
                <Text style={styles.debugCode}>{debugOtp}</Text>
                <Text style={styles.debugHint}>Appuyer pour remplir</Text>
              </TouchableOpacity>
            )}

            {/* 4 cases OTP */}
            <View style={styles.otpRow}>
              {Array.from({ length: DIGITS }).map((_, i) => (
                <View
                  key={`otp-${i}`}
                  style={[
                    styles.otpItem,
                    {
                      borderColor:
                        active === i ? colors.primary : "#E0E0E0",
                    },
                  ]}
                >
                  <TextInput
                    ref={(r) => (inputs.current[i] = r as any)}
                    value={values[i]}
                    onChangeText={(t) => handleChange(i, t)}
                    onKeyPress={(e) => handleKeyPress(i, e)}
                    onFocus={() => setActive(i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textContentType="oneTimeCode"
                    style={[styles.otpInput, { color: "#000000" }]}
                    selectionColor={colors.primary}
                    textAlignVertical="center"
                    editable={!loading}
                  />
                </View>
              ))}
            </View>

            {/* Erreur */}
            {!!error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Bouton Valider (fallback si auto-submit raté) */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: values.join("").length === DIGITS && !loading ? 1 : 0.5,
                },
              ]}
              disabled={values.join("").length !== DIGITS || loading}
              onPress={() => submitOtp()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.submitRow}>
                  <Text style={styles.submitText}>Valider</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#fff"
                    style={{ marginLeft: 10 }}
                  />
                </View>
              )}
            </TouchableOpacity>

            {/* Sécurité */}
            <View style={styles.securityRow}>
              <Ionicons name="shield-checkmark" size={14} color="#94A3B8" />
              <Text style={styles.securityText}>
                Connexion sécurisée par la banque
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    top: 14,
    padding: 6,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  iconWrap: {
    marginBottom: 20,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
  },
  otpItem: {
    width: 64,
    height: 72,
    borderWidth: 2,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
  },
  otpInput: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
    height: "100%",
    padding: 0,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  errorText: {
    color: "#DC2626",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "600",
    width: "100%",
  },
  submitBtn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  submitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 28,
  },
  securityText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  debugBanner: {
    backgroundColor: "#FEF9C3",
    borderWidth: 1,
    borderColor: "#FDE047",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  debugLabel: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  debugCode: {
    fontSize: 28,
    fontWeight: "800",
    color: "#78350F",
    letterSpacing: 6,
    marginVertical: 4,
  },
  debugHint: {
    fontSize: 11,
    color: "#A16207",
  },
});

export default OtpSimpleScreen;
