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
      if (!storedLogin && !storedUser) {
        setError("Compte inexistant.");
        return;
      }
      const storedSecret = await secureGetItem("user_secret_key");
      if (!storedSecret || storedSecret !== secretKey) {
        setError("Clé secrète invalide. Réinitialisation impossible.");
        return;
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
      const hashed = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPin
      );
      await secureSetItem("pin_user", hashed);
      setSuccess("Code PIN réinitialisé avec succès.");
      if (navigation?.replace) navigation.replace("PinLogin");
      else if (navigation?.navigate) navigation.navigate("PinLogin");
    } catch (e) {
      setPinError("Échec de la réinitialisation.");
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.logoBox}>
          <Image
            source={require("../../../../assets/cedaici-transparent.png")}
            style={styles.logo}
            resizeMode="contain"
            onError={() => setLogoError(true)}
            accessibilityLabel="Logo de l'application"
          />
        </View>

        <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Récupération de mot de passe
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
          Entrez vos informations pour réinitialiser votre mot de passe.
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
                  borderColor: secretFocused ? colors.primary : colors.border,
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
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        )}
        {!!success && (
          <Text style={[styles.success, { color: colors.primary }]}>
            {success}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 },
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
                    ? "Réinitialisation..."
                    : "Réinitialiser le code PIN"}
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
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
