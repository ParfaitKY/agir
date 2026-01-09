import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text as RNText,
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
import { updateLogin } from "../../../services/auth/updateLogin";
import { useClientByTokenV2 } from "../../../domain/auth/useClientByTokenV2";
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
  } = useClientByTokenV2();

  // Steps: 1 = vérification token, 2 = configuration PIN
  const [step, setStep] = useState<1 | 2>(1);
  const [authToken, setAuthToken] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [otpProcessing, setOtpProcessing] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState("");

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
  const showVerifyButton = step === 1 && authToken.trim().length > 3;

  const authTokenRef = useRef<TextInput>(null);
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
    if (step === 1) authTokenRef.current?.focus();
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

  const [lastFailedToken, setLastFailedToken] = useState("");

  // Fonction vérification token
  const handleVerifyToken = async () => {
    setVerifyError(null);
    const currentToken = authToken.trim();

    if (!currentToken || currentToken.length < 3) {
      setVerifyError("Token invalide");
      return;
    }

    // Éviter de réessayer le même token invalide
    if (currentToken === lastFailedToken) {
      return;
    }

    setLoadingVerify(true);
    const info = await fetchClientInfo({ authtoken: currentToken });
    setLoadingVerify(false);

    if (!info) {
      setVerifyError(fetchError || t("initial.error.verification"));
      setLastFailedToken(currentToken); // Marquer ce token comme échoué
      return;
    }

    // Succès
    setLastFailedToken(""); // Reset en cas de succès
    setVerifiedToken(currentToken);
    setVerifySuccess(true);

    // Normalisation des données reçues (gestion du cas où data est un tableau)
    let clientRecord = info;
    if (Array.isArray(info?.data)) {
      clientRecord = info.data[0] ?? {};
    } else if (info?.data && typeof info.data === "object") {
      clientRecord = info.data;
    }

    const ln =
      clientRecord.CL_NOMCLIENT ??
      clientRecord.NOMCLIENT ??
      clientRecord.lastName ??
      clientRecord.nom ??
      clientRecord.NOM ??
      "";
    const fn =
      clientRecord.CL_PRENOMCLIENT ??
      clientRecord.PRENOMCLIENT ??
      clientRecord.firstName ??
      clientRecord.prenom ??
      clientRecord.PRENOM ??
      "";

    const userPhone =
      clientRecord.CL_TELEPHONE ??
      clientRecord.TELEPHONE ??
      clientRecord.TEL ??
      clientRecord.PHONE ??
      clientRecord.MOBILE ??
      clientRecord.contact ??
      "";

    const userEmail =
      clientRecord.CL_EMAIL ??
      clientRecord.AG_EMAIL ??
      clientRecord.EMAIL ??
      clientRecord.MAIL ??
      clientRecord.email ??
      "";

    setLastName(ln);
    setFirstName(fn);

    const loginCandidate =
      clientRecord.SL_LOGIN ??
      clientRecord.LOGIN ??
      clientRecord.login ??
      clientRecord.username ??
      clientRecord.USER_LOGIN ??
      "";
    if (loginCandidate) {
      setLoginReadonly(loginCandidate);
    }

    // Si on a récupéré des infos, on peut considérer qu'elles sont pré-remplies
    // On laisse éditable si jamais il manque des infos, mais on sauvegarde
    if (ln) secureSetItem("user_lastname", ln);
    if (fn) secureSetItem("user_firstname", fn);
    if (loginCandidate) secureSetItem("user_login", loginCandidate);
    if (userPhone) secureSetItem("user_phone", String(userPhone));
    if (userEmail) secureSetItem("user_email", String(userEmail));

    // Check autoplay or token_info
    const isAutoplay = info.token_info?.autoplay;
    if (isAutoplay) {
      console.log("Autoplay is enabled");
    }

    const cid = info.IDCLIENT ?? info.id ?? info.token_info?.client_id;
    if (cid) {
      const cidStr = String(cid);
      setClientId(cidStr);
      secureSetItem("client_id", cidStr);
    }

    const phone = String(info.phone || info.telephone || "+225 07 ***** 12");

    // Extraction du numéro de compte réel depuis la réponse serveur
    // On cherche NUMEROCOMPTE, CO_CODECOMPTE, etc. dans clientRecord
    const realAccountNumber =
      clientRecord.CO_CODECOMPTE ??
      clientRecord.NUMEROCOMPTE ??
      clientRecord.account_number ??
      clientRecord.numero_compte ??
      clientRecord.NUMCOMPTE ??
      "";

    if (realAccountNumber) {
      // On sauvegarde le vrai numéro de compte
      secureSetItem("user_account_number", String(realAccountNumber));
    }

    const accStored = await secureGetItem("user_account_number");
    const dev = await secureGetItem("device_id");

    const proceedToStep2 = () => {
      setVerifySuccess(false);
      setOtpProcessing(true);
      setTimeout(() => {
        setOtpProcessing(false);
        setStep(2);
      }, 2000);
    };

    if (isAutoplay) {
      // Si autoplay est activé, on saute l'écran OTP
      proceedToStep2();
    } else {
      // On navigue vers OTP
      (navigation as any).navigate("OtpVerify", {
        phone,
        // Priorité au numéro de compte extrait de la réponse serveur,
        // sinon celui stocké, sinon ce que l'utilisateur a saisi (fallback)
        numero_compte: realAccountNumber || accStored || authToken,
        device_id: dev || "",
        onSuccess: proceedToStep2,
        onCancel: () => {
          setVerifySuccess(false);
          setVerifiedToken("");
          setAuthToken("");
          setStep(1);
        },
      });
    }
  };

  useEffect(() => {
    if (autoVerifyRef.current) clearTimeout(autoVerifyRef.current);
    const tok = authToken.trim();
    // On ne lance l'auto-verify que si :
    // 1. Le token est assez long
    // 2. Ce n'est pas déjà le token validé
    // 3. Ce n'est pas le dernier token qui a échoué (pour éviter la boucle)
    if (
      step === 1 &&
      tok.length >= 7 &&
      tok !== verifiedToken &&
      tok !== lastFailedToken
    ) {
      autoVerifyRef.current = setTimeout(() => {
        if (loadingVerify || isLoading) return;
        handleVerifyToken();
      }, 1000);
    }
    return () => {
      if (autoVerifyRef.current) clearTimeout(autoVerifyRef.current);
    };
  }, [
    authToken,
    step,
    loadingVerify,
    isLoading,
    verifiedToken,
    lastFailedToken,
  ]);

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

      // Appel au service updateLogin pour mettre à jour les infos (login/pin)
      // et valider la clé secrète.
      const updatePayload = {
        nouveau_login: cleanLogin,
        nouveau_motpasse: newPin,
        cle_secrete: cleanSecret,
        code_cryptage: "Y}@128eVIXfoi7",
      };

      // On peut passer le client_id dans les headers si nécessaire
      // Le serveur demande un Authorization Header.
      // On essaie de trouver un vrai JWT dans les données client reçues (clientData).
      // Sinon, on envoie le token d'activation, mais sans le préfixe "Bearer" si ce n'est pas un JWT,
      // ou alors on suppose que le serveur gère mal le cas "Bearer code".
      // L'erreur "Not enough segments" indique que le serveur attend un format JWT (x.y.z).

      const jwtToken =
        clientData?.token ||
        clientData?.jwt ||
        clientData?.access_token ||
        clientData?.data?.token;

      // Si on a un JWT, on l'utilise avec Bearer.
      // Si on a juste le code d'activation (verifiedToken), on essaie de le passer mais le serveur semble vouloir un JWT.
      // Une astuce : peut-être que le serveur attend le code dans un autre header custom si ce n'est pas un JWT.

      const tokenToUse = jwtToken || verifiedToken || authToken;

      const headers: any = {
        ...(clientId ? { "X-CLIENT-ID": String(clientId) } : {}),
      };

      // Si le token ressemble à un JWT (contient des points), on met Bearer.
      // Sinon, on essaie de le passer tel quel ou on ne met pas le header Authorization si on pense que ça va crasher le serveur.
      // Mais vu "Missing Authorization Header", il le faut.

      if (tokenToUse) {
        if (String(tokenToUse).includes(".")) {
          headers["Authorization"] = `Bearer ${tokenToUse}`;
        } else {
          // Ce n'est pas un JWT, mais le serveur le veut.
          // On essaie sans "Bearer " pour voir si ça évite le parsing JWT strict,
          // OU on le met quand même si le serveur a un bug de message d'erreur.
          // Essayons de le passer tel quel, certains parsers sont plus tolérants sans le préfixe.
          headers["Authorization"] = `Bearer ${tokenToUse}`;
        }
      }

      // TENTATIVE DE FIX: Ajouter X-NO-AUTH pour bypasser les middlewares stricts si possible,
      // tout en laissant le header Authorization pour le controlleur final.
      headers["X-NO-AUTH"] = "true";

      const result = await updateLogin(updatePayload, headers);

      if (result.error) {
        const err = result.error as any;
        let errorMsg =
          typeof err === "string"
            ? err
            : err?.response?.data?.message ||
              err?.message ||
              t("initial.error.loginOrPin");

        // Si l'erreur mentionne login/mot de passe/clé
        if (
          errorMsg.toLowerCase().includes("login") ||
          errorMsg.toLowerCase().includes("passe") ||
          errorMsg.toLowerCase().includes("clé") ||
          errorMsg.toLowerCase().includes("incorrect")
        ) {
          // On peut garder le message précis du serveur ou mettre un générique
          // errorMsg = t("initial.error.loginOrPin");
        }
        setPinError(errorMsg);
        return;
      }

      await secureSetItem("pin_user", hashedUserPin);
      await secureSetItem("user_firstname", firstName);
      await secureSetItem("user_lastname", lastName);
      // user_login est sauvegardé
      await secureSetItem("user_login", cleanLogin);
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
              source={require("../../../../assets/cedaici-transparent.png")}
              style={styles.logo}
              onError={() => setLogoError(true)}
            />
          </View>

          <RNText style={[styles.title, { color: palette.textMain }]}>
            {step === 1 ? t("initial.title.verify") : t("initial.title.pin")}
          </RNText>

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
                <RNText
                  style={{
                    marginTop: 16,
                    color: palette.textMain,
                    fontWeight: "600",
                  }}
                >
                  {t("initial.status.validating")}
                </RNText>
              </View>
            ) : step === 1 ? (
              <View style={[styles.card, { backgroundColor: palette.card }]}>
                <RNText style={[styles.label, { color: palette.textMain }]}>
                  {t("initial.labels.accountNumber")}
                </RNText>
                <TextInput
                  ref={authTokenRef}
                  value={authToken}
                  onChangeText={(t) => setAuthToken(t.toUpperCase())}
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
                    <RNText style={{ marginLeft: 8, color: palette.textSub }}>
                      {t("initial.status.loadingAccount")}
                    </RNText>
                  </View>
                )}

                {verifyError && (
                  <RNText
                    style={[
                      styles.error,
                      isDark
                        ? { backgroundColor: "#7F1D1D", color: "#FCA5A5" }
                        : {},
                    ]}
                  >
                    {verifyError}
                  </RNText>
                )}
                {showVerifyButton && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      { marginTop: 12, backgroundColor: palette.primary },
                    ]}
                    onPress={handleVerifyToken}
                  >
                    {loadingVerify ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <RNText style={styles.buttonText}>
                        {t("initial.actions.verify")}
                      </RNText>
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
                  <RNText
                    style={[
                      styles.secondaryButtonText,
                      { color: isDark ? "#E5E7EB" : "#0F172A" },
                    ]}
                  >
                    {t("initial.guestMode")}
                  </RNText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: palette.card }]}>
                <RNText style={[styles.label, { color: palette.textMain }]}>
                  {t("initial.labels.lastName")}
                </RNText>
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
                <RNText style={[styles.label, { color: palette.textMain }]}>
                  {t("initial.labels.firstName")}
                </RNText>
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
                <RNText style={[styles.label, { color: palette.textMain }]}>
                  {t("initial.labels.login")}
                </RNText>
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

                <RNText style={[styles.label, { color: palette.textMain }]}>
                  {t("initial.labels.pin")}
                </RNText>
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
                <RNText
                  style={[
                    styles.hintText,
                    { color: palette.textMain, fontWeight: "600" },
                  ]}
                >
                  {t("initial.hint.min5")}
                </RNText>
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

                <RNText style={[styles.label, { color: palette.textMain }]}>
                  {t("initial.labels.pinConfirm")}
                </RNText>
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

                <RNText style={[styles.label, { color: palette.textMain }]}>
                  Clé secrète
                </RNText>
                <RNText
                  style={[
                    styles.hintText,
                    { color: palette.textMain, fontWeight: "600" },
                  ]}
                >
                  3 caractères minimum
                </RNText>
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
                  <RNText
                    style={[
                      styles.error,
                      isDark
                        ? { backgroundColor: "#7F1D1D", color: "#FCA5A5" }
                        : {},
                    ]}
                  >
                    {pinError}
                  </RNText>
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
                    <RNText style={styles.buttonText}>Enregistrer</RNText>
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
    marginTop: 50,
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
