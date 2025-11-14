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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { secureSetItem } from "../../../shared/utils/secureStorage";
import { usePreventScreenCapture } from "expo-screen-capture";
import { useAuth } from "../../../app/hooks/useAuth";

const InitialSetupScreen: React.FC = () => {
  usePreventScreenCapture();
  const { width, height } = useWindowDimensions();
  const { user, markConfigured, login } = useAuth() as any;
  const navigation = useNavigation() as any;
  const [step, setStep] = useState<1 | 2>(1);
  const [uuid, setUuid] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const [loginReadonly, setLoginReadonly] = useState("");
  const [defaultPin, setDefaultPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showDefaultPin, setShowDefaultPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [savingPin, setSavingPin] = useState(false);
  // Scanner QR retiré pour corriger les erreurs de build sur web
  // Gestion d’un logo distant avec fallback
  const [logoError, setLogoError] = useState(false);

  const uuidRef = useRef<TextInput>(null);
  const newPinRef = useRef<TextInput>(null);

  // Paramètres responsives UI
  const avatarSize = Math.max(48, Math.min(72, width * 0.12));
  const logoBoxHeight = Math.min(Math.max(72, width * 0.12), 120);
  const logoBoxWidth = Math.min(Math.max(140, width * 0.35), 260);
  const headingFontSize =
    width >= 1024 ? 22 : width >= 768 ? 20 : width >= 420 ? 18 : 16;
  const subtitleFontSize = width >= 1024 ? 13 : 12;

  // Thème (dark / light)
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const palette = {
    bg: isDark ? "#0B1220" : "#F1F5F9",
    card: isDark ? "#111827" : "#FFFFFF",
    textMain: isDark ? "#E5E7EB" : "#0F172A",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#374151" : "#E5E7EB",
    primary: "#0066CC",
  };

  // Animation de transition
  const fadeAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [step]);

  useEffect(() => {
    if (step === 1) {
      uuidRef.current?.focus();
    } else {
      newPinRef.current?.focus();
    }
  }, [step]);
  // closeScanner retiré avec le scanner QR

  // Fonctions du scanner supprimées

  // Écriture sécurisée avec fallback Web
  const securePut = async (key: string, value: string) => {
    try {
      const available = await SecureStore.isAvailableAsync();
      if (available) {
        await SecureStore.setItemAsync(key, value);
      } else if (Platform.OS === "web") {
        // Fallback Web: localStorage
        try {
          // @ts-ignore
          window?.localStorage?.setItem(key, value);
        } catch {}
      } else {
        // Essayer quand même sur plateformes natives
        await SecureStore.setItemAsync(key, value);
      }
    } catch (err) {
      if (Platform.OS === "web") {
        try {
          // @ts-ignore
          window?.localStorage?.setItem(key, value);
          return;
        } catch {}
      }
      throw err;
    }
  };

  const handleVerifyUuid = async () => {
    setVerifyError(null);
    if (!uuid || uuid.length < 6) {
      setVerifyError("UUID invalide. Vérifiez et réessayez.");
      return;
    }
    try {
      setLoadingVerify(true);
      // Simulation de vérification serveur
      await new Promise((res) => setTimeout(res, 800));
      const fetchedUser = {
        id: uuid,
        login: `user_${uuid.substring(0, 6)}`,
        name: "Client",
        agency: "Agence Principale",
      };
      // Affiche message de succès puis transition
      setVerifySuccess(true);
      setLoginReadonly(fetchedUser.login);
      setTimeout(() => {
        setStep(2);
        setVerifySuccess(false);
      }, 600);
      // Stockage en arrière-plan (ne bloque pas la navigation entre sections)
      SecureStore.setItemAsync("user_data", JSON.stringify(fetchedUser)).catch(
        () => {
          // En cas d'échec de stockage, on laisse quand même l'utilisateur poursuivre
        }
      );
    } catch (e) {
      setVerifyError("Erreur lors de la vérification. Réessayez.");
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleGuestMode = async () => {
    try {
      await login({ username: "invite", password: "invite" });
      if (markConfigured) await markConfigured(true);
      // Rediriger directement vers l'accueil (Dashboard) dans les onglets principaux
      if (navigation?.navigate) {
        (navigation as any).navigate("Main", { screen: "Dashboard" });
      } else if (navigation?.replace) {
        (navigation as any).replace("Main");
      }
    } catch (e) {
      setVerifyError("Impossible d’activer le mode invité.");
    }
  };

  const handleSavePin = async () => {
    setPinError(null);
    // Validations de base
    const minLen = 4;
    if (!defaultPin || !newPin || !confirmPin) {
      setPinError("Tous les champs PIN sont requis.");
      return;
    }
    if (newPin.length < minLen) {
      setPinError(`Le nouveau PIN doit contenir au moins ${minLen} chiffres.`);
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("Le nouveau PIN et sa confirmation ne correspondent pas.");
      return;
    }
    try {
      setSavingPin(true);
      // Hachage et stockage sécurisé du PIN utilisateur
      const hashedUserPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPin
      );
      await secureSetItem("pin_user", hashedUserPin);
      // Stocker le PIN par défaut tel quel (support/debug)
      await secureSetItem("pin_default", defaultPin);
      await secureSetItem("is_configured", "true");
      // Marquer l’app comme configurée et rediriger via provider
      if (markConfigured) await markConfigured(true);
      // Redirection immédiate vers l'écran de connexion par PIN
      if (navigation?.replace) {
        navigation.replace("PinLogin");
      } else if (navigation?.navigate) {
        navigation.navigate("PinLogin");
      }
    } catch (e) {
      setPinError("Échec de l’enregistrement du PIN. Réessayez.");
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      <View style={styles.backgroundDecor} pointerEvents="none">
        <View
          style={[
            styles.ring,
            {
              top: 120,
              left: -20,
              width: Math.min(width * 0.45, 280),
              height: Math.min(width * 0.45, 280),
              borderRadius: Math.min(width * 0.45, 280) / 2,
            },
          ]}
        />
        <View
          style={[
            styles.ring,
            {
              top: 80,
              right: -60,
              width: Math.min(width * 0.55, 360),
              height: Math.min(width * 0.55, 360),
              borderRadius: Math.min(width * 0.55, 360) / 2,
            },
          ]}
        />
        <View
          style={[
            styles.ring,
            {
              bottom: 40,
              left: 0,
              width: Math.min(width * 0.8, 520),
              height: Math.min(width * 0.8, 520),
              borderRadius: Math.min(width * 0.8, 520) / 2,
            },
          ]}
        />
      </View>
      <View style={styles.content}>
        <View
          style={[
            styles.stack,
            {
              maxWidth:
                width >= 1024
                  ? 640
                  : width >= 768
                  ? 560
                  : width >= 420
                  ? 420
                  : 340,
            },
          ]}
        >
          <View style={[styles.topCard, { backgroundColor: palette.card }]}>
            <View
              style={[
                styles.logoBox,
                { width: logoBoxWidth, height: logoBoxHeight },
              ]}
            >
              <Image
                source={
                  logoError
                    ? require("../../../../assets/icon.png")
                    : { uri: "https://lapeyrie-emf.ga/logo.png" }
                }
                style={styles.logo}
                resizeMode="contain"
                onError={() => setLogoError(true)}
                accessibilityLabel="Logo de l’application"
              />
            </View>
            <Text
              style={[
                styles.welcomeText,
                { fontSize: headingFontSize, color: palette.textMain },
              ]}
            >
              {step === 1
                ? "Bienvenue ! Vérifions votre identité"
                : `Configuration du PIN${user?.name ? `, ${user.name}` : ""}`}
            </Text>
            <View style={styles.stepPill}>
              <Text style={styles.stepPillText}>
                {step === 1 ? "Étape 1/2" : "Étape 2/2"}
              </Text>
            </View>
            <Text
              style={[
                styles.topSubtitle,
                { fontSize: subtitleFontSize, color: palette.textSub },
              ]}
            >
              Configuration initiale de votre appareil
            </Text>
          </View>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              {step === 1 && (
                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons
                      name="verified-user"
                      size={18}
                      color={palette.textMain}
                    />
                    <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
                      Vérification de l'identité
                    </Text>
                  </View>
                  <Text style={styles.label}>UUID (identifiant unique)</Text>
                  <TextInput
                    placeholder="Saisir votre UUID"
                    value={uuid}
                    onChangeText={setUuid}
                    style={styles.input}
                    autoCapitalize="none"
                    autoFocus
                    ref={uuidRef}
                  />
                  <Text style={[styles.hint, { color: palette.textSub }]}>
                    Entrez votre identifiant unique reçu par mail ou SMS.
                  </Text>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        {
                          flex: 1,
                          backgroundColor: isDark ? "#111827" : "#F1F5F9",
                          borderColor: palette.border,
                        },
                      ]}
                      onPress={() =>
                        setVerifyError(
                          "Scan QR indisponible sur ce périphérique. Saisissez l’UUID manuellement."
                        )
                      }
                    >
                      <MaterialIcons
                        name="qr-code-scanner"
                        size={18}
                        color={palette.textMain}
                      />
                      <Text
                        style={[
                          styles.secondaryButtonText,
                          { color: palette.textMain },
                        ]}
                      >
                        Scanner QR
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        {
                          flex: 1,
                          marginLeft: 8,
                          opacity: uuid.length >= 6 ? 1 : 0.6,
                        },
                      ]}
                      onPress={handleVerifyUuid}
                      disabled={loadingVerify || uuid.length < 6}
                    >
                      <View style={styles.buttonContent}>
                        <Text style={styles.buttonText}>
                          {loadingVerify ? "Vérification..." : "Vérifier"}
                        </Text>
                        {loadingVerify ? (
                          <ActivityIndicator
                            size="small"
                            color="#FFFFFF"
                            style={{ marginLeft: 8 }}
                          />
                        ) : (
                          <MaterialIcons
                            name="arrow-forward"
                            size={18}
                            color="#FFFFFF"
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                  {!!verifyError && (
                    <Text style={styles.error}>{verifyError}</Text>
                  )}
                  {!!verifySuccess && (
                    <Text style={styles.successHint}>
                      Identifiant vérifié avec succès 🎉
                    </Text>
                  )}
                  <Text style={styles.hint}>
                    Astuce: entrez l’UUID tel qu’indiqué sur votre carte client.
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      {
                        marginTop: 8,
                        backgroundColor: isDark ? "#111827" : "#F1F5F9",
                        borderColor: palette.border,
                      },
                    ]}
                    onPress={handleGuestMode}
                  >
                    <MaterialIcons
                      name="person-outline"
                      size={18}
                      color={palette.textMain}
                    />
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: palette.textMain },
                      ]}
                    >
                      Continuer en mode invité
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === 2 && (
                <View style={[styles.card, { backgroundColor: palette.card }]}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons
                      name="vpn-key"
                      size={18}
                      color={palette.textMain}
                    />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { marginLeft: 8, color: palette.textMain },
                      ]}
                    >
                      Configuration du code PIN
                    </Text>
                  </View>
                  <Text style={styles.label}>Login (lecture seule)</Text>
                  <TextInput
                    value={loginReadonly}
                    editable={false}
                    style={[styles.input, styles.readonly]}
                  />
                  <Text style={styles.label}>PIN par défaut</Text>
                  <View style={styles.pinRow}>
                    <TextInput
                      value={defaultPin}
                      onChangeText={setDefaultPin}
                      style={[styles.input, { flex: 1 }]}
                      secureTextEntry={!showDefaultPin}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => setShowDefaultPin((s) => !s)}
                    >
                      <MaterialIcons
                        name={showDefaultPin ? "visibility-off" : "visibility"}
                        size={20}
                        color={palette.textMain}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.label}>Nouveau PIN</Text>
                  <View style={styles.pinRow}>
                    <TextInput
                      value={newPin}
                      onChangeText={setNewPin}
                      style={[styles.input, { flex: 1 }]}
                      secureTextEntry={!showNewPin}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus={step === 2}
                      ref={newPinRef}
                    />
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => setShowNewPin((s) => !s)}
                    >
                      <MaterialIcons
                        name={showNewPin ? "visibility-off" : "visibility"}
                        size={20}
                        color={palette.textMain}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.label}>Confirmation du nouveau PIN</Text>
                  <View style={styles.pinRow}>
                    <TextInput
                      value={confirmPin}
                      onChangeText={setConfirmPin}
                      style={[styles.input, { flex: 1 }]}
                      secureTextEntry={!showConfirmPin}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => setShowConfirmPin((s) => !s)}
                    >
                      <MaterialIcons
                        name={showConfirmPin ? "visibility-off" : "visibility"}
                        size={20}
                        color={palette.textMain}
                      />
                    </TouchableOpacity>
                  </View>
                  {!!pinError && <Text style={styles.error}>{pinError}</Text>}
                  <TouchableOpacity
                    style={[
                      styles.button,
                      {
                        opacity:
                          newPin.length >= 4 && newPin === confirmPin ? 1 : 0.6,
                      },
                    ]}
                    onPress={handleSavePin}
                    disabled={
                      savingPin || newPin.length < 4 || newPin !== confirmPin
                    }
                  >
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>
                        {savingPin ? "Enregistrement..." : "Enregistrer"}
                      </Text>
                      {!savingPin && (
                        <MaterialIcons
                          name="check-circle"
                          size={18}
                          color="#FFFFFF"
                          style={{ marginLeft: 6 }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.successHint}>
                    Après succès, vous serez redirigé vers la connexion par PIN.
                  </Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </View>
      </View>
      {/* Overlay scanner QR retiré */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F1F5F9" },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  stack: { width: "100%" },
  backgroundDecor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ring: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: "#94A3B8",
    opacity: 0.12,
  },
  topCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 2,
    marginBottom: 16,
  },
  stepPill: {
    marginTop: 8,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stepPillText: { fontSize: 12, fontWeight: "700", color: "#0F172A" },
  topSubtitle: { fontSize: 12, color: "#64748B", marginTop: 6 },
  // Conteneur du logo pour un rendu propre et centré
  logoBox: {
    width: 160,
    height: 96,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: { width: "100%", height: "100%" },
  // Ancien avatar (non utilisé)
  avatar: { width: 56, height: 56, borderRadius: 28, marginBottom: 8 },
  welcomeText: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  subtitle: { fontSize: 12, color: "#64748B" },
  scrollContent: { paddingBottom: 24, flexGrow: 1, justifyContent: "center" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1F2937",
  },
  actionsRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  readonly: { color: "#6B7280" },
  label: { fontSize: 12, fontWeight: "500", color: "#6B7280", marginBottom: 4 },
  pinRow: { flexDirection: "row", alignItems: "center" },
  button: {
    backgroundColor: "#0066CC",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryButtonText: { marginLeft: 6, color: "#0F172A", fontWeight: "600" },
  iconButton: {
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#F1F5F9",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
  error: { color: "#DC2626", marginBottom: 8 },
  hint: { fontSize: 12, color: "#6B7280", marginTop: 8 },
  successHint: { fontSize: 12, color: "#10B981", marginTop: 8 },
  // Styles du scanner retirés
});

export default InitialSetupScreen;
