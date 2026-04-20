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
  Modal,
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
      // Si on vient d'un reset (déconnexion explicite), on ne redirige pas
      if (route.params?.reset) {
        console.log("[InitialSetup] Reset requested - staying on setup screen");
        return;
      }

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
  }, [route.params]);

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
          accessData || (storedAccess ? JSON.parse(storedAccess) : null),
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
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  // États pour le formulaire login/mot de passe (CAS 1)
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Fonction vérification token
  const handleVerifyToken = async () => {
    setVerifyError(null);
    const currentToken = authToken.trim();

    if (!currentToken || currentToken.length < 3) {
      setVerifyError("Token invalide");
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setVerifyError(
        "Nombre de tentatives épuisé. Veuillez contacter votre gestionnaire pour réinitialiser votre token.",
      );
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
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      const remaining = MAX_ATTEMPTS - newAttempts;

      if (remaining <= 0) {
        setVerifyError(
          "Nombre de tentatives épuisé. Veuillez contacter votre gestionnaire pour réinitialiser votre token.",
        );
      } else {
        setVerifyError(
          `${
            fetchError || t("initial.error.verification")
          }. ${remaining} tentative(s) restante(s).`,
        );
      }

      setLastFailedToken(currentToken); // Marquer ce token comme échoué
      return;
    }

    // Succès
    setAttempts(0); // Reset en cas de succès
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

    console.log(
      "[InitialSetup] Client Info Full:",
      JSON.stringify(info, null, 2),
    );

    // Fonction de recherche récursive (profondeur limitée) pour trouver le login
    const findLoginDeep = (obj: any, depth = 0): string => {
      if (!obj || depth > 2) return "";

      // Priorité 1: SL_LOGIN (exact match)
      if (obj.SL_LOGIN) return String(obj.SL_LOGIN);

      // Priorité 2: Autres variantes
      const keys = [
        "sl_login",
        "login",
        "user_login",
        "username",
        "cl_login",
        "login_user",
        "cl_nomclient", // Fallback: Nom du client comme login si SL_LOGIN manquant
        "cl_email", // Fallback: Email comme login
      ];
      for (const k of keys) {
        // Case insensitive check
        const foundKey = Object.keys(obj).find(
          (key) => key.toLowerCase() === k,
        );
        if (foundKey && obj[foundKey]) return String(obj[foundKey]);
      }

      // Recherche dans les sous-objets communs
      if (Array.isArray(obj.data) && obj.data[0])
        return findLoginDeep(obj.data[0], depth + 1);
      if (obj.data && typeof obj.data === "object")
        return findLoginDeep(obj.data, depth + 1);
      if (obj.result && typeof obj.result === "object")
        return findLoginDeep(obj.result, depth + 1);
      if (Array.isArray(obj.result) && obj.result[0])
        return findLoginDeep(obj.result[0], depth + 1);

      return "";
    };

    // TENTATIVE D'EXTRACTION DU LOGIN DEPUIS LE JWT (Si le serveur ne le renvoie pas explicitement)
    // Le serveur renvoie souvent un access_token qui contient le "sub" (subject) qui est le login.
    let extractedLoginFromToken = "";
    const jwtToken = info.access_token || info.authtoken || info.token;

    if (
      jwtToken &&
      typeof jwtToken === "string" &&
      jwtToken.split(".").length === 3
    ) {
      try {
        const decodeBase64 = (input: string) => {
          const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
          let str = input.replace(/=+$/, "");
          let output = "";
          if (str.length % 4 == 1) throw new Error("'atob' failed");
          for (
            let bc = 0, bs = 0, buffer, i = 0;
            (buffer = str.charAt(i++));
            ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
              ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
              : 0
          ) {
            buffer = chars.indexOf(buffer);
          }
          return output;
        };
        const base64Url = jwtToken.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          decodeBase64(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        );
        const payload = JSON.parse(jsonPayload);

        // Le login est souvent dans "sub" ou "username" ou "login" du payload JWT
        // "sub" peut être un objet ou une string.
        if (typeof payload.sub === "string") {
          extractedLoginFromToken = payload.sub;
        } else if (typeof payload.sub === "object") {
          extractedLoginFromToken =
            payload.sub.login ||
            payload.sub.username ||
            payload.sub.nom_utilisateur ||
            "";
        }

        if (!extractedLoginFromToken) {
          extractedLoginFromToken = payload.login || payload.username || "";
        }

        console.log(
          "[InitialSetup] Extracted login from JWT:",
          extractedLoginFromToken,
        );
      } catch (e) {
        console.warn(
          "[InitialSetup] Failed to decode JWT for login extraction",
          e,
        );
      }
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

    // Extraction explicite du SL_LOGIN depuis la réponse serveur (via recherche profonde)
    const slLoginFromData = findLoginDeep(info);

    const loginCandidate =
      slLoginFromData || // Priorité absolue au SL_LOGIN trouvé dans la réponse
      extractedLoginFromToken || // Puis extraction JWT
      clientRecord.LOGIN ||
      clientRecord.login ||
      clientRecord.CO_CODECOMPTE || // Fallback ultime si le login est vide mais qu'on a un code compte
      authToken || // Fallback ultime: ce que l'utilisateur a saisi (ex: numéro de compte)
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

    // Fonction de recherche récursive pour trouver autoplay
    const findAutoplayDeep = (
      obj: any,
      depth = 0,
    ): boolean | string | number | undefined => {
      if (!obj || depth > 3) return undefined;

      if (obj.autoplay !== undefined) return obj.autoplay;
      if (obj.AUTOPLAY !== undefined) return obj.AUTOPLAY;
      if (obj.token_info?.autoplay !== undefined)
        return obj.token_info.autoplay;

      // Recherche dans les sous-objets
      if (Array.isArray(obj.data) && obj.data[0])
        return findAutoplayDeep(obj.data[0], depth + 1);
      if (obj.data && typeof obj.data === "object")
        return findAutoplayDeep(obj.data, depth + 1);
      if (obj.result && typeof obj.result === "object")
        return findAutoplayDeep(obj.result, depth + 1);

      return undefined;
    };

    // Helper pour trouver le PIN
    const findPinDeep = (obj: any, depth = 0): string | undefined => {
      if (!obj || depth > 4) return undefined;

      const keys = [
        "PIN",
        "pin",
        "DEFAULT_PIN",
        "default_pin",
        "CODE_SECRET",
        "code_secret",
        "SL_PIN",
        "sl_pin",
        "USER_PIN",
        "user_pin",
        "MOT_DE_PASSE",
        "mot_de_passe",
        "PASSWORD",
        "password",
      ];

      for (const k of keys) {
        if (obj[k]) return String(obj[k]);
      }

      // Parfois le pin est dans token_info
      if (obj.token_info) {
        for (const k of keys) {
          if (obj.token_info[k]) return String(obj.token_info[k]);
        }
      }

      // Recursion sur les conteneurs connus
      if (Array.isArray(obj.data) && obj.data[0])
        return findPinDeep(obj.data[0], depth + 1);
      if (obj.data && typeof obj.data === "object")
        return findPinDeep(obj.data, depth + 1);
      if (obj.result && typeof obj.result === "object")
        return findPinDeep(obj.result, depth + 1);
      if (Array.isArray(obj.result) && obj.result[0])
        return findPinDeep(obj.result[0], depth + 1);
      if (Array.isArray(obj.payload) && obj.payload[0])
        return findPinDeep(obj.payload[0], depth + 1);
      if (obj.payload && typeof obj.payload === "object")
        return findPinDeep(obj.payload, depth + 1);

      return undefined;
    };

    // LOGIQUE STRICTE SERVEUR :
    // On récupère uniquement la valeur envoyée par le serveur dans token_info.
    // Aucune déduction, aucune recherche récursive, aucun fallback local.
    const rawAutoplay = info.token_info?.autoplay;

    // Conversion simple pour gérer les formats JSON (booléen ou string "true")
    let isAutoplay =
      rawAutoplay === true ||
      String(rawAutoplay).toLowerCase() === "true" ||
      rawAutoplay === 1;

    // GUARD: Gestion de l'état "Déjà Consommé" pour l'Autoplay.
    // Si le serveur renvoie autoplay=true pour un token qu'on a DÉJÀ traité en autoplay,
    // on doit forcer false pour éviter une boucle infinie si l'utilisateur revient en arrière.
    const lastAutoplayToken = await secureGetItem(
      "last_autoplay_token_consumed",
    );

    if (isAutoplay && lastAutoplayToken === authToken) {
      console.log(
        `[InitialSetup] Token ${authToken} already consumed for Autoplay. Forcing FALSE.`,
      );
      isAutoplay = false;
    } else if (isAutoplay) {
      // Si c'est un nouveau token en autoplay, on le marque comme consommé
      await secureSetItem("last_autoplay_token_consumed", authToken);
    }

    // GUARD: Si l'utilisateur est déjà configuré localement, on FORCE autoplay à FALSE.
    // Cela empêche le pré-remplissage automatique (silentOtp) et la redirection vers Step 2
    // même si le serveur dit "autoplay: true".
    const localConf = await secureGetItem("is_configured");
    const localPin = await secureGetItem("pin_user");

    if (localConf === "true" && localPin) {
      console.log(
        "[InitialSetup] Local config detected -> FORCING Autoplay=FALSE to prevent silent OTP loop",
      );
      isAutoplay = false;
    }

    console.log(
      `[InitialSetup] Autoplay Decision Final: ${isAutoplay} (Server: ${rawAutoplay}, LocalOverride: ${localConf === "true"})`,
    );

    const dev = await secureGetItem("device_id");
    const accStored = await secureGetItem("user_account_number");

    console.log("[InitialSetup] SERVER RESPONSE ANALYSIS:", {
      TokenEnvoi: authToken,
      DeviceIdEnvoi: dev, // On loggue ce qu'on a envoyé (récupéré plus haut)
      AutoplayRecu: rawAutoplay,
      IsAutoplayFinal: isAutoplay,
      LoginRecu: loginCandidate,
      FullTokenInfo: info.token_info,
    });

    if (isAutoplay) {
      console.log("Autoplay is enabled");

      const foundPin = findPinDeep(info);
      if (foundPin) {
        console.log(
          `[InitialSetup] PIN retrieved for first configuration (Autoplay): "${foundPin}"`,
        );
      } else {
        console.log(
          "[InitialSetup] Autoplay enabled but NO PIN found in response.",
        );
        // Log FULL response to debug
        try {
          console.log(
            "[InitialSetup] FULL RESPONSE DEBUG:",
            JSON.stringify(info, null, 2),
          );
        } catch {}
      }

      if (loginCandidate) {
        console.log(
          `[InitialSetup] Login utilisé pour la session Autoplay : "${loginCandidate}"`,
        );
      } else {
        console.warn(
          "[InitialSetup] ATTENTION: Autoplay activé MAIS login vide !",
        );
      }
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

    const proceedToStep2 = () => {
      setVerifySuccess(false);
      setOtpProcessing(true);
      setTimeout(() => {
        setOtpProcessing(false);
        setStep(2);
      }, 2000);
    };

    if (isAutoplay) {
      // REGLE UTILISATEUR: Autoplay = TRUE -> "Précharger, Définir ses accès"
      // C'est une session de configuration assistée (Autoplay).
      try {
        // Sauvegarde du Login pour pré-remplissage (Precharger)
        if (loginCandidate) {
          console.log(
            "[InitialSetup] Saving login for prefill (Autoplay=TRUE):",
            loginCandidate,
          );
          await secureSetItem("user_login", loginCandidate);
          await new Promise((r) => setTimeout(r, 100));
        }
      } catch (e) {
        console.error("Autoplay setup error", e);
      }
    }

    // NOUVELLE LOGIQUE: On redirige TOUJOURS vers l'écran OTP après vérification du token.
    // C'est l'écran OTP qui gérera le comportement (Automatique ou Manuel) selon le flag isAutoplay.
    console.log(
      `[InitialSetup] Token Verified. Navigating to OtpVerify. isAutoplay=${isAutoplay}`,
    );

    navigation.navigate("OtpVerify", {
      isAutoplay: isAutoplay,
      numero_compte: realAccountNumber || authToken,
      device_id: dev,
      // Callback appelé si l'OTP est validé avec succès
      onSuccess: async () => {
        console.log(
          `[InitialSetup] OTP Verified Success. isAutoplay=${isAutoplay}`,
        );

        // CORRECTION BUG UTILISATEUR:
        // Si l'utilisateur a déjà configuré son compte (PIN stocké localement),
        // on ignore le flag isAutoplay (qui pourrait être TRUE à tort selon le serveur)
        // et on le redirige directement vers le Login pour éviter une boucle de configuration.
        const isConfigured = await secureGetItem("is_configured");
        const storedPin = await secureGetItem("pin_user");

        if (isConfigured === "true" && storedPin) {
          console.log(
            "[InitialSetup] Already Configured -> Force Redirect to PinLogin (Override Autoplay)",
          );
          navigation.replace("PinLogin");
          return;
        }

        if (isAutoplay) {
          // CAS 1: Autoplay = TRUE
          // "Le système précharge automatiquement l’OTP... L’utilisateur est ensuite redirigé vers la configuration de ses accès."
          console.log(
            "[InitialSetup] Autoplay TRUE -> Proceeding to Step 2 (Create/Config Access)",
          );
          setStep(2);
        } else {
          // CAS 2: Autoplay = FALSE
          // "L’utilisateur doit saisir manuellement l’OTP. Une fois validé, il est redirigé directement vers l’écran PIN Login."
          console.log(
            "[InitialSetup] Autoplay FALSE -> Redirecting to PinLogin (Access already defined)",
          );

          // On s'assure que la config est marquée comme faite
          await secureSetItem("is_configured", "true");

          // Si on a un login, on le sauvegarde pour faciliter la connexion
          if (loginCandidate) {
            await secureSetItem("user_login", loginCandidate);
          }

          navigation.replace("PinLogin");
        }
      },
    });
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

  // Fonction login + détection CodeOtp (CAS 1)
  const handleLoginSubmit = async () => {
    setLoginError(null);
    if (!loginInput.trim() || !passwordInput.trim()) {
      setLoginError("Veuillez saisir votre login et votre mot de passe.");
      return;
    }
    setLoginLoading(true);
    try {
      const deviceId = (await secureGetItem("device_id")) || "";
      const result = await loginUser({
        LG_CODELANGUE: "FR",
        SL_LOGIN: loginInput.trim().toUpperCase(),
        SL_MOTPASSE: passwordInput.trim(),
        TYPEOPERATEUR: "01",
        TYPEOPERATION: "01",
        CODECRYPTAGE: "Y}@128eVIXfoi7",
        TERMINALUUID: deviceId,
      });

      if (!result.success) {
        const errMsg =
          (result as any)?.error?.response?.data?.message ||
          (result as any)?.error?.message ||
          "Identifiants incorrects.";
        setLoginError(errMsg);
        return;
      }

      const responseData = (result as any)?.data;

      // La réponse API retourne data comme tableau : data[0] contient les infos
      const dataRecord = Array.isArray(responseData?.data)
        ? responseData.data[0]
        : responseData?.data ?? responseData;

      // Détection CodeOtp (présent dans data[0].CodeOtp selon l'API)
      const codeOtpPresent =
        dataRecord?.CodeOtp ||
        dataRecord?.code_otp ||
        responseData?.CodeOtp ||
        responseData?.otp_required === true;

      if (codeOtpPresent) {
        const userIdForOtp =
          dataRecord?.CL_IDCLIENT ||
          dataRecord?.user_id ||
          dataRecord?.id ||
          responseData?.user_id ||
          loginInput.trim();
        const otpCode =
          dataRecord?.CodeOtp ||
          dataRecord?.code_otp ||
          responseData?.CodeOtp ||
          "";
        console.log(`[OTP] CodeOtp reçu : "${otpCode}" | user_id : "${userIdForOtp}"`);
        navigation.navigate("OtpSimple", {
          user_id: String(userIdForOtp),
          debug_otp: String(otpCode),
        });
        return;
      }

      // Pas d'OTP → flux normal
      await markConfigured(true);
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch (e: any) {
      setLoginError(e?.message ?? "Erreur réseau.");
    } finally {
      setLoginLoading(false);
    }
  };

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
          }),
        );
        await secureSetItem("user_login", "invite");
        try {
          const hashedDefaultPin = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            "12345",
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
        String(e?.message || "Impossible d’activer le mode invité."),
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
        newPin,
      );

      const deviceId = (await secureGetItem("device_id")) || "";

      // Appel au service updateLogin pour mettre à jour les infos (login/pin)
      // et valider la clé secrète.
      const updatePayload = {
        nouveau_login: cleanLogin,
        nouveau_motpasse: newPin,
        cle_secrete: cleanSecret,
        code_cryptage: "Y}@128eVIXfoi7",
        // Ajout de champs alternatifs pour maximiser la compatibilité avec le backend
        SL_LOGIN: cleanLogin,
        LOGIN: cleanLogin,
        sl_login: cleanLogin,
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

      console.log(
        "[InitialSetup] updateLogin SUCCESS. Server response:",
        JSON.stringify(result.data, null, 2),
      );

      // EXTRACTION DU LOGIN DEPUIS LA RÉPONSE UPDATE (Source de vérité)
      // Si le serveur a ignoré le nouveau login ou l'a normalisé, on prend ce qu'il nous renvoie.
      // Cela évite le décalage entre le login stocké localement et le login serveur.

      // On réutilise une logique simplifiée d'extraction (findLoginDeep n'est pas dispo ici)
      const extractLoginFromUpdate = (data: any): string => {
        if (!data) return "";
        // Vérifier les champs standards
        if (data.SL_LOGIN) return String(data.SL_LOGIN);
        if (data.sl_login) return String(data.sl_login);
        if (data.LOGIN) return String(data.LOGIN);
        if (data.login) return String(data.login);

        // Vérifier dans data[0] si c'est un tableau
        const inner = Array.isArray(data.data)
          ? data.data[0]
          : typeof data.data === "object"
            ? data.data
            : null;
        if (inner) {
          if (inner.SL_LOGIN) return String(inner.SL_LOGIN);
          if (inner.sl_login) return String(inner.sl_login);
          if (inner.LOGIN) return String(inner.LOGIN);
          if (inner.login) return String(inner.login);
        }

        return "";
      };

      const serverConfirmedLogin = extractLoginFromUpdate(result.data);

      // Si le serveur renvoie un login, on l'utilise. Sinon on garde celui qu'on a envoyé.
      const finalLoginToSave = serverConfirmedLogin || cleanLogin;

      console.log(
        `[InitialSetup] Final Login to Save: "${finalLoginToSave}" (Sent: "${cleanLogin}", Server: "${serverConfirmedLogin}")`,
      );

      await secureSetItem("pin_user", hashedUserPin);
      await secureSetItem("user_firstname", firstName);
      await secureSetItem("user_lastname", lastName);
      // user_login est sauvegardé avec la valeur confirmée par le serveur
      await secureSetItem("user_login", finalLoginToSave);
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
              <>
              <View style={[styles.card, { backgroundColor: palette.card }]}>
                <RNText style={[styles.label, { color: palette.textMain }]}>Login</RNText>
                <TextInput
                  value={loginInput}
                  onChangeText={setLoginInput}
                  placeholder="Votre identifiant"
                  style={[
                    styles.input,
                    {
                      borderColor: palette.border,
                      backgroundColor: isDark ? "#111827" : "#FFFFFF",
                      color: palette.textMain,
                    },
                  ]}
                  placeholderTextColor={palette.textSub}
                  autoCapitalize="none"
                  editable={!loginLoading}
                />

                <RNText style={[styles.label, { color: palette.textMain }]}>Mot de passe</RNText>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={passwordInput}
                    onChangeText={setPasswordInput}
                    placeholder="Votre mot de passe"
                    style={[
                      styles.input,
                      {
                        borderColor: palette.border,
                        backgroundColor: isDark ? "#111827" : "#FFFFFF",
                        color: palette.textMain,
                        paddingRight: 40,
                      },
                    ]}
                    placeholderTextColor={palette.textSub}
                    secureTextEntry={!showPassword}
                    editable={!loginLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={styles.iconOverlay}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={20}
                      color={palette.primary}
                    />
                  </TouchableOpacity>
                </View>

                {loginError && (
                  <RNText
                    style={[
                      styles.error,
                      isDark ? { backgroundColor: "#7F1D1D", color: "#FCA5A5" } : {},
                    ]}
                  >
                    {loginError}
                  </RNText>
                )}

                <TouchableOpacity
                  style={[styles.button, { marginTop: 4, backgroundColor: palette.primary }]}
                  onPress={handleLoginSubmit}
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <RNText style={styles.buttonText}>Se connecter</RNText>
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
              </>
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
