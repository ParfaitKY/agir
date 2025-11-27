import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../app/hooks/useAuth";

export const LoginScreen: React.FC = () => {
  const [code, setCode] = useState("");
  const [isError, setIsError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const { loginWithPin } = useAuth() as any;

  const handleNumberPress = (num: string) => {
    if (code.length < 5) setCode((prev) => prev + num);
  };

  const handleDelete = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  const handleFingerprint = () => {
    Alert.alert("Empreinte digitale", "Fonctionnalité à implémenter");
  };

  const handleForgotCode = () => {
    Alert.alert("Mot de passe oublié", "Fonctionnalité à venir");
  };

  const shakeAnimation = () => {
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
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleValidation = async () => {
    if (code.length === 5) {
      try {
        await loginWithPin(code);
      } catch (error) {
        setIsError(true);
        Vibration.vibrate(100);
        shakeAnimation();
        setTimeout(() => setIsError(false), 800);
        setCode("");
      }
    }
  };

  useEffect(() => {
    if (code.length === 5) handleValidation();
  }, [code]);

  const renderCircles = () => (
    <View style={styles.circlesContainer}>
      {[...Array(5)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.circle,
            code.length > index && styles.circleFilled,
            isError && { borderColor: "#f55" },
          ]}
        />
      ))}
    </View>
  );

  const numbers = [
    ["7", "6", "8"],
    ["5", "9", "3"],
    ["0", "1", "2"],
    ["finger", "4", "del"],
  ];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}
      >
        <Text style={styles.title}>Code de sécurité</Text>
        <Text style={styles.subtitle}>
          Veuillez entrer votre code de sécurité
        </Text>

        {renderCircles()}

        <TouchableOpacity onPress={handleForgotCode}>
          <Text style={styles.forgotText}>J’ai oublié mon code</Text>
        </TouchableOpacity>

        <View style={styles.keypad}>
          {numbers.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.key}
                  onPress={() => {
                    if (key === "del") handleDelete();
                    else if (key === "finger") handleFingerprint();
                    else handleNumberPress(key);
                  }}
                >
                  {key === "del" ? (
                    <Ionicons name="close-outline" size={28} color="#f55" />
                  ) : key === "finger" ? (
                    <Ionicons
                      name="finger-print-outline"
                      size={30}
                      color="#007AFF"
                    />
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 25,
  },
  circlesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 160,
    marginBottom: 20,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#ccc",
  },
  circleFilled: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  forgotText: {
    color: "#007AFF",
    fontSize: 13,
    marginBottom: 25,
  },
  keypad: {
    width: "100%",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 8,
  },
  key: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: {
    fontSize: 22,
    color: "#333",
  },
});
