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
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import * as ScreenCapture from "expo-screen-capture";

import { useI18n } from "../../../app/providers/I18nProvider";
import { secureSetItem } from "../../../shared/utils/secureStorage";
import { useAuth } from "../../../app/hooks/useAuth";
import { useLogin } from "../../../domain/auth/useLogin";
import useClientByCompte from "../../../domain/auth/useClientByCompte";
import { useGetAccess } from "../../../domain/auth/useGetAccess";

const InitialSetupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { t } = useI18n();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const { user, markConfigured, login } = useAuth() as any;
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

  // Informations utilisateur
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loginReadonly, setLoginReadonly] = useState("");
  const [clientId, setClientId] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [secretKey, setSecretKey] = useState("");

  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [savingPin, setSavingPin] = useState(false);

  const [logoError, setLogoError] = useState(false);

  const accountNumberRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);

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

  // Lorsque clientData est récupéré
  useEffect(() => {
    if (step === 1 && clientData) {
      const ln = clientData.NOMCLIENT ?? clientData.lastName ?? "";
      const fn = clientData.PRENOMCLIENT ?? clientData.firstName ?? "";
      const lg = clientData.login ?? accountNumber;
      setLastName(ln);
      setFirstName(fn);
      setLoginReadonly(String(lg));
      const cid = clientData.IDCLIENT ?? clientData.id;
      if (cid) {
        const cidStr = String(cid);
        setClientId(cidStr);
        secureSetItem("client_id", cidStr);
      }
      setVerifySuccess(true);
      setTimeout(() => {
        setStep(2);
        setVerifySuccess(false);
      }, 300);
    }
  }, [clientData]);

  // Fonction vérification compte
  const handleVerifyAccountNumber = async () => {
    setVerifyError(null);
    if (!accountNumber || accountNumber.length < 8) {
      setVerifyError("Le numéro de compte doit contenir au moins 8 chiffres.");
      return;
    }
    setLoadingVerify(true);
    const ok = await fetchClientInfo({ NUMCOMPTE: accountNumber });
    setLoadingVerify(false);
    if (!ok) {
      setVerifyError(
        fetchError || "Erreur lors de la vérification. Réessayez."
      );
      return;
    }
    setVerifySuccess(true);
  };

  // Fonction mode invité
  const handleGuestMode = async () => {
    try {
      await login({ username: "invite", password: "invite" });
      markConfigured && (await markConfigured(true));
      navigation?.navigate("Main", { screen: "Dashboard" });
    } catch (e) {
      setVerifyError("Impossible d’activer le mode invité.");
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
      const hashedUserPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPin
      );
      await secureSetItem("pin_user", hashedUserPin);
      await secureSetItem("user_firstname", firstName);
      await secureSetItem("user_lastname", lastName);
      await secureSetItem("user_login", loginReadonly);
      await secureSetItem("user_secret_key", secretKey);
      await secureSetItem("is_configured", "true");

      const loginPayload = {
        LG_CODELANGUE: "FR",
        SL_LOGIN: loginReadonly,
        SL_MOTPASSE: newPin,
        TYPEOPERATEUR: "01",
        TYPEOPERATION: "01",
        CODECRYPTAGE: "Y}@128eVIXfoi7",
        TERMINALUUID: "",
      } as any;

      await loginUser(loginPayload);
      await getAccess();
      markConfigured && (await markConfigured(true));
      navigation.replace("PinLogin");
    } catch (e) {
      setPinError("Échec de l'enregistrement. Réessayez.");
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
            {step === 1 ? (
              <View style={[styles.card, { backgroundColor: palette.card }]}>
                <Text style={[styles.label, { color: palette.textMain }]}>
                  Numéro de compte
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
                />
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
                    <Text style={styles.buttonText}>Vérifier</Text>
                  )}
                </TouchableOpacity>

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
                    Mode invité
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: palette.card }]}>
                <Text style={[styles.label, { color: palette.textMain }]}>
                  Nom
                </Text>
                <TextInput
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
                />
                <Text style={[styles.label, { color: palette.textMain }]}>
                  Prénom
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
                />
                <Text style={[styles.label, { color: palette.textMain }]}>
                  Login
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
                />

                <Text style={[styles.label, { color: palette.textMain }]}>
                  Nouveau PIN
                </Text>
                <TextInput
                  value={newPin}
                  onChangeText={setNewPin}
                  style={[
                    styles.input,
                    {
                      borderColor: palette.border,
                      backgroundColor: isDark ? "#111827" : "#FFFFFF",
                      color: palette.textMain,
                    },
                  ]}
                  secureTextEntry={!showNewPin}
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholderTextColor={palette.textSub}
                />

                <Text style={[styles.label, { color: palette.textMain }]}>
                  Confirmer PIN
                </Text>
                <TextInput
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  style={[
                    styles.input,
                    {
                      borderColor: palette.border,
                      backgroundColor: isDark ? "#111827" : "#FFFFFF",
                      color: palette.textMain,
                    },
                  ]}
                  secureTextEntry={!showConfirmPin}
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholderTextColor={palette.textSub}
                />

                <Text style={[styles.label, { color: palette.textMain }]}>
                  Clé secrète
                </Text>
                <TextInput
                  value={secretKey}
                  onChangeText={setSecretKey}
                  style={[
                    styles.input,
                    {
                      borderColor: palette.border,
                      backgroundColor: isDark ? "#111827" : "#FFFFFF",
                      color: palette.textMain,
                    },
                  ]}
                  secureTextEntry={!showSecretKey}
                  placeholderTextColor={palette.textSub}
                />

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
  label: { fontWeight: "600", marginBottom: 6 },
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
});

export default InitialSetupScreen;
