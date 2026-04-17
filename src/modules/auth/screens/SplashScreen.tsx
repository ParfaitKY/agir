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

  // Animations pour la section privacy
  const privacyOpacity = useRef(new Animated.Value(0)).current;
  const privacyTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
      // Animation du texte avec un léger délai
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

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
      console.log("[splash] showing privacy overlay");
      // Afficher le message de confidentialité
      Animated.sequence([
        Animated.delay(1000),
        Animated.parallel([
          Animated.timing(privacyOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(privacyTranslateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
      return; // Ne pas rediriger tant que pas accepté
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
            transform: [{ scale: scaleAnim }, { translateY }],
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
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.message, { color: "#FFFFFF" }]}>
                  {getMessage()}
                </Text>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={handleContinue}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>
                    {language === "zh"
                      ? "继续"
                      : language === "en"
                        ? "Continue"
                        : "Continuer"}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
  container: { flex: 1, backgroundColor: "#0B1220" }, // ou bleu CEDAICI SA
  center: {
    flex: 1,
  },
  image: { width: "100%", height: "100%" }, // plein écran via cover
  spinnerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 100,
  },
  spinner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 4,
    borderColor: "#E0E0E0",
    borderTopColor: "#0066CC",
    borderLeftColor: "#E0E0E0",
    borderRightColor: "#E0E0E0",
    backgroundColor: "transparent",
  },
  textContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  appName: {
    marginTop: 150,
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 4,

    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  privacyOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    paddingBottom: 60,
    backgroundColor: "rgba(11, 18, 32, 0.85)", // Semi-transparent overlay on splash
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  privacyContent: {
    alignItems: "center",
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
    marginBottom: 32,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    gap: 8,
    width: "100%",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default SplashScreen;
