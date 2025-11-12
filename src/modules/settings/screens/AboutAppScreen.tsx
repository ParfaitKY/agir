import React, { useLayoutEffect, useEffect, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { Ionicons } from "@expo/vector-icons";

const AboutAppScreen: React.FC = () => {
  const navigation = useNavigation();
  const { language, t } = useI18n();

  useLayoutEffect(() => {
    const title =
      language === "fr" ? "À propos" : language === "zh" ? "关于" : "About";
    navigation.setOptions({ title });
  }, [language, navigation]);

  // Animations (déclarées au niveau du composant)
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const contactOpacities = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const contactTranslateYs = [
    useRef(new Animated.Value(8)).current,
    useRef(new Animated.Value(8)).current,
    useRef(new Animated.Value(8)).current,
    useRef(new Animated.Value(8)).current,
  ];

  useEffect(() => {
    // Animation de pulsation du logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.95,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Apparition des blocs de contact (fade + slide)
    contactOpacities.forEach((opacity, i) => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: 150 * i,
        useNativeDriver: true,
      }).start();
    });
    contactTranslateYs.forEach((ty, i) => {
      Animated.timing(ty, {
        toValue: 0,
        duration: 350,
        delay: 150 * i,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Animated.Image
            source={{ uri: "https://lapeyrie-emf.ga/logo.png" }}
            style={[styles.heroLogo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>{t("about.hero.title")}</Text>
          <Text style={styles.heroSubtitle}>{t("about.hero.subtitle")}</Text>
        </View>

        {/* Présentation */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t("about.presentation.title")}
          </Text>
          <Text style={styles.sectionText}>{t("about.presentation.p1")}</Text>
          <Text style={styles.sectionText}>{t("about.presentation.p2")}</Text>
        </View>

        {/* Nouvelle Gouvernance 2025 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("about.governance.title")}</Text>
          <Text style={styles.sectionText}>{t("about.governance.p1")}</Text>
        </View>

        {/* Nos Engagements */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t("about.commitments.title")}
          </Text>
          {[
            "about.commitments.item1",
            "about.commitments.item2",
            "about.commitments.item3",
            "about.commitments.item4",
            "about.commitments.item5",
          ].map((key, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.sectionText}>{t(key)}</Text>
            </View>
          ))}
        </View>

        {/* Informations Clés */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("about.info.title")}</Text>
          <View style={styles.infoGrid}>
            {[
              {
                label: t("about.info.foundation.label"),
                value: "2018",
                icon: "calendar-outline",
                hint: t("about.info.foundation.hint"),
              },
              {
                label: t("about.info.years.label"),
                value: "6+",
                icon: "trending-up-outline",
                hint: t("about.info.years.hint"),
              },
              {
                label: t("about.info.services.label"),
                value: "14",
                icon: "layers-outline",
                hint: t("about.info.services.hint"),
              },
              {
                label: t("about.info.availability.label"),
                value: "24/7",
                icon: "time-outline",
                hint: t("about.info.availability.hint"),
              },
            ].map((info, i) => (
              <View key={i} style={styles.infoItem}>
                <View style={styles.infoHeader}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons
                      name={info.icon as any}
                      size={18}
                      color="#0066CC"
                    />
                  </View>
                  <Text style={styles.infoValue}>{info.value}</Text>
                </View>
                <Text style={styles.infoLabel}>{info.label}</Text>
                <Text style={styles.infoHint}>{info.hint}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Notre Engagement Social */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("about.social.title")}</Text>
          <Text style={styles.sectionText}>{t("about.social.p1")}</Text>
        </View>

        {/* Mission, Vision, Valeurs */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("about.mission.title")}</Text>
          <Text style={styles.sectionText}>{t("about.mission.p1")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("about.vision.title")}</Text>
          <Text style={styles.sectionText}>{t("about.vision.p1")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("about.values.title")}</Text>
          <Text style={styles.sectionText}>{t("about.values.p1")}</Text>
        </View>

        {/* Nous contacter */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("about.contact.title")}</Text>
          <View style={{ gap: 12 }}>
            {[
              {
                icon: "call-outline",
                title: t("about.contact.phone.title"),
                text: t("about.contact.phone.text"),
              },
              {
                icon: "mail-outline",
                title: t("about.contact.email.title"),
                text: t("about.contact.email.text"),
              },
              {
                icon: "location-outline",
                title: t("about.contact.address.title"),
                text: t("about.contact.address.text"),
              },
              {
                icon: "globe-outline",
                title: t("about.contact.website.title"),
                text: t("about.contact.website.text"),
              },
            ].map((item, i) => (
              <Animated.View
                key={item.title}
                style={[
                  styles.contactBlock,
                  {
                    opacity: contactOpacities[i],
                    transform: [{ translateY: contactTranslateYs[i] }],
                  },
                ]}
              >
                <View style={styles.contactIconWrap}>
                  <Ionicons name={item.icon as any} size={20} color="#0066CC" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactTitle}>{item.title}</Text>
                  <Text style={styles.contactText}>{item.text}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
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
  heroTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  heroSubtitle: { fontSize: 14, color: "#6B7280" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  sectionText: { fontSize: 15, color: "#374151", lineHeight: 22 },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  bullet: { color: "#6B7280", fontSize: 18, lineHeight: 22 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  infoItem: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#E6F2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 12, color: "#6B7280" },
  infoValue: { fontSize: 18, color: "#111827", fontWeight: "700" },
  infoHint: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  // Styles de la section Contact
  contactBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E6F2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  contactTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  contactText: { fontSize: 13, color: "#374151", marginTop: 2 },
});

export default AboutAppScreen;
