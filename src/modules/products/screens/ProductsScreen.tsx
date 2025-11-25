import React, { useState } from "react";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";

// Définir les types pour la navigation
type RootStackParamList = {
  ProductsScreen: undefined;
  DetailsProduits: { product: Product } | undefined;
};

type CategoryType = "tous" | "comptes" | "epargne" | "credit" | "services";

interface Category {
  id: CategoryType;
  label: string;
}

interface Product {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  category: CategoryType;
  status: string;
  icon: string;
  statusColor?: string;
  statusDotColor?: string;
  advantages?: string[];
  conditions?: string[];
}

export const ProductsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t, tText } = useI18n();
  const { colors } = useTheme();

  const [activeCategory, setActiveCategory] = useState<CategoryType>("comptes");

  const categories: Category[] = [
    { id: "tous", label: t("products.category.all") },
    { id: "comptes", label: t("products.category.accounts") },
    { id: "epargne", label: t("products.category.savings") },
    { id: "credit", label: t("products.category.credit") },
    { id: "services", label: t("products.category.services") },
  ];

  const products: Product[] = [
    {
      id: "1",
      title: t("products.list.currentAccount.title"),
      subtitle: t("products.list.currentAccount.subtitle"),
      description: t("products.list.currentAccount.description"),
      features: [
        t("products.list.currentAccount.feature.cardFree"),
        t("products.list.currentAccount.feature.unlimitedTransfers"),
      ],
      advantages: [
        "Carte bancaire gratuite incluse",
        "Virements illimités sans frais",
        "Relevé mensuel détaillé",
        "Application mobile performante",
        "Service client dédié 7j/7",
      ],
      conditions: [
        "Dépôt minimum : 25 000 XAF",
        "Frais de tenue : 1 500 XAF/mois",
        "Pièce d’identité requise",
      ],
      category: "comptes",
      status: t("products.status.active"),
      icon: "card-outline",
    },
    {
      id: "2",
      title: t("products.list.visaPremium.title"),
      subtitle: t("products.list.visaPremium.subtitle"),
      description: t("products.list.visaPremium.description"),
      features: [
        t("products.list.visaPremium.feature.travelInsurance"),
        t("products.list.visaPremium.feature.cashback2"),
      ],
      advantages: [
        "Assurance voyage incluse",
        "Cashback 2% sur tous vos achats",
        "Paiement sans contact",
        "Protection contre la fraude",
        "Assistance premium 24/7",
      ],
      conditions: [
        "Compte courant requis",
        "Cotisation : 5 000 XAF/an",
        "Plafond : 500 000 XAF/jour",
      ],
      category: "comptes",
      status: t("products.status.active"),
      icon: "card-outline",
    },
    {
      id: "credit-micro-express",
      title: "Micro-crédit Express",
      subtitle: "Financement rapide",
      description: "Obtenez un crédit rapidement pour vos projets",
      features: ["Réponse en 24h", "Taux avantageux"],
      advantages: [
        "Réponse en 24h maximum",
        "Taux d’intérêt avantageux",
        "Remboursement flexible",
        "Montant jusqu’à 500 000 XAF",
        "Procédure 100% digitale",
      ],
      conditions: [
        "Être client depuis 3 mois",
        "Justificatif de revenus",
        "Durée : 3 à 12 mois",
      ],
      category: "credit",
      status: "Inactif",
      icon: "flash-outline",
      statusColor: colors.text + "70",
      statusDotColor: colors.border,
    },
    {
      id: "service-health-insurance",
      title: "Assurance Santé",
      subtitle: "Protection famille",
      description: "Protégez votre famille avec notre assurance santé",
      features: ["Couverture complète", "Remboursement rapide"],
      advantages: [
        "Couverture médicale complète",
        "Remboursement sous 48h",
        "Assistance médicale 24/7",
        "Réseau de partenaires étendu",
        "Prise en charge directe",
      ],
      conditions: [
        "À partir de 15 000 XAF/mois",
        "Questionnaire médical",
        "Couverture jusqu'à 6 personnes",
      ],
      category: "services",
      status: "Inactif",
      icon: "shield-checkmark-outline",
      statusColor: colors.text + "70",
      statusDotColor: colors.border,
    },
    {
      id: "savings-standard",
      title: "Compte Épargne",
      subtitle: "Épargner et gagner",
      description: "Faites fructifier votre épargne avec des taux attractifs",
      features: ["Taux d’intérêt 5%", "Retraits flexibles"],
      category: "epargne",
      status: "Actif",
      icon: "trending-up-outline",
    },
    {
      id: "savings-project",
      title: "Épargne Projet",
      subtitle: "Objectifs personnalisés",
      description: "Épargnez pour vos projets avec un plan personnalisé",
      features: ["Objectifs ciblés", "Suivi en temps réel"],
      advantages: [
        "Objectifs personnalisés",
        "Suivi en temps réel",
        "Bonus de fidélité 3%",
        "Versements automatiques",
        "Conseils personnalisés",
      ],
      conditions: [
        "Dépôt initial : 10 000 XAF",
        "Versement minimum : 5 000 XAF",
        "Durée : 6 à 36 mois",
      ],
      category: "epargne",
      status: "En attente",
      icon: "trophy-outline",
      statusColor: colors.warning,
      statusDotColor: colors.warning,
    },
  ];

  const filteredProducts = products.filter(
    (product) =>
      activeCategory === "tous" || product.category === activeCategory
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header supprimé: on utilise maintenant l’AppBar native du navigateur */}

      <ScrollView
        style={[styles.content]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section Statistiques avec Cartes et Icônes */}
        <View style={[styles.statsSection, { backgroundColor: colors.card }]}>
          <View style={styles.statsCardsContainer}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[styles.iconContainer, { backgroundColor: colors.card }]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>3</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>
                {t("products.stats.active")}
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[styles.iconContainer, { backgroundColor: colors.card }]}
              >
                <Ionicons
                  name="time-outline"
                  size={24}
                  color={colors.warning}
                />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>1</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>
                {t("products.stats.pending")}
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[styles.iconContainer, { backgroundColor: colors.card }]}
              >
                <Ionicons
                  name="grid-outline"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {products.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>
                {t("products.stats.total")}
              </Text>
            </View>
          </View>
        </View>

        {/* Catégories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                activeCategory === category.id && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setActiveCategory(category.id)}
            >
              {activeCategory === category.id && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color="#fff"
                  style={styles.categoryIcon}
                />
              )}
              <Text
                style={[
                  styles.categoryText,
                  { color: colors.text },
                  activeCategory === category.id && {
                    color: "#fff",
                    fontWeight: "600",
                  },
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Liste des produits */}
        <View style={styles.productsList}>
          {filteredProducts.map((product) => (
            <View
              key={product.id}
              style={[styles.productCard, { backgroundColor: colors.card }]}
            >
              {/* Header avec icône et badge */}
              <View style={styles.productHeader}>
                <View
                  style={[
                    styles.productIconWrapper,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Ionicons
                    name={product.icon as any}
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <View
                  style={[
                    styles.productBadge,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <View
                    style={[
                      styles.badgeDot,
                      {
                        backgroundColor:
                          (product as Product).statusDotColor || colors.success,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.productBadgeText,
                      {
                        color:
                          (product as Product).statusColor || colors.success,
                      },
                    ]}
                  >
                    {product.status === "Actif"
                      ? t("products.status.active")
                      : tText(product.status)}
                  </Text>
                </View>
              </View>

              {/* Contenu du produit */}
              <View style={styles.productContent}>
                <Text style={[styles.productTitle, { color: colors.text }]}>
                  {tText(product.title)}
                </Text>
                <Text
                  style={[styles.productSubtitle, { color: colors.primary }]}
                >
                  {tText(product.subtitle)}
                </Text>
                <Text
                  style={[styles.productDescription, { color: colors.text }]}
                >
                  {tText(product.description)}
                </Text>

                <View style={styles.featuresList}>
                  {product.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <View
                        style={[
                          styles.checkbox,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                      <Text
                        style={[styles.featureText, { color: colors.text }]}
                      >
                        {tText(feature)}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.detailsButton,
                    { borderTopColor: colors.border },
                  ]}
                  onPress={() =>
                    navigation.navigate("DetailsProduits", { product })
                  }
                >
                  <Text
                    style={[
                      styles.detailsButtonText,
                      { color: colors.primary },
                    ]}
                  >
                    {t("products.action.details")}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  content: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconActive: {},
  iconPending: {},
  iconTotal: {},
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: { fontSize: 13, fontWeight: "500" },
  categoriesContainer: { paddingLeft: 20, marginVertical: 20 },
  categoriesContent: { paddingRight: 20 },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryButtonActive: {},
  categoryIcon: { marginRight: 6 },
  categoryText: { fontSize: 14, fontWeight: "500" },
  categoryTextActive: { fontWeight: "600" },
  productsList: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  productCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  productIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  productBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  productBadgeText: { fontSize: 12, fontWeight: "600" },
  productContent: { gap: 8 },
  productTitle: { fontSize: 18, fontWeight: "bold" },
  productSubtitle: { fontSize: 14, fontWeight: "500" },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  featuresList: { marginBottom: 12, gap: 10 },
  featureItem: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  featureText: { fontSize: 14, fontWeight: "400" },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  detailsButtonText: { fontSize: 14, fontWeight: "600" },
});
