import React, { useLayoutEffect, useEffect, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Linking,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../shared/styles/ThemeProvider";

const AboutAppScreen: React.FC = () => {
  const navigation = useNavigation();
  const { language, t } = useI18n();
  const { colors } = useTheme();

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

  const handleLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("An error occurred", error);
    }
  };

  const getContactItems = () => {
    const phone = t("about.contact.phone.text") || "";
    const email = t("about.contact.email.text") || "";
    const website = t("about.contact.website.text") || "";
    
    return [
      {
        icon: "call-outline",
        title: t("about.contact.phone.title"),
        text: phone,
        link: `tel:${phone.replace(/\s/g, "")}`,
      },
      {
        icon: "mail-outline",
        title: t("about.contact.email.title"),
        text: email,
        link: `mailto:${email}`,
      },
      {
        icon: "location-outline",
        title: t("about.contact.address.title"),
        text: t("about.contact.address.text"),
        link: "https://maps.app.goo.gl/3BujYN5wunFPcYgp6",
      },
      {
        icon: "globe-outline",
        title: t("about.contact.website.title"),
        text: website,
        link: website.startsWith("http") ? website : `https://${website}`,
      },
    ];
  };

  const contactItems = getContactItems();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Animated.Image
            source={require("../../../../assets/agir-finance-logo.webp")}
            style={[styles.heroLogo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {t("about.hero.title")}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.text + "80" }]}>
            {t("about.hero.subtitle")}
          </Text>
        </View>

        {/* Présentation */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("about.presentation.title")}
          </Text>
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("about.presentation.p1")}
          </Text>
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("about.presentation.p2")}
          </Text>
        </View>

        {/* Nouvelle Gouvernance 2025 */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("about.governance.title")}
          </Text>
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("about.governance.p1")}
          </Text>
        </View>

        {/* Nos Engagements */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
              <Text style={[styles.bullet, { color: colors.text + "60" }]}>
                •
              </Text>
              <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
                {t(key)}
              </Text>
            </View>
          ))}
        </View>

        {/* Informations Clés */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("about.info.title")}
          </Text>
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
              <View
                key={i}
                style={[
                  styles.infoItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.infoHeader}>
                  <View
                    style={[
                      styles.infoIconWrap,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Ionicons
                      name={info.icon as any}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {info.value}
                  </Text>
                </View>
                <Text style={[styles.infoLabel, { color: colors.text + "80" }]}>
                  {info.label}
                </Text>
                <Text style={[styles.infoHint, { color: colors.text + "60" }]}>
                  {info.hint}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Notre Engagement Social */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("about.social.title")}
          </Text>
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("about.social.p1")}
          </Text>
        </View>

        {/* Mission, Vision, Valeurs */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("about.mission.title")}
          </Text>
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("about.mission.p1")}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("about.vision.title")}
          </Text>
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("about.vision.p1")}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("about.values.title")}
          </Text>
          <Text style={[styles.sectionText, { color: colors.text + "90" }]}>
            {t("about.values.p1")}
          </Text>
        </View>

        {/* Nous contacter */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("about.contact.title")}
          </Text>
          <View style={{ gap: 12 }}>
            {contactItems.map((item, i) => (
              <TouchableOpacity
                key={item.title}
                activeOpacity={0.7}
                onPress={() => item.link && handleLink(item.link)}
                disabled={!item.link}
              >
                <Animated.View
                  style={[
                    styles.contactBlock,
                    {
                      opacity: contactOpacities[i],
                      transform: [{ translateY: contactTranslateYs[i] }],
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.contactIconWrap,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.contactText,
                        { color: colors.text + "80" },
                        item.link ? { textDecorationLine: "underline" } : {},
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                  {!!item.link && (
                    <Ionicons
                      name="open-outline"
                      size={16}
                      color={colors.text + "60"}
                    />
                  )}
                </Animated.View>
              </TouchableOpacity>
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