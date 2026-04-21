import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Pressable,
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
  const fromDeeplink: boolean = route.params?.from_deeplink === true;
  const { markConfigured } = useAuth() as any;

  // Single hidden input — no jitter
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  // Auto-submit from deep link
  React.useEffect(() => {
    if (fromDeeplink && debugOtp) {
      const digits = debugOtp.replace(/\D/g, "").slice(0, DIGITS);
      if (digits.length === DIGITS) {
        setCode(digits);
        setTimeout(() => submitOtp(digits), 500);
      }
    }
  }, []);

  const handleChange = useCallback((text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, DIGITS);
    setCode(digits);
    setError("");
    if (digits.length === DIGITS) {
      inputRef.current?.blur();
      submitOtp(digits);
    }
  }, []);

  const submitOtp = async (codeOverride?: string) => {
    const finalCode = codeOverride ?? code;
    if (finalCode.length !== DIGITS) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: reqError } = await verifyOtpSimple(
        { user_id: userId, otp_code: finalCode },
        { "X-NO-AUTH": "true" },
      );

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
        setCode("");
        return;
      }

      const newToken =
        data?.access_token || data?.token || data?.jwt ||
        data?.data?.access_token || data?.data?.token;
      if (newToken) await secureSetItem("auth_token", String(newToken));

      const postOtpData = data?.data;
      if (postOtpData) {
        const codeOp = postOtpData.OP_CODEOPERATEURGESTIONNAIRECOMPTEMOBILE;
        if (codeOp) await secureSetItem("code_operateur", String(codeOp));
        const clientId = postOtpData.CL_IDCLIENT;
        if (clientId) await secureSetItem("client_id", String(clientId));
        const login = postOtpData.SL_LOGIN;
        if (login) await secureSetItem("user_login", String(login));
      }

      await secureSetItem("is_configured", "true");
      if (markConfigured) await markConfigured(true);
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch (e: any) {
      setError(e?.message ?? "Erreur réseau");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const focusInput = () => inputRef.current?.focus();

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

      {/* Hidden single input */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={DIGITS}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        importantForAutofill="yes"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hiddenInput}
        editable={!loading}
        caretHidden
        contextMenuHidden
      />

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconOuter}>
          <View style={styles.iconMiddle}>
            <View style={styles.iconInner}>
              <MaterialCommunityIcons name="shield-lock" size={36} color={PRIMARY} />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Code de vérification</Text>
        <Text style={styles.subtitle}>
          {fromDeeplink
            ? "Vérification automatique de votre lien…"
            : `Saisissez le code à ${DIGITS} chiffres\nreçu par SMS ou e-mail.`}
        </Text>

        {/* OTP boxes — purely visual, tap to focus hidden input */}
        <Pressable onPress={focusInput} style={styles.otpRow}>
          {Array.from({ length: DIGITS }).map((_, i) => {
            const char = code[i] ?? "";
            const isActive = focused && i === Math.min(code.length, DIGITS - 1);
            return (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  char ? styles.otpBoxFilled : null,
                  isActive ? styles.otpBoxActive : null,
                ]}
              >
                <Text style={styles.otpChar}>{char || ""}</Text>
                {isActive && !char && <View style={styles.cursor} />}
              </View>
            );
          })}
        </Pressable>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          {Array.from({ length: DIGITS }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i < code.length && styles.progressDotFilled]}
            />
          ))}
        </View>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            code.length === DIGITS && !loading ? styles.submitBtnActive : styles.submitBtnDisabled,
          ]}
          disabled={code.length !== DIGITS || loading}
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

        {/* Resend */}
        <TouchableOpacity
          style={styles.resendRow}
          onPress={() => { setCode(""); setError(""); focusInput(); }}
        >
          <Ionicons name="refresh" size={14} color={PRIMARY} />
          <Text style={styles.resendText}>Renvoyer le code</Text>
        </TouchableOpacity>

        {/* Security */}
        <View style={styles.securityRow}>
          <Ionicons name="shield-checkmark" size={13} color="#CBD5E1" />
          <Text style={styles.securityText}>Connexion sécurisée par la banque</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
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
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1E293B", letterSpacing: 0.2 },

  // Hidden input — positioned off-screen, not invisible (invisible inputs can cause issues)
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    top: -100,
  },

  content: { paddingHorizontal: 28, paddingTop: 40, alignItems: "center" },

  iconOuter: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "#EFF6FF",
    alignItems: "center", justifyContent: "center", marginBottom: 28,
  },
  iconMiddle: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: "#DBEAFE",
    alignItems: "center", justifyContent: "center",
  },
  iconInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#BFDBFE",
    alignItems: "center", justifyContent: "center",
  },

  title: { fontSize: 26, fontWeight: "800", color: "#0F172A", textAlign: "center", marginBottom: 10, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: "#64748B", textAlign: "center", marginBottom: 36, lineHeight: 23 },

  otpRow: { flexDirection: "row", gap: 14, marginBottom: 16 },
  otpBox: {
    width: 66, height: 74,
    borderWidth: 2, borderColor: "#E2E8F0", borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  otpBoxActive: {
    borderColor: PRIMARY, backgroundColor: "#EFF6FF",
    shadowColor: PRIMARY, shadowOpacity: 0.2, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  otpBoxFilled: { borderColor: PRIMARY, backgroundColor: "#EFF6FF" },
  otpChar: { fontSize: 30, fontWeight: "800", color: PRIMARY, textAlign: "center" },
  cursor: {
    width: 2, height: 28, backgroundColor: PRIMARY,
    borderRadius: 1,
  },

  progressRow: { flexDirection: "row", gap: 8, marginBottom: 28 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E2E8F0" },
  progressDotFilled: { backgroundColor: PRIMARY, width: 20, borderRadius: 4 },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA",
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 20, width: "100%",
  },
  errorText: { color: "#DC2626", fontSize: 14, fontWeight: "600", flex: 1 },

  submitBtn: { width: "100%", paddingVertical: 16, borderRadius: 16, alignItems: "center", marginBottom: 16 },
  submitBtnActive: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  submitBtnDisabled: { backgroundColor: "#CBD5E1" },
  submitRow: { flexDirection: "row", alignItems: "center" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },

  resendRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, marginBottom: 24 },
  resendText: { fontSize: 14, color: PRIMARY, fontWeight: "600" },

  securityRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  securityText: { fontSize: 12, color: "#CBD5E1", fontWeight: "500" },
});

export default OtpSimpleScreen;
