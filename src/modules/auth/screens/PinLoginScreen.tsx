import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  useWindowDimensions,
  useColorScheme,
  Platform,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import { useAuth } from "../../../app/hooks/useAuth";
import { useNavigation } from "@react-navigation/native";

const PinLoginScreen: React.FC = () => {
  React.useEffect(() => {
    const run = async () => {
      if (Platform.OS !== "web") {
        try {
          await ScreenCapture.preventScreenCaptureAsync();
        } catch {}
      }
    };
    run();
    return () => {
      if (Platform.OS !== "web") {
        try {
          ScreenCapture.allowScreenCaptureAsync();
        } catch {}
      }
    };
  }, []);
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
  const MAX_LEN = 5;

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

  React.useEffect(() => {
    const length = pin.length;
    setPinSuccess(false);
    const shouldAttempt = length === 5;
    if (!shouldAttempt) {
      setIsVerifying(false);
      return;
    }

    setIsVerifying(true);
    setError(null);
    const timeout = setTimeout(async () => {
      try {
        await loginWithPin(pin);
        setPinSuccess(true);
        Vibration.vibrate(30);
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
      }
    } catch (e) {
      setError("Empreinte non reconnue, veuillez réessayer.");
    }
  };

  return (
    <SafeAreaView
      style={[pinStyles.container, isDarkMode && pinStyles.containerDark]}
    >
      <View style={pinStyles.card}>
        <Text style={pinStyles.title}>Code de sécurité</Text>
        <Text style={pinStyles.subtitle}>
          Veuillez entrer votre code de sécurité
        </Text>

        <View style={pinStyles.pinContainer}>
          <Animated.View
            style={[
              pinStyles.pinIndicator,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {Array.from({ length: MAX_LEN }).map((_, i) => (
              <View
                key={i}
                style={[
                  pinStyles.pinDot,
                  i < pin.length && pinStyles.pinDotFilled,
                ]}
              />
            ))}
          </Animated.View>
        </View>

        <TouchableOpacity
          style={pinStyles.forgotLink}
          onPress={() => (navigation as any).navigate("PasswordRecovery")}
        >
          <Text style={pinStyles.forgotText}>J'ai oublié mon code</Text>
        </TouchableOpacity>

        <View style={pinStyles.keypad}>
          <View style={pinStyles.keyRow}>
            <TouchableOpacity
              style={pinStyles.keyButton}
              onPress={() => handleDigit("7")}
            >
              <Text style={pinStyles.keyText}>7</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pinStyles.keyButton}
              onPress={() => handleDigit("6")}
            >
              <Text style={pinStyles.keyText}>6</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pinStyles.keyButton}
              onPress={() => handleDigit("8")}
            >
              <Text style={pinStyles.keyText}>8</Text>
            </TouchableOpacity>
          </View>

          <View style={pinStyles.keyRow}>
            <TouchableOpacity
              style={pinStyles.keyButton}
              onPress={() => handleDigit("5")}
            >
              <Text style={pinStyles.keyText}>5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pinStyles.keyButton}
              onPress={() => handleDigit("9")}
            >
              <Text style={pinStyles.keyText}>9</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pinStyles.keyButton}
              onPress={() => handleDigit("3")}
            >
              <Text style={pinStyles.keyText}>3</Text>
            </TouchableOpacity>
          </View>

          <View style={pinStyles.keyRow}>
            <TouchableOpacity
              style={pinStyles.keyButton}
              onPress={() => handleDigit("0")}
            >
              <Text style={pinStyles.keyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pinStyles.keyButton}
              onPress={() => handleDigit("1")}
            >
              <Text style={pinStyles.keyText}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pinStyles.keyButton}
              onPress={() => handleDigit("2")}
            >
              <Text style={pinStyles.keyText}>2</Text>
            </TouchableOpacity>
          </View>

          <View style={pinStyles.keyRow}>
            <TouchableOpacity
              style={[pinStyles.keyButton, pinStyles.biometricButton]}
              onPress={handleBiometricLogin}
            >
              <Ionicons name="finger-print" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={pinStyles.keyButton}
              onPress={() => handleDigit("4")}
            >
              <Text style={pinStyles.keyText}>4</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pinStyles.keyButton, pinStyles.deleteButton]}
              onPress={handleBackspace}
            >
              <Ionicons name="backspace-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {!!error && <Text style={pinStyles.error}>{error}</Text>}
        {pinSuccess && <Text style={pinStyles.success}>Code PIN correct</Text>}
      </View>
    </SafeAreaView>
  );
};

const pinStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  containerDark: {
    backgroundColor: "#0B1220",
  },
  card: {
    width: "90%",
    maxWidth: 350,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 16,
    elevation: 5,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 32,
  },
  pinContainer: {
    marginBottom: 16,
  },
  pinIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    backgroundColor: "transparent",
    marginHorizontal: 8,
  },
  pinDotFilled: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  forgotLink: {
    marginBottom: 32,
  },
  forgotText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  keypad: {
    width: "100%",
  },
  keyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  keyButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  keyText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  biometricButton: {
    borderColor: "#007AFF",
  },
  deleteButton: {
    borderColor: "#FF3B30",
  },
  error: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
  success: {
    color: "#34C759",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
});

export default PinLoginScreen;
