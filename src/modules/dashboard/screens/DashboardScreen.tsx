import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";


export const DashboardScreen: React.FC = () => {
  const [currentOffer, setCurrentOffer] = useState(0);
  const servicesScrollRef = useRef<FlatList>(null);
  const navigation = useNavigation();
  const [showQrModal, setShowQrModal] = useState(false);
  const { t, tText } = useI18n();

  const offers = [
    // ... (offres existantes restent identiques)
    {
      id: 1,
      badge: "Nouveau",
      badgeColor: "#007AFF",
      title: "Crédit Express",
      subtitle: "Obtenez jusqu'à 5M FCFA",
      description: "Taux préférentiel 4.5%",
      icon: "rocket-outline",
      iconColor: "#007AFF",
    },
    {
      id: 2,
      badge: "Limitée",
      badgeColor: "#34C759",
      title: "Épargne Plus",
      subtitle: "Rendement garanti 6%",
      description: "Capital 100% sécurisé",
      icon: "trending-up-outline",
      iconColor: "#34C759",
    },
  ];

  const services = [
    {
      id: 1,
      title: "Crédit Express",
      subtitle: "Prêt rapide",
      icon: "rocket-outline",
      iconColor: "#007AFF",
      backgroundColor: "#E3F2FD",
    },
    {
      id: 2,
      title: "Paiement factures",
      subtitle: "Eau, électricité",
      icon: "receipt-outline",
      iconColor: "#34C759",
      backgroundColor: "#E8F5E8",
    },
    {
      id: 3,
      title: "Recharge",
      subtitle: "Tous opérateurs",
      icon: "phone-portrait-outline",
      iconColor: "#FF9500",
      backgroundColor: "#FFF3E0",
    },
    {
      id: 4,
      title: "Assurance",
      subtitle: "Protection complète",
      icon: "shield-checkmark-outline",
      iconColor: "#AF52DE",
      backgroundColor: "#F3E5F5",
    },
  ];

  const transactions = [
    {
      id: 1,
      type: "Virement reçu",
      amount: "+50 000",
      date: "Aujourd'hui",
      amountColor: "#34C759",
      icon: "arrow-down-circle",
      iconColor: "#34C759",
    },
    {
      id: 2,
      type: "Retrait ATM",
      amount: "-25 000",
      date: "Hier",
      amountColor: "#FF3B30",
      icon: "cash-outline",
      iconColor: "#FF3B30",
    },
    {
      id: 3,
      type: "Paiement facture",
      amount: "-15 000",
      date: "Il y a 2 jours",
      amountColor: "#FF3B30",
      icon: "document-text-outline",
      iconColor: "#FF3B30",
    },
  ];

  const nextOffer = () => {
    setCurrentOffer((prev) => (prev + 1) % offers.length);
  };

  const prevOffer = () => {
    setCurrentOffer((prev) => (prev - 1 + offers.length) % offers.length);
  };

  // (redirection supprimée)

  const renderServiceItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.serviceCard}>
      <View
        style={[styles.serviceIcon, { backgroundColor: item.backgroundColor }]}
      >
        <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
      </View>
      <Text style={styles.serviceTitle}>{tText(item.title)}</Text>
      <Text style={styles.serviceSubtitle}>{tText(item.subtitle)}</Text>
      <View style={{ marginTop: 6 }}>
        <Ionicons name="chevron-forward" size={16} color="#9AA0A6" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Modal QR Code */}
      <Modal
        transparent
        visible={showQrModal}
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.qrOverlay}>
          <View style={styles.qrContainer}>
            <View style={styles.qrHeaderRow}>
              <Text style={styles.qrHeaderTitle}>
                {t("dashboard.qr.title")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowQrModal(false)}
                style={styles.qrCloseBtn}
              >
                <Ionicons name="close" size={20} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrBox}>
              <Ionicons name="qr-code-outline" size={220} color="#007AFF" />
            </View>

            <View style={styles.qrInfoCard}>
              <View style={styles.qrInfoRow}>
                <View
                  style={[styles.qrInfoIconBg, { backgroundColor: "#E3F2FD" }]}
                >
                  <Ionicons name="person-outline" size={18} color="#007AFF" />
                </View>
                <View style={styles.qrInfoTexts}>
                  <Text style={styles.qrInfoLabel}>
                    {t("dashboard.qr.name")}
                  </Text>
                  <Text style={styles.qrInfoValue}>Derly MOUPEPIDI</Text>
                </View>
              </View>

              <View style={styles.qrInfoRow}>
                <View
                  style={[styles.qrInfoIconBg, { backgroundColor: "#E8F5E8" }]}
                >
                  <Ionicons name="barcode-outline" size={18} color="#34C759" />
                </View>
                <View style={styles.qrInfoTexts}>
                  <Text style={styles.qrInfoLabel}>
                    {t("dashboard.qr.clientCode")}
                  </Text>
                  <Text style={styles.qrInfoValue}>LP001234</Text>
                </View>
              </View>

              <View style={styles.qrInfoRow}>
                <View
                  style={[styles.qrInfoIconBg, { backgroundColor: "#FFF3E0" }]}
                >
                  <Ionicons name="call-outline" size={18} color="#FF9500" />
                </View>
                <View style={styles.qrInfoTexts}>
                  <Text style={styles.qrInfoLabel}>
                    {t("dashboard.qr.phone")}
                  </Text>
                  <Text style={styles.qrInfoValue}>+241 77 68 38 55</Text>
                </View>
              </View>

              <View style={styles.qrTipBox}>
                <View
                  style={[styles.qrTipIconBg, { backgroundColor: "#E3F2FD" }]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#007AFF"
                  />
                </View>
                <Text style={styles.qrTipText}>{t("dashboard.qr.tip")}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ... (TOUTES LES SECTIONS EXISTANTES RESTENT IDENTIQUES) ... */}

      {/* Bande bleue de bienvenue - EXISTANT */}
      <View style={styles.header}>
        <View>
          <Text style={styles.time}>17:36</Text>
          <Text style={styles.hello}>{t("dashboard.greeting")}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowQrModal(true)}
          >
            <Ionicons name="qr-code-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>5</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Carte principale - EXISTANT */}
      <View style={styles.card}>
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>DM</Text>
          </View>
          <View>
            <Text style={styles.name}>Derly MOUPEPIDI</Text>
            <Text style={styles.accountType}>
              {t("dashboard.accountType.premium")}
            </Text>
          </View>
          <TouchableOpacity style={styles.eyeBtn}>
            <Ionicons name="eye-outline" size={20} color="#555" />
          </TouchableOpacity>
        </View>
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>
            {t("dashboard.balance.label")}
          </Text>
          <Text style={styles.balance}>5 850 000 XAF</Text>
          <View style={styles.subInfo}>
            <Text style={styles.subText}>{`💼 3 ${t(
              "dashboard.balance.activeAccountsLabel"
            )}`}</Text>
            <Text style={styles.percent}>📈 +2.5%</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Transfer" as never)}
          >
            <Ionicons
              name="arrow-forward-circle-outline"
              size={18}
              color="#007AFF"
            />
            <Text style={styles.actionText}>
              {t("dashboard.actions.transfer")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Accounts" as never)}
          >
            <Ionicons name="list-outline" size={18} color="#007AFF" />
            <Text style={styles.actionText}>
              {t("dashboard.actions.accounts")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Cards" as never)}
          >
            <Ionicons name="card-outline" size={18} color="#007AFF" />
            <Text style={styles.actionText}>
              {t("dashboard.actions.cards")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions rapides - EXISTANT */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("dashboard.actions.quick")}</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("Transfer" as never)}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: "#E3F2FD" }]}
            >
              <Ionicons name="swap-horizontal" size={24} color="#007AFF" />
            </View>
            <Text style={styles.quickActionTitle}>
              {t("dashboard.quick.transfer")}
            </Text>
            <Text style={styles.quickActionSubtitle}>
              {t("dashboard.quick.transfer.subtitle")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <View
              style={[styles.quickActionIcon, { backgroundColor: "#E8F5E8" }]}
            >
              <Ionicons name="people-outline" size={24} color="#34C759" />
            </View>
            <Text style={styles.quickActionTitle}>
              {t("dashboard.quick.beneficiaries")}
            </Text>
            <Text style={styles.quickActionSubtitle}>
              {t("dashboard.quick.beneficiaries.subtitle")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <View
              style={[styles.quickActionIcon, { backgroundColor: "#FFF3E0" }]}
            >
              <Ionicons name="briefcase-outline" size={24} color="#FF9500" />
            </View>
            <Text style={styles.quickActionTitle}>
              {t("dashboard.quick.products")}
            </Text>
            <Text style={styles.quickActionSubtitle}>
              {t("dashboard.quick.products.subtitle")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("Cards" as never)}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: "#F3E5F5" }]}
            >
              <Ionicons name="card-outline" size={24} color="#AF52DE" />
            </View>
            <Text style={styles.quickActionTitle}>
              {t("dashboard.quick.cards")}
            </Text>
            <Text style={styles.quickActionSubtitle}>
              {t("dashboard.quick.cards.subtitle")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Offres spéciales - EXISTANT */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("dashboard.offers.title")}</Text>
          <View style={styles.paginationControls}>
            <TouchableOpacity
              onPress={prevOffer}
              style={styles.paginationButton}
            >
              <Ionicons name="chevron-back" size={16} color="#007AFF" />
            </TouchableOpacity>
            <View style={styles.paginationDots}>
              {offers.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentOffer && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={nextOffer}
              style={styles.paginationButton}
            >
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.offersContainer}>
          <View style={styles.offerCard}>
            <View
              style={[
                styles.offerBadge,
                { backgroundColor: offers[currentOffer].badgeColor },
              ]}
            >
              <Text style={styles.offerBadgeText}>
                {tText(offers[currentOffer].badge)}
              </Text>
            </View>
            <View style={styles.offerContent}>
              <Text style={styles.offerTitle}>
                {tText(offers[currentOffer].title)}
              </Text>
              <Text style={styles.offerSubtitle}>
                {tText(offers[currentOffer].subtitle)}
              </Text>
              <Text style={styles.offerDescription}>
                {tText(offers[currentOffer].description)}
              </Text>
            </View>
            <View style={styles.offerIcon}>
              <Ionicons
                name={offers[currentOffer].icon as any}
                size={24}
                color={offers[currentOffer].iconColor}
              />
            </View>
          </View>
        </View>
      </View>

      {/* NOUVELLE SECTION : Nos services avec défilement horizontal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("dashboard.services.title")}</Text>
        <FlatList
          ref={servicesScrollRef}
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.servicesContainer}
          snapToAlignment="center"
          decelerationRate="fast"
        />
      </View>

      {/* NOUVELLE SECTION : Activité récente CORRIGÉE */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("dashboard.recent.title")}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>
              {t("dashboard.recent.seeAll")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsList}>
          {transactions.map((transaction, index) => (
            <View key={transaction.id}>
              <View style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: "#F8F9FB" },
                    ]}
                  >
                    <Ionicons
                      name={transaction.icon as any}
                      size={20}
                      color={transaction.iconColor}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>
                      {tText(transaction.type)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {tText(transaction.date)}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: transaction.amountColor },
                  ]}
                >
                  {transaction.amount}
                </Text>
              </View>

              {/* Séparateur sauf pour le dernier élément */}
              {index < transactions.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Espace en bas pour la navigation */}
      <View style={styles.bottomSpace} />
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8F9FB",
    flex: 1,
  },
  header: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  time: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  hello: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    marginLeft: 15,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "red",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 30,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    backgroundColor: "#007AFF",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  accountType: {
    color: "#007AFF",
    fontSize: 13,
  },
  eyeBtn: {
    marginLeft: "auto",
  },
  balanceSection: {
    marginTop: 20,
  },
  balanceLabel: {
    color: "#777",
    fontSize: 14,
  },
  balance: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007AFF",
    marginVertical: 8,
  },
  subInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subText: {
    color: "#888",
  },
  percent: {
    color: "green",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 15,
  },
  actionBtn: {
    alignItems: "center",
  },
  actionText: {
    color: "#007AFF",
    marginTop: 4,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  seeAllText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  // Styles pour Actions rapides - EXISTANT
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
    textAlign: "center",
  },
  // Styles pour la pagination - EXISTANT
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationDots: {
    flexDirection: "row",
    marginHorizontal: 12,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#CCCCCC",
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: "#007AFF",
    width: 8,
    height: 8,
  },
  // Styles pour Offres spéciales - EXISTANT
  offersContainer: {
    gap: 12,
  },
  offerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    position: "relative",
  },
  offerBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offerBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginBottom: 2,
  },
  offerDescription: {
    fontSize: 12,
    color: "#666",
  },
  offerIcon: {
    marginLeft: 12,
  },
  // NOUVEAUX STYLES : Nos services avec défilement horizontal
  servicesContainer: {
    paddingRight: 20,
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: 110,
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 2,
  },
  serviceSubtitle: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  // NOUVEAUX STYLES : Activité récente
  // NOUVEAUX STYLES : Activité récente CORRIGÉE
  transactionsList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    minHeight: 60,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: "#666",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 52, // Aligné avec le contenu (40px icon + 12px margin)
  },
  bottomSpace: {
    height: 30,
  },
  qrOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  qrContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
  },
  qrHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  qrHeaderTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A1A" },
  qrCloseBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  qrBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  qrInfoCard: { gap: 12 },
  qrInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FB",
    borderRadius: 12,
    padding: 12,
  },
  qrInfoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  qrInfoTexts: { flex: 1 },
  qrInfoLabel: { fontSize: 12, color: "#7F8C8D" },
  qrInfoValue: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  qrTipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F1F6FF",
    borderRadius: 12,
    padding: 12,
  },
  qrTipIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  qrTipText: { flex: 1, fontSize: 12, color: "#344054", lineHeight: 18 },
});
