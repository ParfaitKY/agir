import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";

export const CustomerSupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useI18n();

  const supportOptions = [
    {
      id: "call",
      icon: "call-outline",
      title: "Appeler le service client",
      subtitle: "Disponible 24h/24 et 7j/7",
      action: () => {
        const phoneNumber = "+2250717288675"; // Numéro principal
        Linking.openURL(
          Platform.OS === "android"
            ? `tel:${phoneNumber}`
            : `telprompt:${phoneNumber}`
        );
      },
      color: "#4CAF50",
    },
    {
      id: "whatsapp",
      icon: "logo-whatsapp",
      title: "Nous contacter sur WhatsApp",
      subtitle: "Réponse instantanée",
      action: () => {
        const phoneNumber = "+2250712678691"; // Numéro WhatsApp
        const message = "Bonjour, j'ai besoin d'assistance.";
        Linking.openURL(
          `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
            message
          )}`
        );
      },
      color: "#25D366",
    },
    {
      id: "email",
      icon: "mail-outline",
      title: "Envoyer un email",
      subtitle: "info.vallon@cedaici.com",
      action: () => {
        navigation.navigate("EmailSupport" as never);
      },
      color: "#007AFF",
    },
    {
      id: "faq",
      icon: "help-circle-outline",
      title: "Consulter la FAQ",
      subtitle: "Questions fréquentes",
      action: () => {
        // Rediriger vers une page web ou un écran FAQ
        Linking.openURL("https://www.cedaici.com/faq");
      },
      color: "#FF9800",
    },
    {
      id: "location",
      icon: "location-outline",
      title: "Nos agences",
      subtitle: "Trouver une agence proche",
      action: () => {
        // Ouvrir Google Maps
        const query = "Agence Cedaici";
        const url = Platform.select({
          ios: `maps:0,0?q=${query}`,
          android: `geo:0,0?q=${query}`,
        });
        if (url) Linking.openURL(url);
      },
      color: "#E91E63",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons name="headset" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Besoin d'aide ?
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text + "90" }]}>
            Notre équipe est là pour vous accompagner. Choisissez le moyen de
            contact qui vous convient.
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {supportOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={option.action}
            >
              <View
                style={[
                  styles.optionIconContainer,
                  { backgroundColor: option.color + "20" },
                ]}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={option.color}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {option.title}
                </Text>
                <Text
                  style={[styles.optionSubtitle, { color: colors.text + "80" }]}
                >
                  {option.subtitle}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: colors.text + "60", marginBottom: 4 },
            ]}
          >
            Autres contacts : (+225) 27 21 51 87 19
          </Text>
          <Text
            style={[
              styles.footerText,
              { color: colors.text + "60", marginBottom: 4 },
            ]}
          >
            info.treichville@cedaici.com / info.odienne@cedaici.com
          </Text>
          <Text style={[styles.footerText, { color: colors.text + "60" }]}>
            Horaires d'ouverture : Lundi - Vendredi, 8h00 - 18h00
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
  },
  footer: {
    marginTop: 30,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
});
