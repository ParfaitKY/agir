import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";

const { width } = Dimensions.get("window");

export const ReportProblemScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [problemType, setProblemType] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const problemTypes = [
    { id: "bug", label: "Bug", icon: "bug" },
    { id: "crash", label: "Crash", icon: "flash-off" },
    { id: "ui", label: "Affichage", icon: "image" },
    { id: "other", label: "Autre", icon: "help" },
  ];

  const handleSubmit = () => {
    if (!problemType) {
      Alert.alert("Attention", "Veuillez sélectionner un type de problème.");
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert(
        "Attention",
        "Veuillez décrire le problème avec au moins 10 caractères."
      );
      return;
    }

    Alert.alert(
      "Message envoyé",
      "Merci de nous avoir signalé ce problème. Nous allons l'examiner rapidement.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            
            <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
              Nous sommes désolés que vous rencontriez un problème. Dites-nous
              en plus pour que nous puissions vous aider.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Type de problème
            </Text>
            <View style={styles.grid}>
              {problemTypes.map((type) => {
                const isSelected = problemType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.card,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => setProblemType(type.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={24}
                      color={isSelected ? "#fff" : colors.text}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        { color: isSelected ? "#fff" : colors.text },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Description
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                placeholder="Décrivez le problème en détail..."
                placeholderTextColor={colors.text + "50"}
                multiline
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Email (optionnel)
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  height: 50,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Votre email pour vous recontacter"
                placeholderTextColor={colors.text + "50"}
                keyboardType="email-address"
                value={contactEmail}
                onChangeText={setContactEmail}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Envoyer</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  typeButton: {
    width: (width - 48 - 12) / 2, // 2 columns
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textArea: {
    height: 120,
    fontSize: 16,
    lineHeight: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  footer: {
    marginTop: 20,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
