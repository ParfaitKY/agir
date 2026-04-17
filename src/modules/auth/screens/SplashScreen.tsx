import React, { useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  Animated,
  Image,
  Easing,
  Text,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../../app/hooks/useAuth";
import { usePrivacy } from "../../../app/providers/PrivacyProvider";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";

const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated, isConfigured, user, isLoading } = useAuth() as any;
  const { privacyAccepted, privacyChecked, markPrivacyAccepted } = usePrivacy();
  const { language } = useI18n();
  const { colors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  // Animation du spinner (cercle de chargement)
  const spinAnim = useRef(new Animated.Value(0)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(100)).current;

  // Animation de flottement séparée pour éviter les conflits
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const bgGlowAnim = useRef(new Animated.Value(0)).current;

  // Animations pour la section privacy
  const privacyOpacity = useRef(new Animated.Value(0)).current;
  const privacyTranslateY = useRef(new Animated.Value(50)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const textRevealAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Animation du texte avec un léger délai
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 1200,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      // Démarrer le flottement seulement après l'entrée
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnim, {
            toValue: -15,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });

    // Animation du halo de fond
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgGlowAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bgGlowAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Démarrer la rotation infinie du cercle de chargement
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []); // Only on mount

  useEffect(() => {
    if (privacyChecked && !privacyAccepted) {
      console.log("[splash] showing privacy overlay with wow animations");

      // Animation d'entrée séquentielle "Waouh"
      Animated.sequence([
        Animated.delay(800),
        Animated.parallel([
          Animated.timing(privacyOpacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(privacyTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 30,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(iconScale, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(textRevealAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      return;
    }

    let redirectTimeout: ReturnType<typeof setTimeout> | undefined;

    // On attend que l'auth ait fini de charger (ou timeout de secours)
    // ET que la politique soit checkée et acceptée
    if (!isLoading && privacyChecked && privacyAccepted) {
      const isGuestMode = isAuthenticated && user?.username === "invite";
      console.log(
        "[splash] ready to redirect",
        JSON.stringify({ isAuthenticated, isConfigured, user, isGuestMode }),
      );

      if (isGuestMode) {
        const target = "Main";
        if ((navigation as any).replace) {
          (navigation as any).replace(target);
        } else {
          (navigation as any).navigate(target);
        }
      } else {
        redirectTimeout = setTimeout(() => {
          const target = isAuthenticated
            ? "Main"
            : isConfigured
              ? "PinLogin"
              : "InitialSetup";

          console.log("[splash] navigating to", target);
          if ((navigation as any).replace) {
            (navigation as any).replace(target);
          } else {
            (navigation as any).navigate(target);
          }
        }, 2400);
      }
    }

    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [
    isLoading,
    privacyChecked,
    privacyAccepted,
    isAuthenticated,
    isConfigured,
    user?.username,
    navigation,
  ]);

  const getMessage = () => {
    if (language === "zh") {
      return "应用加载时，我们会通过邮件向您发送我们的隐私和使用政策";
    } else if (language === "en") {
      return "When the application loads, we will communicate our privacy and usage policies to you by email";
    }
    return "Nous vous communiquerons par mail, nos politiques de confidentialité et d'utilisation";
  };

  const handleContinue = async () => {
    console.log("[splash] privacy accepted, continuing...");
    await markPrivacyAccepted();
  };

  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            transform: [
              { scale: logoScale },
              { translateY: Animated.add(translateY, floatingAnim) },
            ],
          }}
        >
          <Image
            source={require("../../../../assets/cedaici-transparent.png")}
            style={styles.image}
            resizeMode="contain"
          />

          {!privacyAccepted && privacyChecked ? (
            <Animated.View
              style={[
                styles.privacyOverlay,
                {
                  opacity: privacyOpacity,
                  transform: [{ translateY: privacyTranslateY }],
                },
              ]}
            >
              <View style={styles.privacyContent}>
                <Animated.View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      transform: [{ scale: iconScale }],
                    },
                  ]}
                >
                  <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
                </Animated.View>

                <Animated.View
                  style={{
                    opacity: textRevealAnim,
                    transform: [
                      {
                        translateY: textRevealAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <Text style={styles.message}>{getMessage()}</Text>
                </Animated.View>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={handleContinue}
                  activeOpacity={0.9}
                  onPressIn={() =>
                    Animated.spring(buttonScale, {
                      toValue: 0.96,
                      useNativeDriver: true,
                    }).start()
                  }
                  onPressOut={() =>
                    Animated.spring(buttonScale, {
                      toValue: 1,
                      useNativeDriver: true,
                    }).start()
                  }
                >
                  <Animated.View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      transform: [{ scale: buttonScale }],
                    }}
                  >
                    <Text style={styles.buttonText}>
                      {language === "zh"
                        ? "继续"
                        : language === "en"
                          ? "Continue"
                          : "Continuer"}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            <>
              <View style={styles.textContainer}>
                <Animated.Text
                  style={[
                    styles.appName,
                    {
                      opacity: textOpacity,
                      transform: [{ translateY: textTranslateY }],
                    },
                  ]}
                >
                  MyCedaici
                </Animated.Text>
              </View>
              {/* Spinner overlay centré */}
              <View style={styles.spinnerOverlay} pointerEvents="none">
                <Animated.View
                  style={[
                    styles.spinner,
                    { transform: [{ rotate: spinRotate }] },
                  ]}
                />
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220" },
  center: {
    flex: 1,
  },
  image: { width: 200, height: 200 },
  spinnerOverlay: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderTopColor: "#FFFFFF",
    backgroundColor: "transparent",
  },
  textContainer: {
    position: "absolute",
    bottom: 160,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 6,
    textTransform: "uppercase",
  },
  privacyOverlay: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
    padding: 28,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  privacyContent: {
    alignItems: "center",
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SplashScreen;
