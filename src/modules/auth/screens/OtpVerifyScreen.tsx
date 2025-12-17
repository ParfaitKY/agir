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
import { secureGetItem, secureSetItem } from "../../../shared/utils/secureStorage";
import { Platform, ActivityIndicator } from "react-native";
import { silentOtp } from "../../../services/auth/silentOtp";
import { verifyOtp as verifyOtpService } from "../../../services/auth/verifyOtp";

const OtpVerifyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const route = useRoute<any>();
  const [accountMasked, setAccountMasked] = useState("");
  const [numeroCompte, setNumeroCompte] = useState<string>("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [loadingSilent, setLoadingSilent] = useState<boolean>(false);
  const [silentOk, setSilentOk] = useState<boolean>(false);
  const [verifyError, setVerifyError] = useState<string>("");

  const DIGITS = 6;
  const [values, setValues] = useState<string[]>(Array(DIGITS).fill(""));
  const [active, setActive] = useState(0);
  const inputs = useRef<TextInput[]>([]);
  const ENCRYPT_CODE = "Y}@128eVIXfoi7";

  useEffect(() => {
    (async () => {
      try {
        const accParam = (route as any)?.params?.numero_compte;
        const acc = accParam || (await secureGetItem("user_account_number"));
        const devParam = (route as any)?.params?.device_id;
        let dev = devParam || (await secureGetItem("device_id"));
        if (!dev) {
          const rand = Math.random().toString(36).slice(2);
          const t = Date.now().toString(36);
          dev = `${Platform.OS}-${t}-${rand}`.toUpperCase();
          await secureSetItem("device_id", dev);
        }
        if (acc) {
          setNumeroCompte(String(acc));
        }
        if (dev) {
          setDeviceId(dev);
        }
        const accForMask = acc || "";
        if (acc) {
          const s = String(accForMask).replace(/\s+/g, "");
          const tail = s.slice(-4);
          const masked = `•••• •••• •••• •••• ${tail}`;
          setAccountMasked(masked);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const runSilent = async () => {
      if (!numeroCompte || !deviceId) return;
      setLoadingSilent(true);
      setSilentOk(false);
      try {
        const { data, error } = await silentOtp(
          {
            numero_compte: numeroCompte,
            device_id: deviceId,
            code_cryptage: ENCRYPT_CODE,
          },
          { "X-NO-AUTH": "true" }
        );
        if (error) {
          setSilentOk(false);
          return;
        }
        const otp =
          (data as any)?.otp_code ||
          (data as any)?.otp ||
          (data as any)?.token ||
          (data as any)?.code ||
          "";
        if (typeof otp === "string" && otp.length >= DIGITS) {
          const first6 = otp.slice(0, DIGITS);
          const arr = first6.split("");
          setValues(arr);
          setActive(DIGITS - 1);
          setSilentOk(true);
        } else {
          setSilentOk(false);
        }
      } catch {
        setSilentOk(false);
      } finally {
        setLoadingSilent(false);
      }
    };
    runSilent();
  }, [numeroCompte, deviceId]);

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

  const verifyOtp = async () => {
    setVerifyError("");
    try {
      const { data, error } = await verifyOtpService(
        {
          numero_compte: numeroCompte,
          device_id: deviceId,
          otp_code: code,
          code_cryptage: ENCRYPT_CODE,
        },
        { "X-NO-AUTH": "true" }
      );
      if (error) {
        const errMsg =
          (error as any)?.response?.data?.message ||
          (error as any)?.message ||
          "Échec de la validation du code.";
        setVerifyError(errMsg);
        return;
      }
      try {
        (route as any)?.params?.onSuccess?.();
      } catch {}
      navigation.goBack();
    } catch {
      setVerifyError("Échec de la validation du code.");
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: "#121212" }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Vérification
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.lockCircle}>
          <View
            style={[
              styles.lockInner,
              {
                backgroundColor: colors.primary + "65",
                borderColor: colors.primary + "66",
                borderWidth: 1,
              },
            ]}
          >
            <Ionicons name="lock-closed" size={22} color="#FFFF" />
          </View>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Connexion en cours
        </Text>
        <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
          {loadingSilent
            ? "Patientez, détection du code…"
            : silentOk
            ? "Code reçu automatiquement.\nVous pouvez valider."
            : "Saisissez le code reçu."}
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
            {accountMasked || "FR76 •••• •••• ••••  3790"}
          </Text>
          <Ionicons name="lock-closed" size={22} color={colors.text + "70"} />
        </View>

        <View style={styles.otpHeaderRow}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Code OTP
          </Text>
          <View
            style={[
              styles.detectPill,
              { backgroundColor: (silentOk ? colors.success : colors.primary) + "18" },
            ]}
          >
            {loadingSilent ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name={silentOk ? "checkmark-done" : "time"}
                size={16}
                color={silentOk ? colors.success : colors.primary}
              />
            )}
            <Text
              style={[
                styles.detectText,
                { color: silentOk ? colors.success : colors.primary },
              ]}
            >
              {loadingSilent ? "Détection…" : silentOk ? "Détecté" : "En attente"}
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

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.6 },
            ]}
            disabled={!canSubmit}
            onPress={verifyOtp}
          >
            <View style={styles.submitInnerRow}>
              <Text style={[styles.submitText, { color: "#fff" }]}>
                Valider
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color="#fff"
                style={{ marginLeft: 12 }}
              />
            </View>
          </TouchableOpacity>

          {!!verifyError && (
            <Text
              style={{
                color: colors.error || "#ff4d4f",
                marginTop: 10,
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              {verifyError}
            </Text>
          )}

          <TouchableOpacity
            onPress={() => {
              try {
                (route as any)?.params?.onCancel?.();
              } catch {}
              navigation.goBack();
            }}
            style={{ marginTop: 20 }}
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
    height: 56,
  },
  headerBackBtn: {
    position: "absolute",
    left: 16,
    top: 14,
    padding: 6,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
    letterSpacing: 0.2,
  },
  content: { paddingHorizontal: 20, paddingTop: 8, marginTop: 28, flex: 1 },
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

  title: { fontSize: 26, fontWeight: "800", marginTop: 6, textAlign: "center" },
  subtitle: { fontSize: 17, marginTop: 6, textAlign: "center" },
  fieldLabel: { fontSize: 16, fontWeight: "600", marginTop: 45 },
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

  spacer: { flex: 1 },
  footer: { paddingBottom: 35 },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  securityText: { fontSize: 12, fontWeight: "600" },
});

export default OtpVerifyScreen;
