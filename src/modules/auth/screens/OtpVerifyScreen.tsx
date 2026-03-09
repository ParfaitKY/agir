import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  secureGetItem,
  secureSetItem,
} from "../../../shared/utils/secureStorage";
import { Platform, ActivityIndicator } from "react-native";
import { silentOtp } from "../../../services/auth/silentOtp";
import { verifyOtp as verifyOtpService } from "../../../services/auth/verifyOtp";

const OtpVerifyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  // Force light theme colors for this screen to ensure visibility
  const themeColors = {
    background: "#FFFFFF",
    text: "#000000",
    textSecondary: "#424242",
    border: "#E0E0E0",
    inputBg: "#F8F9FA",
    primary: colors.primary,
    error: colors.error,
    success: colors.success,
    warning: colors.warning,
  };

  const route = useRoute<any>();
  const [accountMasked, setAccountMasked] = useState("");
  const [numeroCompte, setNumeroCompte] = useState<string>("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [loadingSilent, setLoadingSilent] = useState<boolean>(false);
  const [silentOk, setSilentOk] = useState<boolean>(false);
  const [requiresManual, setRequiresManual] = useState<boolean>(false);
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

      const isAutoplay = (route as any)?.params?.isAutoplay;
      console.log(`[OtpVerify] Starting check. isAutoplay=${isAutoplay}`);

      setLoadingSilent(true);
      setSilentOk(false);
      // Si Autoplay est faux, on force le mode manuel dès le départ
      // Mais on lance quand même la requête pour générer l'OTP (et l'envoyer par mail)
      setRequiresManual(isAutoplay === false);

      try {
        const { data, error } = await silentOtp(
          {
            numero_compte: numeroCompte,
            device_id: deviceId,
            code_cryptage: ENCRYPT_CODE,
          },
          { "X-NO-AUTH": "true" },
        );
        if (error) {
          console.log("[OtpVerify] silentOtp error:", error);
          setSilentOk(false);
          // En cas d'erreur, on fallback sur manuel
          setRequiresManual(true);
          return;
        }

        // Log requested by user
        console.log(
          "[OtpVerify] silentOtp response:",
          JSON.stringify(data, null, 2),
        );

        const otp =
          (data as any)?.otp_code ||
          (data as any)?.otp ||
          (data as any)?.token ||
          (data as any)?.code ||
          "";

        console.log("[OtpVerify] OTP FOUND IN LOGS:", otp);

        // Si on est en mode "PAS Autoplay" (Manuel), on ignore le remplissage auto
        // Sauf pour les logs qu'on vient de faire.
        if (isAutoplay === false) {
          setRequiresManual(true);
          setSilentOk(false); // On ne montre pas "Détecté"
          return;
        }

        // Comportement normal (Autoplay = true ou undefined)
        const manual =
          (data as any)?.requires_manual_input === true ||
          (data as any)?.auto_fill === false;

        if (manual) {
          setRequiresManual(true);
          setSilentOk(false);
        } else if (typeof otp === "string" && otp.length >= DIGITS) {
          const first6 = otp.slice(0, DIGITS);
          const arr = first6.split("");
          setValues(arr);
          setActive(DIGITS - 1);
          setSilentOk(true);
          setRequiresManual(false);

          // Auto-submit après un court délai pour UX
          setTimeout(() => {
            // FIX: On passe explicitement le code trouvé pour éviter que verifyOtp utilise un state vide
            // à cause de la closure (si verifyOtp est capturé avec des valeurs vides).
            // Et on s'assure que c'est une string
            const codeToUse =
              typeof otp === "string"
                ? otp.slice(0, DIGITS)
                : String(otp).slice(0, DIGITS);
            verifyOtp(codeToUse);
          }, 500);
        } else {
          setSilentOk(false);
          setRequiresManual(true);
        }
      } catch (e) {
        console.log("[OtpVerify] Exception:", e);
        setSilentOk(false);
        setRequiresManual(true);
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

  const verifyOtp = async (codeOverride?: string) => {
    setVerifyError("");

    // Utiliser l'override s'il est fourni (cas de l'auto-submit), sinon le state
    // IMPORTANT: On vérifie si codeOverride est une string valide, sinon on utilise values
    let codeToVerify = "";
    if (typeof codeOverride === "string" && codeOverride.length === DIGITS) {
      codeToVerify = codeOverride;
    } else {
      codeToVerify = values.join("");
    }

    // Si on n'a toujours pas de code valide, on ne soumet pas
    if (codeToVerify.length !== DIGITS) {
      // Mais si c'est un appel manuel (clic bouton), on laisse passer pour que le serveur renvoie l'erreur
      // Sauf si c'est un auto-submit vide
      if (!codeOverride) {
        // Clic bouton : on laisse faire
      } else {
        // Auto-submit raté : on stop
        return;
      }
    }

    try {
      console.log(`[OtpVerify] Verifying OTP: ${codeToVerify}`);
      const { data, error } = await verifyOtpService(
        {
          numero_compte: numeroCompte,
          device_id: deviceId,
          otp_code: codeToVerify,
          code_cryptage: ENCRYPT_CODE,
        },
        { "X-NO-AUTH": "true" },
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
    <View
      style={[
        styles.screen,
        { backgroundColor: themeColors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Vérification
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.lockCircle}>
              <View
                style={[
                  styles.lockInner,
                  {
                    backgroundColor: themeColors.primary + "65",
                    borderColor: themeColors.primary + "66",
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons name="lock-closed" size={22} color="#FFFF" />
              </View>
            </View>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Connexion en cours
            </Text>
            <Text
              style={[styles.subtitle, { color: themeColors.textSecondary }]}
            >
              {loadingSilent
                ? "Patientez, détection du code…"
                : silentOk
                  ? "Code détecté automatiquement.\nVous pouvez valider."
                  : requiresManual
                    ? "Un code a été envoyé par e-mail.\nVeuillez le saisir manuellement."
                    : "Saisissez le code reçu."}
            </Text>

            <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
              Numéro de compte
            </Text>
            <View
              style={[
                styles.accountInput,
                {
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.accountText,
                  { color: themeColors.textSecondary },
                ]}
              >
                {accountMasked || "FR76 •••• •••• ••••  3790"}
              </Text>
              <Ionicons
                name="lock-closed"
                size={22}
                color={themeColors.textSecondary}
              />
            </View>

            <View style={styles.otpHeaderRow}>
              <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
                Code OTP
              </Text>
              <View
                style={[
                  styles.detectPill,
                  {
                    backgroundColor:
                      (silentOk
                        ? themeColors.success
                        : requiresManual
                          ? themeColors.warning || "#EAB308"
                          : themeColors.primary) + "18",
                  },
                ]}
              >
                {loadingSilent ? (
                  <ActivityIndicator size="small" color={themeColors.primary} />
                ) : (
                  <Ionicons
                    name={
                      silentOk
                        ? "checkmark-done"
                        : requiresManual
                          ? "alert"
                          : "time"
                    }
                    size={16}
                    color={
                      silentOk
                        ? themeColors.success
                        : requiresManual
                          ? themeColors.warning || "#EAB308"
                          : themeColors.primary
                    }
                  />
                )}
                <Text
                  style={[
                    styles.detectText,
                    {
                      color: silentOk
                        ? themeColors.success
                        : requiresManual
                          ? themeColors.warning || "#EAB308"
                          : themeColors.primary,
                    },
                  ]}
                >
                  {loadingSilent
                    ? "Détection…"
                    : silentOk
                      ? "Détecté"
                      : requiresManual
                        ? "Saisie manuelle"
                        : "En attente"}
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
                      borderColor: themeColors.primary,
                      backgroundColor: themeColors.background,
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
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    style={[styles.otpInput, { color: themeColors.text }]}
                    selectionColor={themeColors.primary}
                    // includeFontPadding={false} // Removed: Android specific via styles
                    textAlignVertical="center"
                  />
                </View>
              ))}
              <Text style={[styles.dash, { color: themeColors.textSecondary }]}>
                -
              </Text>
              {Array.from({ length: 3 }).map((_, j) => (
                <View
                  key={`otp-b-${j}`}
                  style={[
                    styles.otpItem,
                    {
                      borderColor: themeColors.primary,
                      backgroundColor: themeColors.background,
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
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    style={[styles.otpInput, { color: themeColors.text }]}
                    selectionColor={themeColors.primary}
                    // includeFontPadding={false} // Removed: Android specific via styles
                    textAlignVertical="center"
                  />
                </View>
              ))}
            </View>

            <View style={styles.spacer} />

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: themeColors.primary,
                    opacity: canSubmit ? 1 : 0.6,
                  },
                ]}
                disabled={!canSubmit}
                onPress={() => verifyOtp()}
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
                    color: themeColors.error || "#ff4d4f",
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
                    color: themeColors.textSecondary,
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
                  color={themeColors.textSecondary}
                />
                <Text
                  style={[
                    styles.securityText,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  Connexion sécurisée par la banque
                </Text>
              </View>
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
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 16,
    // paddingVertical: 6, // Removed to let TextInput fill the height
    height: 60, // Fixed height for container
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  otpInput: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    padding: 0,
    height: "100%",
    width: "100%",
    color: "#000000",
    includeFontPadding: false,
    textAlignVertical: "center",
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
