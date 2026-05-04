import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";

type RootStackParamList = {
  ProductDetailPage:
    | {
        product?: {
          title: string;
          subtitle: string;
          status?: string;
          statusKey?: "active" | "pending" | "closed";
          statusColor?: string;
          description?: string;
          features?: string[];
          advantages?: string[];
          conditions?: string[];
          solde?: number;
          agence?: string;
          typeCode?: string;
          icon?: string;
        };
      }
    | undefined;
};

type ProductDetailRouteProp = RouteProp<RootStackParamList, "ProductDetailPage">;
type ProductDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, "ProductDetailPage">;

const ProductDetailPage: React.FC = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<ProductDetailNavigationProp>();
  const { t } = useI18n();
  const { colors } = useTheme();

  const { product } = route.params || {};

  const [activeTab, setActiveTab] = useState<"Avantages" | "Conditions">("Avantages");
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

  const advantages: string[] = product?.advantages ?? [
    t("products.detail.adv.cardIncluded"),
    t("products.detail.adv.freeTransfers"),
    t("products.detail.adv.monthlyStatements"),
    t("products.detail.adv.mobileApp"),
    t("products.detail.adv.support"),
  ];
  const conditions: string[] = product?.conditions ?? [
    t("products.detail.cond.age18"),
    t("products.detail.cond.idProof"),
    t("products.detail.cond.addressProof"),
  ];

  const productName = product?.title || t("products.detail.title.currentAccount");

  const statusColor =
    product?.statusColor ??
    (product?.statusKey === "active"
      ? colors.success
      : product?.statusKey === "pending"
      ? colors.warning
      : colors.text + "60");

  const statusLabel =
    product?.status || t("products.detail.status.available");

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Carte produit */}
      <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + "15", borderColor: colors.border }]}>
          <Ionicons
            name={(product?.icon as any) || "card-outline"}
            size={32}
            color={colors.primary}
          />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{productName}</Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>
          {product?.subtitle || t("products.detail.subtitle.dailyManagement")}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Informations du compte */}
      {(product?.solde !== undefined || product?.agence || product?.typeCode) && (
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations du compte</Text>

          {product?.solde !== undefined && (
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: colors.primary + "12" }]}>
                <Ionicons name="wallet-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.infoTexts}>
                <Text style={[styles.infoLabel, { color: colors.text + "70" }]}>Solde disponible</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{fmt(product.solde)} XOF</Text>
              </View>
            </View>
          )}

          {!!product?.agence && (
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: colors.primary + "12" }]}>
                <Ionicons name="business-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.infoTexts}>
                <Text style={[styles.infoLabel, { color: colors.text + "70" }]}>Agence</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{product.agence}</Text>
              </View>
            </View>
          )}

          {!!product?.typeCode && (
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: colors.primary + "12" }]}>
                <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.infoTexts}>
                <Text style={[styles.infoLabel, { color: colors.text + "70" }]}>Type de produit</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{product.typeCode}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Description */}
      <View style={[styles.descriptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("products.detail.section.description")}
        </Text>
        <Text style={{ color: colors.text }}>
          {product?.description || t("products.detail.description.short")}
        </Text>
        <Text style={[styles.enteteText, { color: colors.text + "70" }]}>
          {t("products.detail.description.long")}
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[t("products.detail.tab.advantages"), t("products.detail.tab.conditions")].map((tab) => {
          const isActive = activeTab === (tab === t("products.detail.tab.conditions") ? "Conditions" : "Avantages");
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                isActive && [styles.activeTab, { backgroundColor: colors.primary, borderBottomColor: colors.primary }],
              ]}
              onPress={() =>
                setActiveTab(
                  tab === t("products.detail.tab.conditions") ? "Conditions" : "Avantages"
                )
              }
            >
              <Text style={[styles.tabText, isActive ? { color: "#fff", fontWeight: "600" } : { color: colors.text }]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contenu des tabs */}
      <View style={[styles.floatingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(activeTab === "Avantages" ? advantages : conditions).map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <View style={[styles.outerCircle, { backgroundColor: colors.primary + "20" }]}>
              <View style={[styles.innerCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            </View>
            <Text style={[styles.advItem, { color: colors.text }]}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.subscribeBtn, { backgroundColor: colors.primary }]}
        onPress={() => setShowSubscribeModal(true)}
      >
        <Text style={[styles.subscribeText, { color: "#fff" }]}>
          {t("products.detail.cta.subscribe")}
        </Text>
      </TouchableOpacity>

      <View style={[styles.helping, { backgroundColor: colors.warning + "10" }]}>
        <View style={styles.itemRow}>
          <View style={[styles.outerCircle, { backgroundColor: colors.warning + "20" }]}>
            <View style={[styles.innerCircle, { backgroundColor: colors.warning }]}>
              <Text style={styles.exclamationMark}>!</Text>
            </View>
          </View>
          <Text style={[styles.advItem, { color: colors.text }]}>
            {t("products.detail.help.contact")}
          </Text>
        </View>
      </View>

      {/* Modal confirmation */}
      <Modal
        transparent
        visible={showSubscribeModal}
        animationType="fade"
        onRequestClose={() => setShowSubscribeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {`${t("products.detail.modal.confirm.prefix")} ${productName} ?`}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalAction, { borderColor: colors.border }]}
                onPress={() => setShowSubscribeModal(false)}
                activeOpacity={0.8}
              >
                <Text style={{ color: colors.text }}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionConfirm, { backgroundColor: colors.primary }]}
                onPress={() => { setShowSubscribeModal(false); setShowSuccessModal(true); }}
                activeOpacity={0.8}
              >
                <Text style={{ color: "#fff" }}>{t("common.confirm")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal succès */}
      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.success }]}>
              {t("common.success")}
            </Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              {t("products.detail.modal.success.body")}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionConfirm, { backgroundColor: colors.success }]}
                onPress={() => setShowSuccessModal(false)}
                activeOpacity={0.8}
              >
                <Text style={{ color: "#fff" }}>{t("common.ok")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  backButton: { marginBottom: 16 },
  productCard: {
    marginBottom: 16, padding: 20,
    borderRadius: 20, alignItems: "center",
    paddingVertical: 30, paddingHorizontal: 20, marginVertical: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 5,
    borderWidth: 1,
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: "center", alignItems: "center",
    marginBottom: 12, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  title: { fontSize: 20, fontWeight: "bold", marginTop: 8, textAlign: "center" },
  subtitle: { fontSize: 14, fontWeight: "500", marginBottom: 12, marginTop: 4, textAlign: "center" },
  statusBadge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: "600" },

  infoCard: {
    marginBottom: 16, padding: 16, borderRadius: 20,
    marginVertical: 8, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 3,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  infoIconBg: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  infoValue: { fontSize: 15, fontWeight: "600", marginTop: 2 },

  descriptionCard: {
    marginBottom: 16, padding: 16, borderRadius: 20,
    marginVertical: 8, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 3,
  },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 8 },
  enteteText: { marginTop: 10, fontSize: 13, lineHeight: 20 },

  tabsRow: {
    flexDirection: "row", marginBottom: 16,
    justifyContent: "space-around", borderRadius: 20,
    padding: 8, marginVertical: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 3, borderWidth: 1,
  },
  tabBtn: {
    flex: 1, padding: 12, alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  activeTab: { borderRadius: 14 },
  tabText: { fontSize: 15 },

  helping: {
    marginTop: 15, paddingTop: 15, paddingHorizontal: 10,
    borderRadius: 12, marginBottom: 20,
  },
  floatingCard: {
    padding: 16, borderRadius: 20,
    marginVertical: 2, marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 3, borderWidth: 1,
  },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  outerCircle: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: "center", alignItems: "center", marginRight: 10,
  },
  innerCircle: {
    width: 14, height: 14, borderRadius: 7,
    justifyContent: "center", alignItems: "center",
  },
  exclamationMark: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  checkMark: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  advItem: { fontSize: 14, flexShrink: 1, lineHeight: 20 },

  subscribeBtn: {
    padding: 16, alignItems: "center", borderRadius: 14, marginBottom: 12,
  },
  subscribeText: { fontWeight: "bold", fontSize: 16 },

  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center", alignItems: "center",
  },
  modalCard: { width: "88%", borderRadius: 16, padding: 16, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  modalText: { fontSize: 16, marginBottom: 16 },
  modalActions: { flexDirection: "row", justifyContent: "space-between" },
  modalAction: {
    flex: 1, paddingVertical: 12, alignItems: "center",
    borderWidth: 1, borderRadius: 8, marginRight: 8,
  },
  modalActionConfirm: {
    flex: 1, paddingVertical: 12, alignItems: "center",
    borderRadius: 8, marginLeft: 8,
  },
});

export default ProductDetailPage;
