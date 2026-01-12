import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useI18n } from "../../../app/providers/I18nProvider";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

export const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqData = [
    {
      id: "account",
      title: "Compte & Profil",
      icon: "person-circle-outline",
      items: [
        {
          id: "q1",
          question: "Comment changer mon mot de passe ?",
          answer:
            "Pour changer votre mot de passe, allez dans Paramètres > Compte > Changer le code secret. Vous devrez entrer votre code actuel pour valider.",
        },
        {
          id: "q2",
          question: "Comment modifier mes informations personnelles ?",
          answer:
            "Vous pouvez modifier certaines informations dans Paramètres > Mon Profil. Pour des changements majeurs (nom, adresse), veuillez contacter le service client.",
        },
      ],
    },
    {
      id: "transfers",
      title: "Virements & Paiements",
      icon: "card-outline",
      items: [
        {
          id: "q3",
          question: "Combien de temps prend un virement ?",
          answer:
            "Les virements internes sont instantanés. Les virements vers d'autres banques peuvent prendre 24 à 48h ouvrables.",
        },
        {
          id: "q4",
          question: "Quels sont les frais de transfert ?",
          answer:
            "Les transferts entre comptes Cedaici sont gratuits. Les autres frais dépendent du type de transaction et sont indiqués avant validation.",
        },
      ],
    },
    {
      id: "security",
      title: "Sécurité",
      icon: "shield-checkmark-outline",
      items: [
        {
          id: "q5",
          question: "Que faire si j'ai perdu mon téléphone ?",
          answer:
            "Contactez immédiatement notre service client pour bloquer l'accès à votre compte mobile. Vous pourrez réactiver l'accès sur votre nouvel appareil.",
        },
        {
          id: "q6",
          question: "Comment activer la biométrie ?",
          answer:
            "Allez dans Paramètres > Sécurité et activez l'option 'Authentification biométrique'. Votre téléphone doit supporter cette fonctionnalité.",
        },
      ],
    },
  ];

  const filteredData = faqData
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header décoratif */}
      <View style={[styles.headerBg, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Comment pouvons-nous vous aider ?
          </Text>
          <Text style={styles.headerSubtitle}>
            Trouvez rapidement des réponses à vos questions
          </Text>
        </View>

        {/* Cercles décoratifs */}
        <View
          style={[
            styles.circleDecoration,
            { right: -20, top: -20, opacity: 0.1 },
          ]}
        />
        <View
          style={[
            styles.circleDecoration,
            { left: -40, bottom: -40, opacity: 0.1 },
          ]}
        />
      </View>

      {/* Barre de recherche flottante */}
      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, shadowColor: colors.text },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.text + "80"} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher une réponse..."
            placeholderTextColor={colors.text + "60"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.text + "60"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredData.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: colors.card },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Aucun résultat trouvé pour "{searchQuery}"
            </Text>
            <Text style={[styles.emptySubText, { color: colors.text + "60" }]}>
              Essayez d'autres mots-clés ou contactez le support.
            </Text>
          </View>
        ) : (
          filteredData.map((section) => (
            <View key={section.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name={section.icon as any}
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {section.title}
                </Text>
              </View>

              {section.items.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.faqItem,
                      {
                        backgroundColor: colors.card,
                        shadowColor: "#000",
                        borderColor: isExpanded
                          ? colors.primary
                          : "transparent",
                        borderWidth: isExpanded ? 1 : 0,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.questionRow}
                      onPress={() => toggleExpand(item.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.questionText,
                          {
                            color: colors.text,
                            fontWeight: isExpanded ? "700" : "500",
                          },
                        ]}
                      >
                        {item.question}
                      </Text>
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: isExpanded
                              ? colors.primary + "15"
                              : colors.background,
                          },
                        ]}
                      >
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={
                            isExpanded ? colors.primary : colors.text + "60"
                          }
                        />
                      </View>
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={styles.answerContainer}>
                        <Text
                          style={[
                            styles.answerText,
                            { color: colors.text + "90" },
                          ]}
                        >
                          {item.answer}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))
        )}

        <View style={styles.footerSpacer} />

        <View style={styles.footerContainer}>
          <View style={[styles.footerCard, { backgroundColor: colors.card }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.footerTitle, { color: colors.text }]}>
                Besoin d'aide supplémentaire ?
              </Text>
              <Text
                style={[styles.footerSubtitle, { color: colors.text + "70" }]}
              >
                Notre équipe est disponible 24/7
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.contactButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => navigation.navigate("CustomerSupport" as never)}
            >
              <Text style={styles.contactButtonText}>Contacter</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBg: {
    height: 180,
    paddingTop: 20,
    paddingHorizontal: 20,
    position: "relative",
    overflow: "hidden",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    zIndex: 2,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    width: "80%",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  circleDecoration: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#fff",
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: -25,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  content: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  faqItem: {
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    minHeight: 60,
  },
  questionText: {
    fontSize: 15,
    flex: 1,
    paddingRight: 16,
    lineHeight: 22,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: "center",
  },
  footerSpacer: {
    height: 20,
  },
  footerContainer: {
    marginTop: 10,
  },
  footerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  footerSubtitle: {
    fontSize: 12,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
