import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";

// Définir les types pour les paramètres de navigation
type RootStackParamList = {
  ProductDetailPage: { productId?: string; categories?: string[] };
};

type ProductDetailRouteProp = RouteProp<
  RootStackParamList,
  "ProductDetailPage"
>;
type ProductDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ProductDetailPage"
>;

const ProductDetailPage: React.FC = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<ProductDetailNavigationProp>();
  const { t } = useI18n();
  const { colors } = useTheme();

  const { productId, categories } = route.params || {};

  const [activeTab, setActiveTab] = useState<"Avantages" | "Conditions">(
    "Avantages"
  );

  const advantages: string[] = [
    t("products.detail.adv.cardIncluded"),
    t("products.detail.adv.freeTransfers"),
    t("products.detail.adv.monthlyStatements"),
    t("products.detail.adv.mobileApp"),
    t("products.detail.adv.support"),
  ];

  return (
    <ScrollView style={styles.container}>
      {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text>← Retour</Text>
      </TouchableOpacity> */}

      <View
        style={[
          styles.productCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>📘</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("products.detail.title.currentAccount")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>
          {t("products.detail.subtitle.dailyManagement")}
        </Text>
        <Text style={[styles.status, { backgroundColor: colors.success + '20', color: colors.success }]}>
          <Text
            style={[
              styles.statusboule,
              { color: colors.success, transform: [{ translateY: 3 }] },
            ]}
          >
            ●
          </Text>
          <Text style={[styles.statusDisponible, { color: colors.success }]}>
            {t("products.detail.status.available")}
          </Text>
        </Text>
      </View>

      <View style={[styles.descriptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("products.detail.section.description")}
        </Text>
        <Text style={{ color: colors.text }}>{t("products.detail.description.short")}</Text>
        <Text style={[styles.enteteText, { color: colors.text + '80' }]}>
          {t("products.detail.description.long")}
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          t("products.detail.tab.advantages"),
          t("products.detail.tab.conditions"),
        ].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && [styles.activeTab, { backgroundColor: colors.primary, borderBottomColor: colors.primary }]]}
            onPress={() =>
              setActiveTab(
                (tab === t("products.detail.tab.conditions")
                  ? "Conditions"
                  : "Avantages") as "Avantages" | "Conditions"
              )
            }
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab
                  ? [styles.tabTextActive, { color: '#fff' }]
                  : [styles.tabTextInactive, { color: colors.text }],
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "Avantages" && (
        <View style={[styles.floatingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {advantages.map((adv, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={[styles.outerCircle, { backgroundColor: colors.primary + '20' }]}>
                <View style={[styles.innerCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              </View>
              <Text style={[styles.advItem, { color: colors.text }]}>{adv}</Text>
            </View>
          ))}
        </View>
      )}

      {activeTab === "Conditions" && (
        <View style={[styles.floatingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            t("products.detail.cond.age18"),
            t("products.detail.cond.idProof"),
            t("products.detail.cond.addressProof"),
          ].map((cond, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={[styles.outerCircle, { backgroundColor: colors.primary + '20' }]}>
                <View style={[styles.innerCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              </View>
              <Text style={[styles.advItem, { color: colors.text }]}>{cond}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={[styles.subscribeBtn, { backgroundColor: colors.primary }]}>
        <Text style={[styles.subscribeText, { color: '#fff' }]}>
          {t("products.detail.cta.subscribe")}
        </Text>
      </TouchableOpacity>

      <View style={[styles.helping, { backgroundColor: colors.warning + '10' }]}>
        <View style={styles.itemRow}>
          <View style={[styles.outerCircle, { backgroundColor: colors.warning + '20' }]}>
            <View style={[styles.innerCircle, { backgroundColor: colors.warning }]}>
              <Text style={styles.exclamationMark}>!</Text>
            </View>
          </View>
          <Text style={[styles.advItem, { color: colors.text }]}>
            {t("products.detail.help.contact")}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// Tu peux garder ton style inchangé
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  backButton: { marginBottom: 16 },
  productCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6, // Android shadow
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  iconCircle: {
    width: 60, // largeur du cercle
    height: 60,
    backgroundColor: "#e5f1ffff", // hauteur du cercle (même que la largeur)
    borderRadius: 30, // moitié de la largeur/hauteur pour faire un cercle
    borderWidth: 1, // épaisseur du contour
    borderColor: "#ccc", // couleur du contour
    justifyContent: "center",
    alignItems: "center", // pour centrer l'emoji
    shadowColor: "#000", // ombre légère
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    marginBottom: 10,
    elevation: 2, // nécessaire sur Android
  },

  icon: { fontSize: 32 },
  title: { fontSize: 20, fontWeight: "bold", marginTop: 10 },
  titleespace: { padding: 10 },
  subtitle: { fontSize: 14, color: "#0066CC", marginBottom: 10, marginTop: 4 },
  status: {
    padding: 10,
    backgroundColor: "#d1ffd4ff",
    color: "#008809ff",
    borderRadius: 15,
  },
  statusboule: { fontSize: 14, marginBottom: 8 },
  statusDisponible: { fontSize: 14, marginLeft: 4 },
  descriptionCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5, // pour Android
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  enteteText: { color: "#747474ff", marginTop: 10 },
  tabsRow: {
    flexDirection: "row",
    marginBottom: 16,
    justifyContent: "space-around",
    backgroundColor: "#fff",
    color: "#000",
    borderRadius: 20,
    padding: 8,
    marginVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tabBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#0066CC",
    backgroundColor: "#0066CC",
    borderRadius: 15,
  },
  tabText: { fontSize: 16 },
  tabTextInactive: {
    color: "#000", // texte noir par défaut
    fontSize: 16,
  },

  tabTextActive: {
    color: "#fff", // texte blanc quand actif
    fontSize: 16,
    fontWeight: "600",
  },

  helping: {
    marginTop: 15,
    backgroundColor: "#d3e9ffff",
    paddingTop: 15,
    paddingHorizontal: 10,
  },

  floatingCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginVertical: 2,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  outerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#cce5ff", // bleu ciel
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0066CC", // bleu foncé
    justifyContent: "center",
    alignItems: "center",
  },

  exclamationMark: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  checkMark: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  advItem: {
    marginBottom: 8,
    fontSize: 14,
    color: "#000",
    flexShrink: 1,
  },

  subscribeBtn: {
    backgroundColor: "#0066CC",
    padding: 16,
    alignItems: "center",
    borderRadius: 8,
  },
  subscribeText: { color: "#fff", fontWeight: "bold" },
});

export default ProductDetailPage;
