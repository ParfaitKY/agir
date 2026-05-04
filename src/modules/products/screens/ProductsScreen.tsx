import React, { useState, useEffect } from "react";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useCompteStatistiques } from "../../../domain/compte/useCompteStatistiques";

type RootStackParamList = {
  ProductsScreen: undefined;
  DetailsProduits: { product: Product } | undefined;
};

type CategoryType = "tous" | "comptes" | "epargne" | "credit" | "services";

interface Category {
  id: CategoryType;
  label: string;
}

export interface Product {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  category: CategoryType;
  status: string;
  statusKey: "active" | "pending" | "closed";
  icon: string;
  statusColor?: string;
  statusDotColor?: string;
  advantages?: string[];
  conditions?: string[];
  solde?: number;
  agence?: string;
  typeCode?: string;
}

/** Détermine la catégorie et l'icône à partir du libellé/code produit */
function resolveCategory(acc: any): { category: CategoryType; icon: string } {
  const label = String(acc.PD_LIBELLE || acc.CO_INTITULECOMPTE || "").toUpperCase();
  const code = String(acc.PD_CODETYPEPRODUIT || acc.PT_CODEPRODUIT || "").toUpperCase();

  if (
    label.includes("EPARGNE") || label.includes("SAVING") ||
    label.includes("DAT") || label.includes("DEPOT") ||
    code.includes("EP") || code.includes("SAV")
  ) {
    return { category: "epargne", icon: "trending-up-outline" };
  }
  if (
    label.includes("CREDIT") || label.includes("PRET") ||
    label.includes("PRÊT") || label.includes("LOAN") ||
    code.includes("CR") || code.includes("PR")
  ) {
    return { category: "credit", icon: "flash-outline" };
  }
  if (
    label.includes("WALLET") || label.includes("MOBILE") ||
    label.includes("SERVICE") ||
    code.includes("WL") || code.includes("SV")
  ) {
    return { category: "services", icon: "phone-portrait-outline" };
  }
  return { category: "comptes", icon: "card-outline" };
}

/** Détermine le statut réel du compte depuis les données serveur */
function resolveStatus(acc: any): { statusKey: "active" | "pending" | "closed"; status: string } {
  const closureDate = acc.CO_DATECLOTURE;
  const solde = Number(acc.SOLDE ?? 0);
  const bloque = Number(acc.MONTANTBLOQUE ?? 0);

  if (closureDate && closureDate !== "" && closureDate !== "0000-00-00") {
    return { statusKey: "closed", status: "Clôturé" };
  }
  if (bloque > 0 && solde === 0) {
    return { statusKey: "pending", status: "En attente" };
  }
  return { statusKey: "active", status: "Actif" };
}

