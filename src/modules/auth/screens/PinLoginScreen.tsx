import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Animated,
  useWindowDimensions,
  useColorScheme,
  Platform,
  Vibration,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import { usePreventScreenCapture } from "expo-screen-capture";
import { useAuth } from "../../../app/hooks/useAuth";
import { useNavigation } from "@react-navigation/native";
// AppBar supprimée

const PinLoginScreen: React.FC = () => {
  usePreventScreenCapture();
  const { width } = useWindowDimensions();
  const { loginWithPin, login, isLoading, user } = useAuth() as any;
  const navigation = useNavigation() as any;
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<
    "fingerprint" | "face" | "iris" | "unknown"
  >("unknown");
  const [pinSuccess, setPinSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";
  const shakeAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(0)).current;
  const MAX_LEN = 6;
  // Taille du logo responsive: entre 48 et 72 selon largeur
  const avatarSize = Math.max(48, Math.min(72, width * 0.12));
  const brandLogo = require("../../../../assets/splash-icon.png");
  React.useEffect(() => {
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometryAvailable(!!hasHardware && !!isEnrolled);
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        let type: "fingerprint" | "face" | "iris" | "unknown" = "unknown";
        if (
          types?.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          type = "fingerprint";
        } else if (
          types?.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          type = "face";
        } else if (
          types?.includes(LocalAuthentication.AuthenticationType.IRIS)
        ) {
          type = "iris";
        }
        setBiometryType(type);
      } catch {
        setBiometryAvailable(false);
        setBiometryType("unknown");
      }
    })();
  }, []);
  // Auto-validation du PIN: déclenche la vérification quand la longueur est 4 ou 6
  React.useEffect(() => {
    const length = pin.length;
    // réinitialiser l’état de succès à chaque modification
    setPinSuccess(false);
    const shouldAttempt = length === 4 || length === 6;
    if (!shouldAttempt) {
      setIsVerifying(false);
      return;
    }

    setIsVerifying(true);
    setError(null);
    const timeout = setTimeout(async () => {
      try {
        const hashed = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          pin
        );
        await loginWithPin(hashed);
        setPinSuccess(true);
        Vibration.vibrate(30);
        // court délai pour que l’utilisateur voie le message
        setTimeout(() => {
          if ((navigation as any)?.replace) {
            (navigation as any).replace("Main");
          } else if ((navigation as any)?.navigate) {
            (navigation as any).navigate("Main");
          }
        }, 450);
      } catch (e: any) {
        setError(e?.message || "Échec de connexion par PIN.");
        setPinSuccess(false);
        Vibration.vibrate(60);
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 6,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -6,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
      } finally {
        setIsVerifying(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [pin]);
  const handleDigit = (d: string) => {
    setPin((prev) => {
      const next = prev.length < MAX_LEN ? prev + d : prev;
      pulseAnim.setValue(0);
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start();
      return next;
    });
  };
  const handleBackspace = () => setPin((prev) => prev.slice(0, -1));
  const handleClear = () => setPin("");

  const handleLogin = async () => {
    setError(null);
    if (!pin || pin.length < 4) {
      setError("PIN invalide (min 4 chiffres).");
      Vibration.vibrate(40);
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }
    try {
      const hashed = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
      );
      await loginWithPin(hashed);
      // Redirection directe vers l'accueil après succès
      if ((navigation as any)?.replace) {
        (navigation as any).replace("Main");
      } else if ((navigation as any)?.navigate) {
        (navigation as any).navigate("Main");
      }
    } catch (e: any) {
      setError(e?.message || "Échec de connexion par PIN.");
      Vibration.vibrate(60);
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleBiometricLogin = async () => {
    setError(null);
    try {
      const promptLabel =
        biometryType === "face"
          ? "Se connecter avec Face ID"
          : biometryType === "iris"
          ? "Se connecter avec Iris"
          : "Se connecter avec empreinte digitale";
      const options: LocalAuthentication.LocalAuthenticationOptions = {
        promptMessage: promptLabel,
        cancelLabel: "Annuler",
        ...(Platform.OS === "ios" ? { disableDeviceFallback: false } : {}),
        ...(Platform.OS === "android" ? { requireConfirmation: false } : {}),
      };
      const result = await LocalAuthentication.authenticateAsync(options);
      if (result.success) {
        await login({ username: "biometric", password: "biometric" });
        if ((navigation as any)?.replace) {
          (navigation as any).replace("Main");
        } else if ((navigation as any)?.navigate) {
          (navigation as any).navigate("Main");
        }
      } else {
        setError(
          "Empreinte non reconnue, veuillez réessayer ou entrer votre code PIN."
        );
        Vibration.vibrate(80);
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 6,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -6,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (e) {
      setError(
        "Empreinte non reconnue, veuillez réessayer ou entrer votre code PIN."
      );
      Vibration.vibrate(80);
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode && { backgroundColor: "#0B1220" }]}
    >
      <View style={styles.backgroundDecor} pointerEvents="none">
        <View style={[styles.ring, { top: 120, left: -20 }]} />
        <View
          style={[
            styles.ring,
            { top: 80, right: -60, width: 360, height: 360, borderRadius: 180 },
          ]}
        />
        <View
          style={[
            styles.ring,
            { bottom: 40, left: 0, width: 520, height: 520, borderRadius: 260 },
          ]}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.stack}>
          <View
            style={[
              styles.topCard,
              isDarkMode && { backgroundColor: "#0F172A" },
            ]}
          >
            <Image
              source={brandLogo}
              style={[
                styles.logo,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: Platform.OS === "ios" ? 12 : 10,
                },
              ]}
              resizeMode="contain"
            />
            <Text style={styles.welcomeText}>
              {`Ravi de vous revoir${user?.name ? `, ${user.name}` : ""}`}
            </Text>
            <Text
              style={[styles.subWelcome, isDarkMode && { color: "#94A3B8" }]}
            >
              Entrez votre code PIN pour continuer
            </Text>
          </View>
          <View
            style={[styles.card, isDarkMode && { backgroundColor: "#111827" }]}
          >
            <Text style={[styles.label, isDarkMode && { color: "#E5E7EB" }]}>
              Code PIN
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Animated.View
                style={[
                  styles.pinIndicator,
                  { transform: [{ translateX: shakeAnim }] },
                ]}
              >
                {Array.from({ length: MAX_LEN }).map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.pinDot,
                      i === pin.length - 1 && pin.length > 0
                        ? {
                            transform: [
                              {
                                scale: pulseAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.88, 1],
                                }),
                              },
                            ],
                          }
                        : undefined,
                    ]}
                  >
                    {showPin && i < pin.length ? (
                      <Text
                        style={[
                          styles.pinDigit,
                          isDarkMode && { color: "#E5E7EB" },
                        ]}
                      >
                        {pin[i]}
                      </Text>
                    ) : i < pin.length ? (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: isDarkMode ? "#E5E7EB" : "#0F172A",
                        }}
                      />
                    ) : null}
                  </Animated.View>
                ))}
              </Animated.View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                  showPin ? "Masquer le PIN" : "Afficher le PIN"
                }
                onPress={() => setShowPin((s) => !s)}
                style={styles.iconButton}
              >
                <Ionicons
                  name={showPin ? "eye-off" : "eye"}
                  size={22}
                  color={isDarkMode ? "#E5E7EB" : "#334155"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.keypad}>
              {["123", "456", "789"].map((row, idx) => (
                <View style={styles.keyRow} key={idx}>
                  {row.split("").map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.keyButton,
                        isDarkMode && {
                          backgroundColor: "#0F172A",
                          borderColor: "#334155",
                        },
                      ]}
                      onPress={() => handleDigit(d)}
                    >
                      <Text
                        style={[
                          styles.keyText,
                          isDarkMode && { color: "#E5E7EB" },
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={styles.keyRow}>
                <TouchableOpacity
                  style={[styles.keyButton, styles.secondaryKey]}
                  onPress={handleClear}
                >
                  <Text style={styles.keyText}>C</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyButton}
                  onPress={() => handleDigit("0")}
                >
                  <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.keyButton, styles.secondaryKey]}
                  onPress={handleBackspace}
                >
                  <Ionicons
                    name="backspace-outline"
                    size={20}
                    color="#0F172A"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Se connecter avec empreinte digitale"
              style={[
                styles.button,
                { opacity: biometryAvailable ? 1 : 0.6 },
                isDarkMode
                  ? { backgroundColor: "#1F2937" }
                  : { backgroundColor: "#334155" },
                Platform.OS === "ios"
                  ? { paddingVertical: 14, borderRadius: 10 }
                  : { paddingVertical: 12, borderRadius: 8 },
              ]}
              onPress={handleBiometricLogin}
              disabled={isLoading || !biometryAvailable}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {biometryType === "face" ? (
                  <MaterialIcons
                    name="face"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                ) : biometryType === "iris" ? (
                  <Ionicons
                    name="eye-outline"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                ) : (
                  <Ionicons
                    name="finger-print-outline"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={styles.buttonText}>
                  {biometryAvailable
                    ? biometryType === "face"
                      ? "Se connecter avec Face ID"
                      : biometryType === "iris"
                      ? "Se connecter avec Iris"
                      : "Se connecter avec empreinte digitale"
                    : Platform.OS === "web"
                    ? "Biométrie indisponible sur Web"
                    : "Biométrie indisponible (aucune empreinte enregistrée)"}
                </Text>
              </View>
            </TouchableOpacity>

            {!biometryAvailable && (
              <Text style={styles.hint}>
                {Platform.OS === "web"
                  ? "Ouvrez l’application sur Android/iOS via Expo Go pour utiliser l’empreinte."
                  : "Activez l’empreinte dans les réglages de votre appareil pour l’utiliser."}
              </Text>
            )}

            {!!error && <Text style={styles.error}>{error}</Text>}
            {pinSuccess && <Text style={styles.success}>Code PIN correct</Text>}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F1F5F9" },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  stack: { width: "100%", maxWidth: 420, alignItems: "center" },
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
    marginBottom: -24,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  welcomeText: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  subWelcome: { fontSize: 12, color: "#64748B", marginTop: 4 },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    paddingTop: 28,
  },
  label: { fontSize: 12, fontWeight: "600", color: "#334155", marginBottom: 6 },
  pinRow: { flexDirection: "row", alignItems: "center" },
  pinIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
    marginRight: 8,
  },
  pinDot: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  pinDigit: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  keypad: { marginTop: 8 },
  keyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  keyButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  secondaryKey: { backgroundColor: "#F8FAFC" },
  keyText: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  iconButton: {
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#F1F5F9",
  },
  button: {
    backgroundColor: "#0066CC",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
  error: { color: "#DC2626", marginTop: 8 },
  hint: { color: "#64748B", marginTop: 4, fontSize: 12 },
  success: { color: "#16A34A", marginTop: 8, fontWeight: "700" },
});

export default PinLoginScreen;
