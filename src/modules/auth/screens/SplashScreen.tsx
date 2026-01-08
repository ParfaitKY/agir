import React, { useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  Animated,
  Image,
  Easing,
  Text,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../../app/hooks/useAuth";

const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated, isConfigured, user, isLoading } = useAuth() as any;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  // Animation du spinner (cercle de chargement)
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    ]).start();

    // Démarrer la rotation infinie du cercle de chargement
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    let redirectTimeout: ReturnType<typeof setTimeout> | undefined;
    if (!isLoading) {
      const isGuestMode = isAuthenticated && user?.username === "invite";
      console.log(
        "[splash] auth",
        JSON.stringify({ isAuthenticated, isConfigured, user })
      );
      if (isGuestMode) {
        const target = "Main";
        console.log(
          "[splash] navigate",
          target,
          "replace" in (navigation as any) ? "replace" : "navigate"
        );
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
          console.log(
            "[splash] navigate",
            target,
            "replace" in (navigation as any) ? "replace" : "navigate"
          );
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
    fadeAnim,
    scaleAnim,
    translateY,
    spinAnim,
    isAuthenticated,
    isConfigured,
    user?.username,
    isLoading,
    navigation,
  ]);

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
          <View style={styles.textContainer}>
            <Text style={styles.appName}>MyCedaici</Text>
          </View>
          {/* Spinner overlay centré */}
          <View style={styles.spinnerOverlay} pointerEvents="none">
            <Animated.View
              style={[styles.spinner, { transform: [{ rotate: spinRotate }] }]}
            />
          </View>
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
});

export default SplashScreen;
