import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";

const RateAppScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t, language } = useI18n();
  const { colors } = useTheme();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const fadeStars = useRef(new Animated.Value(0)).current;
  const scaleStars = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeStars, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleStars, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, fadeStars, scaleStars]);

  const stars = [1, 2, 3, 4, 5];

  const submit = () => {
    if (!rating) {
      Alert.alert(t("rate.alert.info.title"), t("rate.alert.info.body"));
      return;
    }
    Alert.alert(t("rate.alert.success.title"), t("rate.alert.success.body"));
    setRating(0);
    setComment("");
  };

  // Adapter le titre de l’appbar selon la langue
  useLayoutEffect(() => {
    const title = t("settings.app.rate");
    navigation.setOptions({ title });
  }, [language, navigation, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.logoWrap,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[styles.logoCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image
              source={require("../../../../assets/cedaici-transparent.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t("rate.hero.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.text + "80" }]}>{t("rate.hero.subtitle")}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            { backgroundColor: colors.card, borderColor: colors.border }
          ]}
        >
          <Animated.View
            style={[
              styles.stars,
              { opacity: fadeStars, transform: [{ scale: scaleStars }] },
            ]}
          >
            {stars.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setRating(s)}
                style={[styles.star, rating >= s && { backgroundColor: colors.warning + "20" }, { backgroundColor: colors.background }]}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={rating >= s ? "star" : "star-outline"}
                  size={32}
                  color={rating >= s ? colors.warning : colors.text + "60"}
                />
              </TouchableOpacity>
            ))}
          </Animated.View>

          <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons
              name="chatbox-ellipses-outline"
              size={18}
              color={colors.text}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.inputFlex, { color: colors.text }]}
              placeholder={t("rate.input.placeholder")}
              placeholderTextColor={colors.text + "80"}
              multiline
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.ghost, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                setRating(0);
                setComment("");
              }}
            >
              <Text style={[styles.buttonText, styles.ghostText, { color: colors.text }]}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primary, { backgroundColor: colors.primary }]}
              onPress={submit}
              activeOpacity={0.85}
            >
              <Text style={[styles.buttonText, styles.primaryText, { color: "#fff" }]}>
                {t("rate.actions.submit")}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  logoWrap: { alignItems: "center", marginBottom: 4 },
  logoCircle: {
    height: 92,
    width: 92,
    borderRadius: 46,
    backgroundColor: "#EAF4FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D6E8FF",
    marginBottom: 8,
  },
  logo: { height: 64, width: 64 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0A0A0A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    marginTop: 12,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  star: { padding: 8, borderRadius: 12, backgroundColor: "#F3F4F6" },
  starSelected: { backgroundColor: "#FEF3C7" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 10,
    marginTop: 16,
  },
  inputIcon: { marginRight: 8 },
  input: {
    height: 100,
    paddingHorizontal: 8,
    color: "#111827",
    textAlignVertical: "top",
  },
  inputFlex: { flex: 1 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  ghost: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  ghostText: { color: "#374151" },
  primary: { backgroundColor: "#0066CC" },
  primaryText: { color: "#fff" },
  buttonText: { fontSize: 14, fontWeight: "600" },
});

export default RateAppScreen;
