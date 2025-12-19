import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  useColorScheme,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import * as ScreenCapture from "expo-screen-capture";

import { useI18n } from "../../../app/providers/I18nProvider";
import {
  secureSetItem,
  secureGetItem,
} from "../../../shared/utils/secureStorage";
import { useAuth } from "../../../app/hooks/useAuth";
import { useLogin } from "../../../domain/auth/useLogin";
import useClientByCompte from "../../../domain/auth/useClientByCompte";
import { useGetAccess } from "../../../domain/auth/useGetAccess";

const InitialSetupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width } = useWindowDimensions();
  const { t } = useI18n();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const { user, markConfigured, login, loginAsGuest } = useAuth() as any;
  const { loginUser, isLoading: isLoginLoading } = useLogin();
  const { getAccess, isLoading: isAccessLoading, accessData } = useGetAccess();
  const {
    fetchClientInfo,
    isLoading,
    error: fetchError,
    clientData,
  } = useClientByCompte();

  // Steps: 1 = vérification compte, 2 = configuration PIN
  const [step, setStep] = useState<1 | 2>(1);
  const [accountNumber, setAccountNumber] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [otpProcessing, setOtpProcessing] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState("");

  // Informations utilisateur
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loginReadonly, setLoginReadonly] = useState("");
  const [clientId, setClientId] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [hasPrefilledParams, setHasPrefilledParams] = useState(false);

  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [savingPin, setSavingPin] = useState(false);

  const [logoError, setLogoError] = useState(false);
  const showVerifyButton = step === 1 && accountNumber.trim().length < 8;

  const accountNumberRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const autoVerifyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Palette couleur
  const palette = {
    bg: isDark ? "#0B1220" : "#F1F5F9",
    card: isDark ? "#111827" : "#FFFFFF",
    textMain: isDark ? "#E5E7EB" : "#0F172A",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#374151" : "#E5E7EB",
    primary: "#0066CC",
  };

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // AUTO-REDIRECT ON MOUNT
  // Si l'utilisateur arrive ici mais qu'il est déjà configuré (ex: retour arrière mal géré),
  // on le redirige immédiatement vers le PIN.
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const conf = await secureGetItem("is_configured");
        const pin = await secureGetItem("pin_user");
        if (conf === "true" && pin) {
          console.log("[InitialSetup] Already configured -> Redirect PinLogin");
          navigation.replace("PinLogin");
        }
      } catch {}
    };
    checkConfig();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  // Gestion focus input selon step
  useEffect(() => {
    if (step === 1) accountNumberRef.current?.focus();
    else lastNameRef.current?.focus();
  }, [step]);

  // Prévention capture écran
  useEffect(() => {
    const run = async () => {
      if (Platform.OS !== "web")
        await ScreenCapture.preventScreenCaptureAsync();
    };
    run();
    return () => {
      if (Platform.OS !== "web") ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  // Suppression de l'effet de navigation automatique
  useEffect(() => {
    // Ce bloc est volontairement vidé pour casser la boucle infinie.
    // La navigation est gérée directement dans handleVerifyAccountNumber.
  }, []);

  useEffect(() => {
    const params = (route as any)?.params || {};
    const nom = params?.nom;
    const prenom = params?.prenom;
    const login = params?.login;
    const hasAll =
      typeof login !== "undefined" ||
      typeof nom !== "undefined" ||
      typeof prenom !== "undefined";
    if (hasAll) {
      setLastName(nom ?? "");
      setFirstName(prenom ?? "");
      setLoginReadonly(login ?? "");
      setHasPrefilledParams(true);
      secureSetItem("user_lastname", String(nom ?? ""));
      secureSetItem("user_firstname", String(prenom ?? ""));
      secureSetItem("user_login", String(login ?? ""));
      setStep(2);
    }
  }, [route]);

  useEffect(() => {
    const run = async () => {
      try {
        const normalize = (r: any) => {
          const d = r?.data ?? r;
          if (Array.isArray(d)) return d[0] ?? {};
          if (Array.isArray(d?.data)) return d.data[0] ?? {};
          if (Array.isArray(d?.result)) return d.result[0] ?? {};
          if (Array.isArray(d?.payload)) return d.payload[0] ?? {};
          if (d?.data && typeof d.data === "object") return d.data;
          return d ?? {};
        };
        const pick = (obj: any, patterns: string[]) => {
          if (!obj) return undefined;
          const keys = Object.keys(obj);
          for (const p of patterns) {
            const np = p.toLowerCase().replace(/_/g, "");
            for (const k of keys) {
              const nk = k.toLowerCase().replace(/_/g, "");
              if (nk === np) return obj[k];
            }
          }
          return undefined;
        };

        const storedAccess = await secureGetItem("access_data");
        const block = normalize(
          accessData || (storedAccess ? JSON.parse(storedAccess) : null)
        );

        const phoneCandidate =
          pick(block, [
            "CL_TELEPHONE",
            "CL_TELEPHONECLIENT",
            "TEL",
            "PHONE",
            "MOBILE",
            "CONTACT",
          ]) || "";
        if (phoneCandidate) {
          const phoneStr = String(phoneCandidate);
          await secureSetItem("user_phone", phoneStr);
          const userDataStr = await secureGetItem("user_data");
          try {
            const userDataObj = userDataStr ? JSON.parse(userDataStr) : {};
            const merged = { ...userDataObj, phone: phoneStr };
            await secureSetItem("user_data", JSON.stringify(merged));
          } catch {}
        }

        const accCandidate =
          pick(block, [
            "OP_CODEOPERATEURGESTIONNAIRECOMPTEMOBILE",
            "NUMCOMPTE",
            "CO_CODECOMPTE",
            "ACCOUNT_NUMBER",
          ]) || "";
        if (accCandidate) {
          const sanitized = String(accCandidate).replace(/\D/g, "");
          if (sanitized.length >= 8)
            await secureSetItem("user_account_number", sanitized);
        }
      } catch {}
    };
    run();
  }, [accessData]);

  // Fonction vérification compte
  const handleVerifyAccountNumber = async () => {
    setVerifyError(null);
    if (!accountNumber || accountNumber.length < 8) {
      setVerifyError(t("initial.error.accountLength"));
      return;
    }
    setLoadingVerify(true);
    const info = await fetchClientInfo({ NUMCOMPTE: accountNumber });
    setLoadingVerify(false);
    if (!info) {
      setVerifyError(
        fetchError || t("initial.error.verification")
      );
      return;
    }
    setVerifiedAccount(accountNumber);
    setVerifySuccess(true);

    const ln = info.NOMCLIENT ?? info.lastName ?? "";
    const fn = info.PRENOMCLIENT ?? info.firstName ?? "";
    setLastName(ln);
    setFirstName(fn);
    const cid = info.IDCLIENT ?? info.id;
    if (cid) {
      const cidStr = String(cid);
      setClientId(cidStr);
      secureSetItem("client_id", cidStr);
    }
    const phone = String(info.phone || "+225 07 ***** 12");
    const accStored = await secureGetItem("user_account_number");
    const dev = await secureGetItem("device_id");
    (navigation as any).navigate("OtpVerify", {
      phone,
      numero_compte: accStored || accountNumber,
      device_id: dev || "",
      onSuccess: () => {
        setVerifySuccess(false);
        setOtpProcessing(true);
        setTimeout(() => {
          setOtpProcessing(false);
          setStep(2);
        }, 2000);
      },
      onCancel: () => {
        setVerifySuccess(false);
        setVerifiedAccount("");
        setAccountNumber("");
        setStep(1);
      },
    });
  };

  useEffect(() => {
    if (autoVerifyRef.current) clearTimeout(autoVerifyRef.current);
    const num = accountNumber.trim();
    if (step === 1 && num.length >= 8 && num !== verifiedAccount) {
      autoVerifyRef.current = setTimeout(() => {
        if (loadingVerify || isLoading) return;
        handleVerifyAccountNumber();
      }, 600);
    }
    return () => {
      if (autoVerifyRef.current) clearTimeout(autoVerifyRef.current);
    };
  }, [accountNumber, step, loadingVerify, isLoading, verifiedAccount]);

  // Fonction mode invité
  const handleGuestMode = async () => {
    try {
      setVerifyError(null);
      if (typeof loginAsGuest === "function") {
        await loginAsGuest();
      } else {
        await secureSetItem("auth_token", "guest");
        await secureSetItem(
          "user_data",
          JSON.stringify({
            id: "invite",
            username: "invite",
            name: "Invité",
            email: "",
          })
        );
        await secureSetItem("user_login", "invite");
        try {
          const hashedDefaultPin = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            "12345"
          );
          await secureSetItem("pin_user", hashedDefaultPin);
        } catch {}
      }
      if (markConfigured) await markConfigured(true);
      try {
        (navigation as any).reset({ index: 0, routes: [{ name: "Splash" }] });
      } catch {
        navigation?.navigate("Splash");
      }
    } catch (e: any) {
      setVerifyError(
        String(e?.message || "Impossible d’activer le mode invité.")
      );
    }
  };

  // Fonction sauvegarde PIN
  const handleSavePin = async () => {
    setPinError(null);
    if (
      !firstName ||
      !lastName ||
      !loginReadonly ||
      !newPin ||
      !confirmPin ||
      !secretKey
    ) {
      setPinError("Tous les champs sont requis.");
      return;
    }

    // Vérification du login avec la base de données
    const dbLogin = clientData?.login || "";
    // On compare de manière insensible à la casse
    if (
      dbLogin &&
      loginReadonly.trim().toUpperCase() !== dbLogin.trim().toUpperCase()
    ) {
      setPinError("Login incorrect");
      return;
    }

    // Suppression de la vérification locale de la clé secrète car dbSecret peut être hashé
    // On laisse le serveur valider via getAccess()
    /*
    const dbSecret = clientData?.secret_key;
    if (dbSecret && secretKey.trim() !== dbSecret.trim()) {
      setPinError("Clé secrète incorrecte");
      return;
    }
    */

    if (newPin.length < 5) {
      setPinError("Le code PIN doit contenir au moins 5 chiffres.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("Le code PIN et sa confirmation ne correspondent pas.");
      return;
    }

    if (secretKey.length < 3) {
      setPinError("La clé secrète doit contenir au moins 3 caractères.");
      return;
    }

    try {
      setSavingPin(true);
      const cleanLogin = loginReadonly.trim();
      const cleanSecret = secretKey.trim();

      const hashedUserPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPin
      );

      const deviceId = (await secureGetItem("device_id")) || "";
      const loginPayload = {
        LG_CODELANGUE: "FR",
        SL_LOGIN: cleanLogin,
        SL_MOTPASSE: newPin,
        TYPEOPERATEUR: "01",
        TYPEOPERATION: "01",
        CODECRYPTAGE: "Y}@128eVIXfoi7",
        TERMINALUUID: deviceId,
        CLIENT_ID: clientId,
      } as any;

      const result = await loginUser(loginPayload);
      if (!result?.success) {
        let errorMsg = result?.error || t("initial.error.loginOrPin");
        // Si l'erreur mentionne login/mot de passe, on affiche le message spécifique demandé
        if (
          errorMsg.toLowerCase().includes("login") ||
          errorMsg.toLowerCase().includes("passe") ||
          errorMsg.toLowerCase().includes("incorrect")
        ) {
          errorMsg = t("initial.error.loginOrPin");
        }
        setPinError(errorMsg);
        return;
      }

      await secureSetItem("pin_user", hashedUserPin);
      await secureSetItem("user_firstname", firstName);
      await secureSetItem("user_lastname", lastName);
      // user_login est sauvegardé par loginUser avec la valeur retournée par le serveur
      await secureSetItem("user_secret_key", cleanSecret);

      await secureSetItem("is_configured", "true");
      markConfigured && (await markConfigured(true));
      navigation.replace("PinLogin");
    } catch (e) {
      setPinError(t("initial.error.saveFailed"));
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
        <ScrollView contentContainerStyle={{ padding: 16, flexGrow: 1 }}>
          <View style={styles.logoContainer}>
            <Image
              source={
                logoError
                  ? require("../../../../assets/icon.png")
                  : { uri: "https://lapeyrie-emf.ga/logo.png" }
              }
              style={styles.logo}
              onError={() => setLogoError(true)}
            />
          </View>

          <Text style={[styles.title, { color: palette.textMain }]}>
            {step === 1 ? t("initial.title.verify") : t("initial.title.pin")}
          </Text>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {otpProcessing ? (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: palette.card,
                    alignItems: "center",
                    paddingVertical: 40,
                  },
                ]}
              >
                <ActivityIndicator size="large" color={palette.primary} />
                <Text
                  style={{
                    marginTop: 16,
                    color: palette.textMain,
                    fontWeight: "600",
                  }}
                >
                  {t("initial.status.validating")}
                </Text>
              </View>
            ) : step === 1 ? (
              <View style={[styles.card, { backgroundColor: palette.card }]}>
                <Text style={[styles.label, { color: palette.textMain }]}>
                  {t("initial.labels.accountNumber")}
                </Text>
                <TextInput
                  ref={accountNumberRef}
                  value={accountNumber}
                  onChangeText={(t) => setAccountNumber(t.toUpperCase())}
                  placeholder={t("initial.placeholders.accountNumber")}
                  style={[
                    styles.input,
                    {
                      borderColor: palette.border,
                      backgroundColor: isDark ? "#111827" : "#FFFFFF",
                      color: palette.textMain,
                    },
                  ]}
                  placeholderTextColor={palette.textSub}
                  autoCapitalize="characters"
                  editable={!loadingVerify && !isLoading}
                />
                {(loadingVerify || isLoading) && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <ActivityIndicator color={palette.primary} />
                    <Text style={{ marginLeft: 8, color: palette.textSub }}>
                      {t("initial.status.loadingAccount")}
                    </Text>
                  </View>
                )}

                {verifyError && (
                  <Text
                    style={[
                      styles.error,
                      isDark
                        ? { backgroundColor: "#7F1D1D", color: "#FCA5A5" }
                        : {},
                    ]}
                  >
                    {verifyError}
                  </Text>
                )}
                {showVerifyButton && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      { marginTop: 12, backgroundColor: palette.primary },
                    ]}
                    onPress={handleVerifyAccountNumber}
                  >
                    {loadingVerify ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.buttonText}>{t("initial.actions.verify")}</Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    {
                      marginTop: 12,
                      backgroundColor: isDark ? "#1F2937" : "#F1F5F9",
                    },
                  ]}
                  onPress={handleGuestMode}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: isDark ? "#E5E7EB" : "#0F172A" },
                    ]}
                  >
                    {t("initial.guestMode")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: palette.card }]}>
                <Text style={[styles.label, { color: palette.textMain }]}>
                  {t("initial.labels.lastName")}
                </Text>
                <TextInput
                  ref={lastNameRef}
                  value={lastName}
                  onChangeText={setLastName}
                  style={[
                    styles.input,
                    {
                      borderColor: palette.border,
                      backgroundColor: isDark ? "#111827" : "#FFFFFF",
                      color: palette.textMain,
                    },
                  ]}
                  placeholderTextColor={palette.textSub}
                  editable={!hasPrefilledParams}
                />
                <Text style={[styles.label, { color: palette.textMain }]}>
                  {t("initial.labels.firstName")}
                </Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  style={[
                    styles.input,
                    {
                      borderColor: palette.border,
                      backgroundColor: isDark ? "#111827" : "#FFFFFF",
                      color: palette.textMain,
                    },
                  ]}
                  placeholderTextColor={palette.textSub}
                  editable={!hasPrefilledParams}
                />
                <Text style={[styles.label, { color: palette.textMain }]}>
                  {t("initial.labels.login")}
                </Text>
                <TextInput
                  value={loginReadonly}
                  onChangeText={setLoginReadonly}
                  style={[
                    styles.input,
                    {
                      borderColor: palette.border,
                      backgroundColor: isDark ? "#111827" : "#FFFFFF",
                      color: palette.textMain,
                    },
                  ]}
                  placeholderTextColor={palette.textSub}
                  placeholder={t("initial.placeholders.login")}
                  editable={!hasPrefilledParams}
                />

                <Text style={[styles.label, { color: palette.textMain }]}>
                  {t("initial.labels.pin")}
                </Text>
                <View style={styles.pinHintRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <View
                      key={`hint-${i}`}
                      style={[
                        styles.hintDot,
                        { borderColor: palette.border },
                        i < newPin.length ? styles.hintDotFilled : undefined,
                      ]}
                    />
                  ))}
                  {newPin.length === 5 && (
                    <MaterialIcons
                      name="check-circle"
                      size={16}
                      color="#22C55E"
                      style={styles.hintIcon}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.hintText,
                    { color: palette.textMain, fontWeight: "600" },
                  ]}
                >
                  {t("initial.hint.min5")}
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={newPin}
                    onChangeText={setNewPin}
                    style={[
                      styles.input,
                      {
                        borderColor:
                          newPin.length === 5 ? "#4CAF50" : palette.border,
                        backgroundColor: isDark ? "#111827" : "#FFFFFF",
                        color: palette.textMain,
                        paddingRight: 36,
                      },
                    ]}
                    secureTextEntry={!showNewPin}
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholder="•••••"
                    placeholderTextColor={palette.textSub}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPin((v) => !v)}
                    style={styles.iconOverlay}
                  >
                    <MaterialIcons
                      name={showNewPin ? "visibility" : "visibility-off"}
                      size={20}
                      color={palette.primary}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: palette.textMain }]}>
                  {t("initial.labels.pinConfirm")}
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    style={[
                      styles.input,
                      {
                        borderColor:
                          confirmPin.length === 5 && confirmPin === newPin
                            ? "#4CAF50"
                            : palette.border,
                        backgroundColor: isDark ? "#111827" : "#FFFFFF",
                        color: palette.textMain,
                        paddingRight: 36,
                      },
                    ]}
                    secureTextEntry={!showConfirmPin}
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholder="•••••"
                    placeholderTextColor={palette.textSub}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPin((v) => !v)}
                    style={styles.iconOverlay}
                  >
                    <MaterialIcons
                      name={showConfirmPin ? "visibility" : "visibility-off"}
                      size={20}
                      color={palette.primary}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: palette.textMain }]}>
                  Clé secrète
                </Text>
                <Text
                  style={[
                    styles.hintText,
                    { color: palette.textMain, fontWeight: "600" },
                  ]}
                >
                  3 caractères minimum
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={secretKey}
                    onChangeText={setSecretKey}
                    style={[
                      styles.input,
                      {
                        borderColor: palette.border,
                        backgroundColor: isDark ? "#111827" : "#FFFFFF",
                        color: palette.textMain,
                        paddingRight: 36,
                      },
                    ]}
                    secureTextEntry={!showSecretKey}
                    placeholder="3 caractères minimum"
                    placeholderTextColor={palette.textSub}
                  />
                  <TouchableOpacity
                    onPress={() => setShowSecretKey((v) => !v)}
                    style={styles.iconOverlay}
                  >
                    <MaterialIcons
                      name={showSecretKey ? "visibility" : "visibility-off"}
                      size={20}
                      color={palette.primary}
                    />
                  </TouchableOpacity>
                </View>

                {pinError && (
                  <Text
                    style={[
                      styles.error,
                      isDark
                        ? { backgroundColor: "#7F1D1D", color: "#FCA5A5" }
                        : {},
                    ]}
                  >
                    {pinError}
                  </Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.button,
                    { marginTop: 12, backgroundColor: palette.primary },
                  ]}
                  onPress={handleSavePin}
                >
                  {savingPin ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Enregistrer</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  label: { fontWeight: "600", marginBottom: 10 },
  button: {
    backgroundColor: "#0066CC",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: { fontWeight: "600", color: "#0F172A" },
  error: {
    color: "#DC2626",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    marginBottom: 12,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: { width: 200, height: 80, resizeMode: "contain" },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  helper: {
    fontSize: 11,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputContainer: {
    position: "relative",
  },
  eyeButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
  },
  iconOverlay: {
    position: "absolute",
    right: 10,
    top: 18,
  },
  pinHintRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  hintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    marginHorizontal: 4,
    backgroundColor: "transparent",
  },
  hintText: {
    fontSize: 12,
    textAlign: "left",
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  hintDotFilled: {
    backgroundColor: "#0066CC",
  },
  hintIcon: {
    marginLeft: 8,
  },
});

export default InitialSetupScreen;
