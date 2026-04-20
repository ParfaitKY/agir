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
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { verifyOtpSimple } from "../../../services/auth/verifyOtpSimple";
import { useAuth } from "../../../app/hooks/useAuth";
import { secureSetItem } from "../../../shared/utils/secureStorage";

const DIGITS = 4;
const PRIMARY = "#0066CC";

const OtpSimpleScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const userId: string = route.params?.user_id ?? "";
  const debugOtp: string = route.params?.debug_otp ?? "";
  const { markConfigured } = useAuth() as any;

  const [values, setValues] = useState<string[]>(Array(DIGITS).fill(""));
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const inputs = useRef<TextInput[]>([]);

  const filled = values.filter(Boolean).length;

  const resetFields = () => {
    setValues(Array(DIGITS).fill(""));
    setActive(0);
    setTimeout(() => inputs.current[0]?.focus(), 100);
  };

  const handleChange = (index: number, text: string) => {
    // Sur Android, text peut contenir plusieurs caractères — on prend le dernier saisi
    const digits = text.replace(/\D/g, "");
    const v = digits.slice(-1); // dernier chiffre saisi
    const next = [...values];
    next[index] = v;
    setValues(next);
    if (v && index < DIGITS - 1) {
      setTimeout(() => {
        inputs.current[index + 1]?.focus();
      }, 10);
    } else if (v && index === DIGITS - 1) {
      const code = next.join("");
      if (code.length === DIGITS) {
        inputs.current[index]?.blur();
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
        setTimeout(() => {
          inputs.current[index - 1]?.focus();
        }, 10);
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

      console.log("[OTP] verify response:", JSON.stringify(data));

      // Succès si success=true OU si message indique succès OU si pas d'erreur et data présent
      const isSuccess =
        data?.success === true ||
        String(data?.success) === "true" ||
        String(data?.message || "").toLowerCase().includes("success") ||
        String(data?.message || "").toLowerCase().includes("valid") ||
        (!reqError && data && data?.success !== false);

      if (reqError || !isSuccess) {
        const msg =
          (reqError as any)?.response?.data?.message ||
          data?.message ||
          "Code OTP invalide ou expiré";
        setError(msg);
        resetFields();
        return;
      }

      // Sauvegarder le nouveau token post-OTP si le serveur en renvoie un
      const newToken =
        data?.access_token ||
        data?.token ||
        data?.jwt ||
        data?.data?.access_token ||
        data?.data?.token;

      if (newToken) {
        await secureSetItem("auth_token", String(newToken));
      }

      // Sauvegarder les données opérateur renvoyées post-OTP si présentes
      const postOtpData = data?.data;
      if (postOtpData) {
        const codeOp = postOtpData.OP_CODEOPERATEURGESTIONNAIRECOMPTEMOBILE;
        if (codeOp) await secureSetItem("code_operateur", String(codeOp));

        const clientId = postOtpData.CL_IDCLIENT;
        if (clientId) await secureSetItem("client_id", String(clientId));

        const login = postOtpData.SL_LOGIN;
        if (login) await secureSetItem("user_login", String(login));
      }

      // Marquer la session comme authentifiée
      await secureSetItem("is_configured", "true");
      if (markConfigured) await markConfigured(true);
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch (e: any) {
      setError(e?.message ?? "Erreur réseau");
      resetFields();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vérification</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>

            {/* Icône animée */}
            <View style={styles.iconOuter}>
              <View style={styles.iconMiddle}>
                <View style={styles.iconInner}>
                  <MaterialCommunityIcons name="shield-lock" size={36} color={PRIMARY} />
                </View>
              </View>
            </View>

            <Text style={styles.title}>Code de vérification</Text>
            <Text style={styles.subtitle}>
              Saisissez le code à {DIGITS} chiffres{"\n"}reçu par SMS ou e-mail.
            </Text>

            {/* Debug banner */}
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
                <Ionicons name="flash" size={14} color="#92400E" />
                <Text style={styles.debugText}>
                  Code test : <Text style={styles.debugCode}>{debugOtp}</Text>
                </Text>
                <Text style={styles.debugHint}>Appuyer pour remplir</Text>
              </TouchableOpacity>
            )}

            {/* Cases OTP */}
            <View style={styles.otpRow}>
              {Array.from({ length: DIGITS }).map((_, i) => {
                const isFilled = !!values[i];
                const isActive = active === i;
                return (
                  <View
                    key={`otp-${i}`}
                    style={[
                      styles.otpBox,
                      isActive && styles.otpBoxActive,
                      isFilled && styles.otpBoxFilled,
                    ]}
                  >
                    <TextInput
                      ref={(r) => (inputs.current[i] = r as any)}
                      value={values[i]}
                      onChangeText={(t) => handleChange(i, t)}
                      onKeyPress={(e) => handleKeyPress(i, e)}
                      onFocus={() => setActive(i)}
                      onBlur={() => {}}
                      keyboardType="number-pad"
                      maxLength={2}
                      textContentType="oneTimeCode"
                      autoComplete="one-time-code"
                      importantForAutofill="yes"
                      style={[
                        styles.otpInput,
                        { color: isFilled ? PRIMARY : "#1E293B" },
                      ]}
                      selectionColor={PRIMARY}
                      editable={!loading}
                      caretHidden={true}
                      contextMenuHidden={true}
                    />
                  </View>
                );
              })}
            </View>

            {/* Indicateur de progression */}
            <View style={styles.progressRow}>
              {Array.from({ length: DIGITS }).map((_, i) => (
                <View
                  key={`dot-${i}`}
                  style={[
                    styles.progressDot,
                    i < filled && styles.progressDotFilled,
                  ]}
                />
              ))}
            </View>

            {/* Erreur */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Bouton */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                filled === DIGITS && !loading
                  ? styles.submitBtnActive
                  : styles.submitBtnDisabled,
              ]}
              disabled={filled !== DIGITS || loading}
              onPress={() => submitOtp()}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.submitRow}>
                  <Text style={styles.submitText}>Confirmer</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Renvoyer */}
            <TouchableOpacity style={styles.resendRow} onPress={resetFields}>
              <Ionicons name="refresh" size={14} color={PRIMARY} />
              <Text style={styles.resendText}>Renvoyer le code</Text>
            </TouchableOpacity>

            {/* Sécurité */}
            <View style={styles.securityRow}>
              <Ionicons name="shield-checkmark" size={13} color="#CBD5E1" />
              <Text style={styles.securityText}>Connexion sécurisée par la banque</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: 0.2,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 40,
    alignItems: "center",
  },
  iconOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  iconMiddle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 23,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 16,
  },
  otpBox: {
    width: 66,
    height: 74,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  otpBoxActive: {
    borderColor: PRIMARY,
    backgroundColor: "#EFF6FF",
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  otpBoxFilled: {
    borderColor: PRIMARY,
    backgroundColor: "#EFF6FF",
  },
  otpInput: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    width: "100%",
    height: "100%",
    padding: 0,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  progressDotFilled: {
    backgroundColor: PRIMARY,
    width: 20,
    borderRadius: 4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    width: "100%",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  submitBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  submitBtnActive: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitBtnDisabled: {
    backgroundColor: "#CBD5E1",
  },
  submitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: "600",
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: "#CBD5E1",
    fontWeight: "500",
  },
  debugBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
    width: "100%",
  },
  debugText: {
    fontSize: 13,
    color: "#92400E",
    flex: 1,
  },
  debugCode: {
    fontWeight: "800",
    letterSpacing: 3,
    color: "#78350F",
  },
  debugHint: {
    fontSize: 11,
    color: "#B45309",
    fontWeight: "600",
  },
});

export default OtpSimpleScreen;
