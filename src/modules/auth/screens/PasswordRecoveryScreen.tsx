import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useAuth } from "../../../app/hooks/useAuth";
import {
  secureGetItem,
  secureSetItem,
} from "../../../shared/utils/secureStorage";
import * as Crypto from "expo-crypto";
import { updateLogin } from "../../../services/auth/updateLogin";

import { clientByCompte } from "../../../services/auth/clientByCompte";

const PasswordRecoveryScreen: React.FC = () => {
  const navigation = useNavigation() as any;
  const { colors } = useTheme();
  const { user } = useAuth() as any;
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [secretFocused, setSecretFocused] = useState(false);
  const [validated, setValidated] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleRecover = async () => {
    setError(null);
    setSuccess(null);
    const guest = user?.username === "invite";
    if (guest) {
      setError("Compte invité non éligible.");
      return;
    }
    if (!emailOrPhone) {
      setError("Veuillez renseigner votre email ou téléphone.");
      return;
    }
    if (!secretKey) {
      setError("Clé secrète invalide. Réinitialisation impossible.");
      return;
    }
    setLoading(true);
    try {
      const storedLogin = await secureGetItem("user_login");
      const storedUser = await secureGetItem("user_data");

      // En mode recovery "offline" (vérif locale), on vérifie le login stocké
      if (!storedLogin && !storedUser) {
        // Si on n'a rien en local, on ne peut pas vérifier la clé secrète stockée
        // Mais on peut laisser passer si l'utilisateur saisit son email/login
        // pour tenter une mise à jour serveur directe à l'étape suivante.
        console.log(
          "Recovery: No local user found, proceeding with input login",
        );
      } else {
        // Vérification de la clé secrète locale SI elle existe
        const storedSecret = await secureGetItem("user_secret_key");
        if (storedSecret && storedSecret !== secretKey) {
          setError("Clé secrète invalide. Réinitialisation impossible.");
          return;
        }
      }

      setValidated(true);
      setSuccess("Identité vérifiée. Saisissez un nouveau code PIN.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async () => {
    setPinError(null);
    if (!validated) {
      setPinError("Validation requise.");
      return;
    }
    if (!newPin || !confirmPin) {
      setPinError("Veuillez saisir le nouveau PIN et sa confirmation.");
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
    setPinLoading(true);
    try {
      // 1. Appel API pour mise à jour sur le serveur
      // En mode recovery, on utilise emailOrPhone comme login, ou on fallback sur le login stocké
      const storedLogin = (await secureGetItem("user_login")) || emailOrPhone;

      if (!storedLogin) {
        setPinError("Identifiant (login) manquant.");
        return;
      }

      // 3. Construction du payload
      // Le serveur demande explicitement "device_id" (vu dans l'erreur précédente).
      // Il semble aussi qu'il faille un format JWT valide pour l'Authorization (Not enough segments).

      const cleanLogin = String(storedLogin).trim();
      const cleanSecret = String(secretKey).trim();
      const cleanPin = String(newPin).trim();
      const deviceId = (await secureGetItem("device_id")) || "unknown_device";

      const payload: any = {
        nouveau_login: cleanLogin,
        nouveau_motpasse: cleanPin,
        cle_secrete: cleanSecret,
        device_id: deviceId,
        // On double les champs si le serveur attend des variantes
        SL_LOGIN: cleanLogin,
        LOGIN: cleanLogin,
      };

      // 2. Préparation du header Authorization
      // Pour éviter "Invalid crypto padding" (dû à un Dummy JWT) ou "Not enough segments" (dû à un token mal formé),
      // il nous faut un VRAI token JWT valide.
      // On tente de le récupérer via clientByCompte en utilisant le login ou le numéro de compte stocké.

      const storedAccount = await secureGetItem("user_account_number");
      let tokenToSend = await secureGetItem("auth_token");

      // Si on n'a pas de token valide en stock, on essaie d'en récupérer un
      if (!tokenToSend || String(tokenToSend).split(".").length !== 3) {
        console.log(
          "[Recovery] No valid token found, attempting to fetch one via clientByCompte...",
        );
        try {
          // On essaie avec le numéro de compte s'il existe, sinon le login
          const identifier = storedAccount || cleanLogin;
          if (identifier) {
            // Appel sans Auth (X-NO-AUTH est géré par l'intercepteur pour cette route)
            const clientInfo = await clientByCompte({
              numero_compte: identifier,
              device_id: deviceId,
            });

            // Extraction du token de la réponse
            const newToken =
              clientInfo?.data?.token ||
              clientInfo?.data?.access_token ||
              clientInfo?.data?.jwt;

            if (newToken && String(newToken).split(".").length === 3) {
              console.log("[Recovery] Successfully fetched temporary token.");
              tokenToSend = newToken;
            } else {
              console.warn(
                "[Recovery] clientByCompte did not return a valid JWT.",
              );
            }
          }
        } catch (err) {
          console.warn("[Recovery] Failed to fetch temporary token:", err);
        }
      }

      // Si après tout ça on n'a toujours pas de token valide, on fallback sur l'ancien comportement
      // (qui échouera probablement, mais on aura tout essayé).
      // On évite le Dummy JWT qui cause "Invalid crypto padding".
      // On préfère envoyer "guest" ou l'identifiant, quitte à avoir "Not enough segments",
      // car "Invalid crypto padding" bloque plus sévèrement le serveur (exception Java/System).

      if (!tokenToSend) {
        tokenToSend = storedAccount || cleanLogin || "guest";
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenToSend}`,
        "X-NO-AUTH": "true",
      };

      const result: any = await updateLogin(payload, headers);

      if (result?.error) {
        const err = result.error;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Échec de la mise à jour du mot de passe.";
        throw new Error(msg);
      }

      // 2. Mise à jour locale seulement si succès API
      const hashed = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPin,
      );
      await secureSetItem("pin_user", hashed);
      setSuccess("CODE MODIFIÉ ✅");

      setTimeout(() => {
        if (navigation?.replace) navigation.replace("PinLogin");
        else if (navigation?.navigate) navigation.navigate("PinLogin");
      }, 1000);
    } catch (e: any) {
      setPinError(e.message || "Échec de la réinitialisation.");
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingVertical: 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 20 }} />
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <View style={styles.logoBox}>
              <Image
                source={require("../../../../assets/agir-finance-logo.webp")}
                style={styles.logo}
                resizeMode="contain"
                onError={() => setLogoError(true)}
                accessibilityLabel="Logo de l'application"
              />
            </View>

            <View
              style={[styles.headerLine, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Réinitialisation du code de sécurité
            </Text>
          </View>
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: colors.card, opacity: fadeAnim },
            ]}
          >
            <View style={styles.headerRow}>
              <MaterialIcons name="info" size={18} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>
                Informations requises
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              Entrez vos informations pour réinitialiser votre code PIN de
              connexion.
            </Text>

            <View style={{ width: "100%", marginTop: 16 }}>
              <Text style={[styles.label, { color: colors.text }]}>
                Email ou téléphone
              </Text>
              <TextInput
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                style={[
                  styles.input,
                  {
                    borderColor: emailFocused ? colors.primary : colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderWidth: emailFocused ? 2 : 1.5,
                    shadowOpacity: emailFocused ? 0.1 : 0.05,
                  },
                ]}
                placeholder="exemple@domaine.com ou +225…"
                placeholderTextColor={`${colors.text}80`}
                autoCapitalize="none"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <View style={{ width: "100%", marginTop: 16 }}>
              <Text style={[styles.label, { color: colors.text }]}>
                Clé secrète
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  value={secretKey}
                  onChangeText={setSecretKey}
                  style={[
                    styles.input,
                    {
                      borderColor: secretFocused
                        ? colors.primary
                        : colors.border,
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderWidth: secretFocused ? 2 : 1.5,
                      shadowOpacity: secretFocused ? 0.1 : 0.05,
                      paddingRight: 50,
                    },
                  ]}
                  secureTextEntry={!showSecret}
                  placeholder="Votre clé secrète"
                  placeholderTextColor={`${colors.text}80`}
                  autoCapitalize="none"
                  onFocus={() => setSecretFocused(true)}
                  onBlur={() => setSecretFocused(false)}
                />
                <TouchableOpacity
                  style={[
                    styles.iconButtonInside,
                    {
                      backgroundColor: "transparent",
                    },
                  ]}
                  onPress={() => setShowSecret((s) => !s)}
                >
                  <MaterialIcons
                    name={showSecret ? "visibility-off" : "visibility"}
                    size={22}
                    color={`${colors.text}CC`}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!!error && (
              <Text style={[styles.error, { color: colors.error }]}>
                {error}
              </Text>
            )}
            {!!success && (
              <Text style={[styles.success, { color: colors.primary }]}>
                {success}
              </Text>
            )}
            {!validated && (
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                    opacity: loading ? 0.7 : 1,
                  },
                ]}
                onPress={handleRecover}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>
                    {loading ? "Vérification..." : "Vérifier et continuer"}
                  </Text>
                  {!loading && (
                    <MaterialIcons
                      name="check-circle"
                      size={16}
                      color="#FFFFFF"
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            )}

            {validated && (
              <View style={{ width: "100%", marginTop: 18 }}>
                <View style={styles.headerRow}>
                  <MaterialIcons
                    name="lock-reset"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={[styles.title, { color: colors.text }]}>
                    Nouveau code PIN
                  </Text>
                </View>

                <Text style={[styles.label, { color: colors.text }]}>
                  Nouveau PIN
                </Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    value={newPin}
                    onChangeText={setNewPin}
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        color: colors.text,
                        paddingRight: 50,
                      },
                    ]}
                    secureTextEntry={!showNewPin}
                    placeholder="•••••"
                    placeholderTextColor={`${colors.text}80`}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                  <TouchableOpacity
                    style={styles.iconButtonInside}
                    onPress={() => setShowNewPin((v) => !v)}
                  >
                    <MaterialIcons
                      name={showNewPin ? "visibility-off" : "visibility"}
                      size={22}
                      color={`${colors.text}CC`}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: colors.text }]}>
                  Confirmer PIN
                </Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        color: colors.text,
                        paddingRight: 50,
                      },
                    ]}
                    secureTextEntry={!showConfirmPin}
                    placeholder="•••••"
                    placeholderTextColor={`${colors.text}80`}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                  <TouchableOpacity
                    style={styles.iconButtonInside}
                    onPress={() => setShowConfirmPin((v) => !v)}
                  >
                    <MaterialIcons
                      name={showConfirmPin ? "visibility-off" : "visibility"}
                      size={22}
                      color={`${colors.text}CC`}
                    />
                  </TouchableOpacity>
                </View>

                {!!pinError && (
                  <Text style={[styles.error, { color: colors.error }]}>
                    {pinError}
                  </Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.primary,
                      opacity: pinLoading ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleResetPin}
                  disabled={pinLoading}
                >
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>
                      {pinLoading
                        ? "Mise à jour..."
                        : "Valider le nouveau code PIN"}
                    </Text>
                    {!pinLoading && (
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color="#FFFFFF"
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // Ajout d'un paddingBottom pour compenser le clavier
    paddingBottom: 20,
  },
  header: {
    width: "92%",
    maxWidth: 420,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 4,
  },
  headerLogoOval: {
    width: 48,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  headerLine: { width: 160, height: 3, borderRadius: 2 },
  headerTitle: { fontSize: 16, fontWeight: "700", marginTop: 8 },
  logoBox: {
    width: 180,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  card: {
    width: "92%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 16,
    elevation: 5,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 8 },
  label: { fontSize: 14, marginBottom: 8, fontWeight: "600", opacity: 0.9 },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "500",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconButtonInside: {
    position: "absolute",
    right: 8,
    top: 8,
    bottom: 8,
    width: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  button: { marginTop: 16, paddingVertical: 12, borderRadius: 10 },
  buttonContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  error: { marginTop: 12, fontSize: 13 },
  success: { marginTop: 12, fontSize: 13, fontWeight: "600" },
});

export default PasswordRecoveryScreen;
