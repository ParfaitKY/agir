import React, { useLayoutEffect } from "react";
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";

const TermsOfUseScreen: React.FC = () => {
  const navigation = useNavigation();
  const { language, t } = useI18n();

  useLayoutEffect(() => {
    const title = language === "fr" ? "Conditions d’utilisation" : language === "zh" ? "使用条款" : "Terms of Use";
    navigation.setOptions({ title });
  }, [language, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={{ uri: "https://lapeyrie-emf.ga/logo.png" }}
            style={styles.heroLogo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>{t("terms.hero.title")}</Text>
        </View>

        {/* Introduction */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("terms.intro.title")}</Text>
          <Text style={styles.paragraph}>{t("terms.intro.p1")}</Text>
        </View>

        {/* 1. Utilisation de l’application */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("terms.use.title")}</Text>
          <Text style={styles.paragraph}>{t("terms.use.p1")}</Text>
        </View>

        {/* 2. Compte utilisateur */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("terms.account.title")}</Text>
          <Text style={styles.paragraph}>{t("terms.account.p1")}</Text>
        </View>

        {/* 3. Données personnelles */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("terms.personalData.title")}</Text>
          <Text style={styles.paragraph}>{t("terms.personalData.p1")}</Text>
        </View>

        {/* 4. Responsabilités de l’utilisateur */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("terms.userResponsibilities.title")}</Text>
          <Text style={styles.paragraph}>{t("terms.userResponsibilities.p1")}</Text>
        </View>

        {/* 5. Modification des conditions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("terms.modifications.title")}</Text>
          <Text style={styles.paragraph}>{t("terms.modifications.p1")}</Text>
        </View>

        {/* 6. Contact */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("terms.contact.title")}</Text>
          <Text style={styles.paragraph}>{t("terms.contact.phone")}</Text>
          <Text style={styles.paragraph}>{t("terms.contact.email")}</Text>
          <Text style={styles.paragraph}>{t("terms.contact.address")}</Text>
          <Text style={styles.paragraph}>{t("terms.contact.website")}</Text>
        </View>

        {/* Consentement */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("terms.consent.title")}</Text>
          <Text style={styles.paragraph}>{t("terms.consent.p1")}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20 },
  hero: { alignItems: "center", gap: 8, marginBottom: 16 },
  heroLogo: { width: 200, height: 120 },
  heroTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  paragraph: { fontSize: 15, color: "#374151", lineHeight: 22 },
});

export default TermsOfUseScreen;
