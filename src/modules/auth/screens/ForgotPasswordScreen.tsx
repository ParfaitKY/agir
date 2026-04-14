import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";
import { Ionicons } from "@expo/vector-icons";
import { updateLogin } from "../../../services/auth/updateLogin";
import { clientByCompte } from "../../../services/auth/clientByCompte";
import * as Crypto from "expo-crypto";
import {
  secureSetItem,
  secureGetItem,
} from "../../../shared/utils/secureStorage";

export const ForgotPasswordScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const navigation = useNavigation();

  const [login, setLogin] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [showSecret, setShowSecret] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setError(null);

    if (!login || !secretKey || !newPin || !confirmPin) {
      setError("Tous les champs sont requis");
      return;
    }

    if (newPin.length < 5) {
      setError("Le code PIN doit contenir au moins 5 chiffres");
      return;
    }

    if (newPin !== confirmPin) {
      setError("Les codes PIN ne correspondent pas");
      return;
    }

    setIsLoading(true);
    try {
      const deviceId = (await secureGetItem("device_id")) || "unknown_device";
      const storedAccount = await secureGetItem("user_account_number");
      let tokenToSend = await secureGetItem("auth_token");

      // 1. Si on n'a pas de token valide, on tente d'en récupérer un temporaire
      if (!tokenToSend || String(tokenToSend).split(".").length !== 3) {
        try {
          const identifier = storedAccount || login;
          if (identifier) {
            const clientInfo = await clientByCompte({
              numero_compte: identifier,
              device_id: deviceId,
            });
            const newToken =
              clientInfo?.data?.token ||
              clientInfo?.data?.access_token ||
              clientInfo?.data?.jwt;
            if (newToken && String(newToken).split(".").length === 3) {
              tokenToSend = newToken;
            }
          }
        } catch (err) {
          console.warn("[Forgot] Failed to fetch temporary token:", err);
        }
      }

      if (!tokenToSend) {
        tokenToSend = storedAccount || login || "guest";
      }

      // 2. Prepare payload for updateLogin
      const payload = {
        nouveau_login: login.trim(),
        nouveau_motpasse: newPin.trim(),
        cle_secrete: secretKey.trim(),
        device_id: deviceId, // REQUIS PAR LE SERVEUR
      };

      // 3. Call the API
      const headers = {
        "X-NO-AUTH": "true",
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenToSend}`,
      };

      const result = await updateLogin(payload, headers);

      if ((result as any).error) {
        const err = (result as any).error;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Échec de la réinitialisation";
        throw new Error(msg);
      }

      // 4. Success handling
      const hashedPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPin,
      );
      Alert.alert("Succès", "Votre code PIN a été mis à jour avec succès.", [
        {
          text: "OK",
          onPress: () => {
            // Optionally update local storage if we want to pre-fill login
            secureSetItem("user_login", login);
            // secureSetItem("pin_user", hashedPin); // Better to let them login to sync
            navigation.goBack();
          },
        },
      ]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Code de sécurité oublié
            </Text>
            <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
              Réinitialisez votre code PIN de connexion.
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* LOGIN / PHONE */}
            <Text style={[styles.label, { color: colors.text }]}>
              Email ou Téléphone
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Ex: 0707..."
              placeholderTextColor={colors.text + "60"}
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
            />

            {/* SECRET KEY */}
            <Text style={[styles.label, { color: colors.text }]}>
              Clé secrète
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                    marginBottom: 0,
                  },
                ]}
                placeholder="Votre clé secrète"
                placeholderTextColor={colors.text + "60"}
                value={secretKey}
                onChangeText={setSecretKey}
                secureTextEntry={!showSecret}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowSecret(!showSecret)}
              >
                <Ionicons
                  name={showSecret ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.text + "80"}
                />
              </TouchableOpacity>
            </View>

            {/* NEW PIN */}
            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
              Nouveau PIN (5 chiffres)
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                    marginBottom: 0,
                  },
                ]}
                placeholder="•••••"
                placeholderTextColor={colors.text + "60"}
                value={newPin}
                onChangeText={setNewPin}
                keyboardType="number-pad"
                maxLength={5}
                secureTextEntry={!showPin}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPin(!showPin)}
              >
                <Ionicons
                  name={showPin ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.text + "80"}
                />
              </TouchableOpacity>
            </View>

            {/* CONFIRM PIN */}
            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
              Confirmer le PIN
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                    marginBottom: 0,
                  },
                ]}
                placeholder="•••••"
                placeholderTextColor={colors.text + "60"}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="number-pad"
                maxLength={5}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirm(!showConfirm)}
              >
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.text + "80"}
                />
              </TouchableOpacity>
            </View>

            {/* ERROR MESSAGE */}
            {!!error && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            )}

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleReset}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Modifier le PIN</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginLeft: -8,
    marginBottom: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    marginBottom: 10,
  },
});
