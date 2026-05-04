import React, { useLayoutEffect, useEffect, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { language, t } = useI18n();
  const { colors } = useTheme();

  useLayoutEffect(() => {
    const title =
      language === "fr"
        ? "Politique de Confidentialité"
        : language === "zh"
        ? "隐私政策"
        : "Privacy Policy";
    navigation.setOptions({ title });
  }, [language, navigation]);

  // Animations
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const sectionOpacities = new Array(10)
    .fill(0)
    .map(() => useRef(new Animated.Value(0)).current);
  const sectionTranslateYs = new Array(10)
    .fill(0)
    .map(() => useRef(new Animated.Value(10)).current);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.95,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    sectionOpacities.forEach((opacity, i) => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: 120 * i,
        useNativeDriver: true,
      }).start();
    });
    sectionTranslateYs.forEach((ty, i) => {
      Animated.timing(ty, {
        toValue: 0,
        duration: 350,
        delay: 120 * i,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const SectionCard: React.FC<{
    index: number;
    icon: string;
    title: string;
    children: React.ReactNode;
  }> = ({ index, icon, title, children }) => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: sectionOpacities[index],
          transform: [{ translateY: sectionTranslateYs[index] }],
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[styles.iconWrap, { backgroundColor: colors.primary + "20" }]}
        >
          <Ionicons name={icon as any} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
      </View>
      <View>{children}</View>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.hero}>
          <Animated.Image
            source={require("../../../../assets/agir-finance-logo.webp")}
            style={[styles.heroLogo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {t("privacy.hero.title")}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.text + "80" }]}>
            {t("privacy.hero.subtitle")}
          </Text>
        </View>

        {/* Données collectées */}
        <SectionCard
          index={0}
          icon="document-text-outline"
          title={t("privacy.data.title")}
        >
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("privacy.data.intro")}
          </Text>
          <View style={styles.bullets}>
            {[
              "privacy.data.item1",
              "privacy.data.item2",
              "privacy.data.item3",
              "privacy.data.item4",
              "privacy.data.item5",
            ].map((key, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: colors.text + "60" }]}>
                  •
                </Text>
                <Text
                  style={[styles.sectionText, { color: colors.text + "90" }]}
                >
                  {t(key)}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* Utilisation des données */}
        <SectionCard
          index={1}
          icon="settings-outline"
          title={t("privacy.use.title")}
        >
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("privacy.use.intro")}
          </Text>
          <View style={styles.bullets}>
            {[
              "privacy.use.item1",
              "privacy.use.item2",
              "privacy.use.item3",
              "privacy.use.item4",
              "privacy.use.item5",
            ].map((key, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: colors.text + "60" }]}>
                  •
                </Text>
                <Text
                  style={[styles.sectionText, { color: colors.text + "90" }]}
                >
                  {t(key)}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* Partage des données */}
        <SectionCard
          index={2}
          icon="share-social-outline"
          title={t("privacy.share.title")}
        >
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("privacy.share.p1")}
          </Text>
        </SectionCard>

        {/* Sécurité des données */}
        <SectionCard
          index={3}
          icon="lock-closed-outline"
          title={t("privacy.security.title")}
        >
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("privacy.security.p1")}
          </Text>
        </SectionCard>

        {/* Vos droits */}
        <SectionCard
          index={4}
          icon="person-circle-outline"
          title={t("privacy.rights.title")}
        >
          <View style={styles.bullets}>
            {[
              "privacy.rights.item1",
              "privacy.rights.item2",
              "privacy.rights.item3",
              "privacy.rights.item4",
              "privacy.rights.item5",
              "privacy.rights.item6",
            ].map((key, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: colors.text + "60" }]}>
                  •
                </Text>
                <Text
                  style={[styles.sectionText, { color: colors.text + "90" }]}
                >
                  {t(key)}
                </Text>
              </View>
            ))}
          </View>
          <Text
            style={[
              styles.sectionText,
              { marginTop: 6, color: colors.text + "90" },
            ]}
          >
            {t("privacy.rights.p1")}
          </Text>
        </SectionCard>

        {/* Conservation des données */}
        <SectionCard
          index={5}
          icon="time-outline"
          title={t("privacy.retention.title")}
        >
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("privacy.retention.p1")}
          </Text>
        </SectionCard>

        {/* Cookies */}
        <SectionCard
          index={6}
          icon="browsers-outline"
          title={t("privacy.cookies.title")}
        >
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("privacy.cookies.p1")}
          </Text>
        </SectionCard>

        {/* Modifications de la politique */}
        <SectionCard
          index={7}
          icon="refresh-outline"
          title={t("privacy.changes.title")}
        >
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("privacy.changes.p1")}
          </Text>
        </SectionCard>

        {/* Contact et réclamations */}
        <SectionCard
          index={8}
          icon="mail-outline"
          title={t("privacy.contact.title")}
        >
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("privacy.contact.email")}
          </Text>
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("privacy.contact.phone")}
          </Text>
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("privacy.contact.address")}
          </Text>
        </SectionCard>
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
  heroSubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center" },
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#E6F2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  sectionText: { fontSize: 15, color: "#374151", lineHeight: 22 },
  bullets: { marginTop: 6 },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  bullet: { color: "#6B7280", fontSize: 18, lineHeight: 22 },
});

export default PrivacyPolicyScreen;
