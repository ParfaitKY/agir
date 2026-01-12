import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Animated,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";

const EmailSupportScreen: React.FC = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [motif, setMotif] = useState<"support" | "claim" | "suggestion">(
    "support"
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
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
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const motifs = [
    { key: "support", label: t("support.email.motif.support") },
    { key: "claim", label: t("support.email.motif.claim") },
    { key: "suggestion", label: t("support.email.motif.suggestion") },
  ] as const;

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const sendMail = async () => {
    // Validation
    if (!email || !subject || !body) {
      Alert.alert(
        t("support.email.alert.required.title"),
        t("support.email.alert.required.body")
      );
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert(
        t("support.email.alert.invalidEmail.title"),
        t("support.email.alert.invalidEmail.body")
      );
      return;
    }

    const to =
      "info.vallon@cedaici.com,info.treichville@cedaici.com,info.odienne@cedaici.com";
    const finalSubject =
      subject || `[${motifs.find((m) => m.key === motif)?.label}]`;
    const finalBody = body || t("support.email.body.default");
    const composedBody = `De: ${email}\nMotif: ${
      motifs.find((m) => m.key === motif)?.label
    }\n\n${finalBody}`;
    const url = `mailto:${to}?subject=${encodeURIComponent(
      finalSubject
    )}&body=${encodeURIComponent(composedBody)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(
        t("support.email.alert.info.title"),
        t("support.email.alert.info.bodyPrefix") + to
      );
      return;
    }
    await Linking.openURL(url);
    Alert.alert(
      t("support.email.alert.success.title"),
      t("support.email.alert.success.body")
    );
    // Reset fields
    setEmail("");
    setSubject("");
    setBody("");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
          >
            <View
              style={[
                styles.logoCircle,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="mail-outline" size={36} color={colors.primary} />
            </View>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.label, { color: colors.text }]}>
            {t("support.email.address.label")}
          </Text>
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={18}
              color={colors.text}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.inputFlex, { color: colors.text }]}
              placeholder={t("support.email.address.placeholder")}
              placeholderTextColor={colors.text + "80"}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={[styles.label, { color: colors.text }]}>
            {t("support.email.motif.label")}
          </Text>
          <View style={styles.segmentRow}>
            {motifs.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMotif(m.key)}
                style={[
                  styles.segment,
                  motif === m.key && [
                    styles.segmentActive,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ],
                  motif !== m.key && {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    motif === m.key && [
                      styles.segmentTextActive,
                      { color: "#fff" },
                    ],
                    motif !== m.key && { color: colors.text },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>
            {t("support.email.subject.label")}
          </Text>
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="pencil-outline"
              size={18}
              color={colors.text}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.inputFlex, { color: colors.text }]}
              placeholder={t("support.email.subject.placeholder")}
              placeholderTextColor={colors.text + "80"}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <Text style={[styles.label, { color: colors.text }]}>
            {t("support.email.body.label")}
          </Text>
          <View
            style={[
              styles.inputRow,
              styles.textareaRow,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={colors.text}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                styles.textarea,
                styles.inputFlex,
                { color: colors.text },
              ]}
              placeholder={t("support.email.body.placeholder")}
              placeholderTextColor={colors.text + "80"}
              multiline
              value={body}
              onChangeText={setBody}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.ghost,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => {
                setEmail("");
                setSubject("");
                setBody("");
              }}
            >
              <Text
                style={[
                  styles.buttonText,
                  styles.ghostText,
                  { color: colors.text },
                ]}
              >
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primary,
                { backgroundColor: colors.primary },
              ]}
              onPress={sendMail}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.buttonText,
                  styles.primaryText,
                  { color: "#fff" },
                ]}
              >
                {t("support.email.action.send")}
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
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0A0A0A",
    marginBottom: 12,
  },
  logoWrap: { alignItems: "center", marginBottom: 12 },
  logoCircle: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: "#EAF4FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D6E8FF",
    alignSelf: "center",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  label: { fontSize: 13, color: "#6B7280", marginTop: 12 },
  segmentRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  segmentActive: { backgroundColor: "#0066CC", borderColor: "#0066CC" },
  segmentText: { fontSize: 13, color: "#374151" },
  segmentTextActive: { color: "#fff" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 10,
  },
  inputIcon: { marginRight: 8 },
  input: {
    height: 44,
    paddingHorizontal: 8,
    color: "#111827",
  },
  inputFlex: { flex: 1 },
  textarea: { height: 120, textAlignVertical: "top" },
  textareaRow: { alignItems: "flex-start" },
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

export default EmailSupportScreen;
