import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../styles/ThemeProvider";

export const OfflineAnimation: React.FC = () => {
  const { colors } = useTheme();

  // Valeurs d'animation
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;
  const iconShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation de "Radar" (Ondes)
    const createPulse = (value: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createPulse(pulse1, 0);
    const anim2 = createPulse(pulse2, 600);
    const anim3 = createPulse(pulse3, 1200);

    // Animation de l'icône (Secousse)
    const shakeAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(iconShake, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(iconShake, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(iconShake, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(3000), // Pause entre les secousses
      ])
    );

    Animated.parallel([anim1, anim2, anim3, shakeAnim]).start();
  }, []);

  const getStyle = (value: Animated.Value) => ({
    transform: [
      {
        scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2] }),
      },
    ],
    opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
  });

  const shakeStyle = {
    transform: [
      {
        rotate: iconShake.interpolate({
          inputRange: [-1, 1],
          outputRange: ["-15deg", "15deg"],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Ondes concentriques */}
      <Animated.View
        style={[
          styles.circle,
          { borderColor: colors.primary },
          getStyle(pulse1),
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          { borderColor: colors.primary },
          getStyle(pulse2),
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          { borderColor: colors.primary },
          getStyle(pulse3),
        ]}
      />

      {/* Icône centrale animée */}
      <Animated.View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.card },
          shakeStyle,
        ]}
      >
        <Ionicons name="cloud-offline" size={48} color={colors.notification} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    // Ombre
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
