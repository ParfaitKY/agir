import React, { useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  Animated,
  Image,
  Easing,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../../app/hooks/useAuth";

const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

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

    const timeout = setTimeout(() => {
      // Redirection automatique après ~2.4s
      if ((navigation as any).replace) {
        (navigation as any).replace(isAuthenticated ? "Main" : "Login");
      } else {
        (navigation as any).navigate(isAuthenticated ? "Main" : "Login");
      }
    }, 2400);

    return () => clearTimeout(timeout);
  }, [fadeAnim, scaleAnim, translateY, spinAnim, isAuthenticated, navigation]);

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
            source={require("../../../../assets/splashscreen.jpg")}
            style={styles.image}
            resizeMode="cover"
          />
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
  container: { flex: 1, backgroundColor: "#FFFFFF" }, // ou bleu LA PEYRIE EMF
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
    justifyContent: "center",
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