export const ProductsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t, tText } = useI18n();
  const { colors } = useTheme();

  const { data: compteStats, fetchData, isLoading, error } = useCompteStatistiques();

  useEffect(() => {
    fetchData();
  }, []);

  const [activeCategory, setActiveCategory] = useState<CategoryType>("comptes");

  const categories: Category[] = [
    { id: "tous", label: t("products.category.all") },
    { id: "comptes", label: t("products.category.accounts") },
    { id: "epargne", label: t("products.category.savings") },
    { id: "credit", label: t("products.category.credit") },
    { id: "services", label: t("products.category.services") },
  ];

  const accounts = compteStats?.COMPTES || [];
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

  const products: Product[] = accounts.map((acc, index) => {
    const { category, icon } = resolveCategory(acc);
    const { statusKey, status } = resolveStatus(acc);
    const solde = Number(acc.SOLDE ?? 0);
    const bloque = Number(acc.MONTANTBLOQUE ?? 0);
    const agence = acc.AG_CODEAGENCE || "";

    const statusColor =
      statusKey === "active"
        ? colors.success
        : statusKey === "pending"
        ? colors.warning
        : colors.text + "60";

    const features: string[] = [
      `Solde : ${fmt(solde)} XOF`,
      ...(bloque > 0 ? [`Montant bloqué : ${fmt(bloque)} XOF`] : []),
      ...(agence ? [`Agence : ${agence}`] : []),
      ...(acc.PD_CODETYPEPRODUIT ? [`Type : ${acc.PD_CODETYPEPRODUIT}`] : []),
    ];

    return {
      id: String(acc.id ?? acc.CO_CODECOMPTE ?? index),
      title: acc.PD_LIBELLE || acc.CO_INTITULECOMPTE || "Produit",
      subtitle: acc.NUMEROCOMPTE || acc.CO_CODECOMPTE || "",
      description: acc.CO_INTITULECOMPTE || acc.PD_LIBELLE || "",
      features,
      category,
      status,
      statusKey,
      icon,
      statusColor,
      statusDotColor: statusColor,
      solde,
      agence,
      typeCode: acc.PD_CODETYPEPRODUIT || acc.PT_CODEPRODUIT || "",
    };
  });

  // Statistiques calculées dynamiquement depuis les vraies données
  const activeCount = products.filter((p) => p.statusKey === "active").length;
  const pendingCount = products.filter((p) => p.statusKey === "pending").length;
  const totalCount = products.length;

  const filteredProducts = products.filter(
    (product) => activeCategory === "tous" || product.category === activeCategory
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Statistiques */}
        <View style={[styles.statsSection, { backgroundColor: colors.card }]}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
          ) : (
            <View style={styles.statsCardsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.success + "15" }]}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </View>
                <Text style={[styles.statNumber, { color: colors.text }]}>{activeCount}</Text>
                <Text style={[styles.statLabel, { color: colors.text }]}>
                  {t("products.stats.active")}
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.warning + "15" }]}>
                  <Ionicons name="time-outline" size={24} color={colors.warning} />
                </View>
                <Text style={[styles.statNumber, { color: colors.text }]}>{pendingCount}</Text>
                <Text style={[styles.statLabel, { color: colors.text }]}>
                  {t("products.stats.pending")}
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons name="grid-outline" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.statNumber, { color: colors.text }]}>{totalCount}</Text>
                <Text style={[styles.statLabel, { color: colors.text }]}>
                  {t("products.stats.total")}
                </Text>
              </View>
            </View>
          )}
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
                <Ionicons name="checkmark" size={16} color="#fff" style={styles.categoryIcon} />
              )}
              <Text
                style={[
                  styles.categoryText,
                  { color: colors.text },
                  activeCategory === category.id && { color: "#fff", fontWeight: "600" },
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Erreur */}
        {!!error && !isLoading && (
          <View style={[styles.errorBox, { backgroundColor: colors.error + "12", borderColor: colors.error + "30" }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={fetchData}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Liste des produits */}
        <View style={styles.productsList}>
          {!isLoading && filteredProducts.length === 0 && (
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="cube-outline" size={40} color={colors.text + "40"} />
              <Text style={[styles.emptyText, { color: colors.text + "60" }]}>
                Aucun produit dans cette catégorie
              </Text>
            </View>
          )}

          {filteredProducts.map((product) => (
            <View key={product.id} style={[styles.productCard, { backgroundColor: colors.card }]}>
              {/* Header */}
              <View style={styles.productHeader}>
                <View style={[styles.productIconWrapper, { backgroundColor: colors.primary + "12" }]}>
                  <Ionicons name={product.icon as any} size={28} color={colors.primary} />
                </View>
                <View style={[styles.productBadge, { backgroundColor: (product.statusColor ?? colors.success) + "18" }]}>
                  <View style={[styles.badgeDot, { backgroundColor: product.statusDotColor ?? colors.success }]} />
                  <Text style={[styles.productBadgeText, { color: product.statusColor ?? colors.success }]}>
                    {product.statusKey === "active"
                      ? t("products.status.active")
                      : product.statusKey === "pending"
                      ? t("products.stats.pending")
                      : tText(product.status)}
                  </Text>
                </View>
              </View>

              {/* Contenu */}
              <View style={styles.productContent}>
                <Text style={[styles.productTitle, { color: colors.text }]}>
                  {tText(product.title)}
                </Text>
                <Text style={[styles.productSubtitle, { color: colors.primary }]}>
                  {product.subtitle}
                </Text>
                {product.description !== product.title && (
                  <Text style={[styles.productDescription, { color: colors.text + "80" }]}>
                    {tText(product.description)}
                  </Text>
                )}

                <View style={styles.featuresList}>
                  {product.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <View style={[styles.checkbox, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                      <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.detailsButton, { borderTopColor: colors.border }]}
                  onPress={() => navigation.navigate("DetailsProduits", { product })}
                >
                  <Text style={[styles.detailsButtonText, { color: colors.primary }]}>
                    {t("products.action.details")}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.primary} />
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

  statsSection: { paddingHorizontal: 20, paddingVertical: 20 },
  statsCardsContainer: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  statCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1 },
  iconContainer: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  statNumber: { fontSize: 28, fontWeight: "bold", marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: "500", textAlign: "center" },

  categoriesContainer: { paddingLeft: 20, marginVertical: 20 },
  categoriesContent: { paddingRight: 20 },
  categoryButton: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, marginRight: 10, borderWidth: 1,
  },
  categoryIcon: { marginRight: 6 },
  categoryText: { fontSize: 14, fontWeight: "500" },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, padding: 12, borderWidth: 1,
    marginHorizontal: 20, marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 13 },
  retryText: { fontSize: 13, fontWeight: "600" },

  emptyBox: {
    borderRadius: 16, padding: 40, alignItems: "center",
    gap: 12, borderWidth: 1,
  },
  emptyText: { fontSize: 14, textAlign: "center" },

  productsList: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  productCard: {
    borderRadius: 16, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  productHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 16,
  },
  productIconWrapper: {
    width: 56, height: 56, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  productBadge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  productBadgeText: { fontSize: 12, fontWeight: "600" },
  productContent: { gap: 8 },
  productTitle: { fontSize: 18, fontWeight: "bold" },
  productSubtitle: { fontSize: 14, fontWeight: "500" },
  productDescription: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  featuresList: { marginBottom: 12, gap: 10 },
  featureItem: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    justifyContent: "center", alignItems: "center", marginRight: 10,
  },
  featureText: { fontSize: 14, fontWeight: "400", flex: 1 },
  detailsButton: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingTop: 16, borderTopWidth: 1,
  },
  detailsButtonText: { fontSize: 14, fontWeight: "600" },
});
