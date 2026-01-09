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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";
import { Ionicons } from "@expo/vector-icons";
import { updateLogin } from "../../../services/auth/updateLogin";
import * as Crypto from "expo-crypto";
import { secureSetItem } from "../../../shared/utils/secureStorage";

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
      // 1. Hash the new PIN locally for storage (if successful)
      const hashedPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPin
      );

      // 2. Prepare payload for updateLogin
      // Note: "nouveau_login" is the username/phone we want to update (or keep same)
      // "nouveau_motpasse" is the new PIN (in clear text usually for this API, based on InitialSetupScreen)
      const payload = {
        nouveau_login: login,
        nouveau_motpasse: newPin,
        cle_secrete: secretKey,
        code_cryptage: "Y}@128eVIXfoi7", // Same static key used in InitialSetupScreen
      };

      // 3. Call the API
      // We might need X-NO-AUTH header since we are likely not logged in
      const headers = {
        "X-NO-AUTH": "true",
        "Content-Type": "application/json"
      };

      const result = await updateLogin(payload, headers);

      if ((result as any).error) {
        const err = (result as any).error;
        const msg = err?.response?.data?.message || err?.message || "Échec de la réinitialisation";
        throw new Error(msg);
      }

      // 4. Success handling
      Alert.alert(
        "Succès",
        "Votre code PIN a été mis à jour avec succès.",
        [
          {
            text: "OK",
            onPress: () => {
              // Optionally update local storage if we want to pre-fill login
              secureSetItem("user_login", login);
              // secureSetItem("pin_user", hashedPin); // Better to let them login to sync
              navigation.goBack();
            },
          },
        ]
      );

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Récupération
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
            Entrez vos informations pour réinitialiser votre PIN.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* LOGIN / PHONE */}
          <Text style={[styles.label, { color: colors.text }]}>
            Email ou Téléphone (Login)
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
              { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 },
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
    marginTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
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
  },
});