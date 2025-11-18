import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Dimensions,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../app/hooks/useAuth";

export const DashboardScreen: React.FC = () => {
  const servicesScrollRef = useRef<FlatList>(null);
  const navigation = useNavigation();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  
  // Détection du mode invité (username === "invite")
  const isGuestMode = isAuthenticated && user?.username === "invite";
  
  // DEBUG: Log authentication state
  console.log("Dashboard - isAuthenticated:", isAuthenticated);
  console.log("Dashboard - user:", user);
  console.log("Dashboard - isGuestMode:", isGuestMode);
  
  // Fonction pour gérer les restrictions en mode invité
  const handleGuestRestriction = (featureName: string) => {
    console.log("handleGuestRestriction - isGuestMode:", isGuestMode);
    if (isGuestMode) {
      Alert.alert(
        "Connexion requise",
        "Veuillez vous connecter pour accéder à cette fonctionnalité.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Se connecter", onPress: () => navigation.navigate("Login" as never) }
        ]
      );
      return true;
    }
    return false;
  };
  
  // Calculer la hauteur totale du header (incluant l'encoche)
  const headerHeight = 140 + insets.top; // Réduit à 140

  const screenWidth = Dimensions.get("window").width;
  const horizontalPadding = 40; // 20 left + 20 right (section padding)
  const itemSpacing = 12; // space between items
  const offerCardWidth = screenWidth - horizontalPadding - itemSpacing; // account for spacing to avoid overflow

  const offers = [
    // ... (offres existantes restent identiques)
    {
      id: 1,
      badge: "Nouveau",
      badgeColor: colors.primary,
      title: "Crédit Express",
      subtitle: "Obtenez jusqu'à 5M FCFA",
      description: "Taux préférentiel 4.5%",
      icon: "rocket-outline",
      iconColor: colors.primary,
    },
    {
      id: 2,
      badge: "Limitée",
      badgeColor: colors.success,
      title: "Épargne Plus",
      subtitle: "Rendement garanti 6%",
      description: "Capital 100% sécurisé",
      icon: "trending-up-outline",
      iconColor: colors.success,
    },
  ];

  const services = [
    {
      id: 1,
      title: "Crédit Express",
      subtitle: "Prêt rapide",
      icon: "rocket-outline",
      iconColor: colors.primary,
      backgroundColor: colors.primary + "20",
    },
    {
      id: 2,
      title: "Paiement factures",
      subtitle: "Eau, électricité",
      icon: "receipt-outline",
      iconColor: colors.success,
      backgroundColor: colors.success + "20",
    },
    {
      id: 3,
      title: "Recharge",
      subtitle: "Tous opérateurs",
      icon: "phone-portrait-outline",
      iconColor: colors.warning,
      backgroundColor: colors.warning + "20",
    },
    {
      id: 4,
      title: "Assurance",
      subtitle: "Protection complète",
      icon: "shield-checkmark-outline",
      iconColor: colors.primary,
      backgroundColor: colors.primary + "20",
    },
  ];

  const allTransactions = [
    {
      id: 1,
      type: "Virement reçu",
      amount: "+50 000",
      date: "Aujourd'hui",
      amountColor: colors.success,
      icon: "arrow-down-circle",
      iconColor: colors.success,
    },
    {
      id: 2,
      type: "Retrait ATM",
      amount: "-25 000",
      date: "Hier",
      amountColor: colors.error,
      icon: "cash-outline",
      iconColor: colors.error,
    },
    {
      id: 3,
      type: "Paiement facture",
      amount: "-15 000",
      date: "Il y a 2 jours",
      amountColor: colors.error,
      icon: "document-text-outline",
      iconColor: colors.error,
    },
    {
      id: 4,
      type: "Achat en ligne",
      amount: "-8 500",
      date: "Il y a 3 jours",
      amountColor: colors.error,
      icon: "cart-outline",
      iconColor: colors.error,
    },
    {
      id: 5,
      type: "Remboursement",
      amount: "+12 000",
      date: "Il y a 4 jours",
      amountColor: colors.success,
      icon: "return-up-back-outline",
      iconColor: colors.success,
    },
    {
      id: 6,
      type: "Frais bancaires",
      amount: "-1 200",
      date: "Il y a 5 jours",
      amountColor: colors.error,
      icon: "card-outline",
      iconColor: colors.error,
    },
    {
      id: 7,
      type: "Virement sortant",
      amount: "-75 000",
      date: "Il y a 6 jours",
      amountColor: colors.error,
      icon: "arrow-up-circle",
      iconColor: colors.error,
    },
    {
      id: 8,
      type: "Intérêts épargne",
      amount: "+3 500",
      date: "Il y a 7 jours",
      amountColor: colors.success,
      icon: "trending-up-outline",
      iconColor: colors.success,
    },
    {
      id: 9,
      type: "Paiement mobile",
      amount: "-5 000",
      date: "Il y a 8 jours",
      amountColor: colors.error,
      icon: "phone-portrait-outline",
      iconColor: colors.error,
    },
    {
      id: 10,
      type: "Commission",
      amount: "-500",
      date: "Il y a 9 jours",
      amountColor: colors.error,
      icon: "receipt-outline",
      iconColor: colors.error,
    },
    {
      id: 11,
      type: "Bonus fidélité",
      amount: "+2 000",
      date: "Il y a 10 jours",
      amountColor: colors.success,
      icon: "gift-outline",
      iconColor: colors.success,
    },
  ];

  // Afficher seulement 3 transactions par défaut, ou toutes si "Voir tout" est activé
  const transactions = showAllTransactions ? allTransactions : allTransactions.slice(0, 3);

  // Rendu d'une offre pour la pagination horizontale
  const renderOfferItem = ({ item, index }: { item: any; index: number }) => (
    <View
      style={[
        styles.offerCard,
        {
          width: offerCardWidth,
          marginRight: index === offers.length - 1 ? 0 : itemSpacing,
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.offerBadge, { backgroundColor: item.badgeColor }]}>
        <Text style={styles.offerBadgeText}>{tText(item.badge)}</Text>
      </View>
      <View style={styles.offerContent}>
        <Text style={[styles.offerTitle, { color: colors.text }]}>{tText(item.title)}</Text>
        <Text style={[styles.offerSubtitle, { color: colors.primary }]}>{tText(item.subtitle)}</Text>
        <Text style={[styles.offerDescription, { color: colors.text + "80" }]}>{tText(item.description)}</Text>
      </View>
    </View>
  );

  // (redirection supprimée)

  const renderServiceItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View
        style={[styles.serviceIcon, { backgroundColor: item.backgroundColor }]}
      >
        <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
      </View>
      <Text style={[styles.serviceTitle, { color: colors.text }]}>{tText(item.title)}</Text>
      <Text style={[styles.serviceSubtitle, { color: colors.text + "70" }]}>{tText(item.subtitle)}</Text>
      <View style={{ marginTop: 6 }}>
        <Ionicons name="chevron-forward" size={16} color={colors.text} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header fixe avec View normale - HAUTEUR AUGMENTÉE */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={[styles.time, { color: colors.background }]}>17:36</Text>
          <Text style={[styles.hello, { color: colors.background }]}>{t("dashboard.greeting")}</Text>
          <Text style={{ color: colors.background, fontSize: 12, marginTop: 4 }}>
            {isGuestMode ? "MODE INVITÉ" : isAuthenticated ? "CONNECTÉ" : "NON CONNECTÉ"}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              if (handleGuestRestriction("le code QR")) return;
              setShowQrModal(true);
            }}
          >
            <Ionicons name="qr-code-outline" size={22} color={colors.background} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => handleGuestRestriction("les notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.background} />
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={[styles.badgeText, { color: colors.background }]}>5</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenu scrollable - ESPACEMENT RÉDUIT */}
      <ScrollView 
        style={[styles.scrollContent, { paddingTop: 0 }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContainer, { paddingTop: headerHeight - 10 }]} // Réduit de +3 à -10
      >
      {/* Modal QR Code */}
      <Modal
        transparent
        visible={showQrModal}
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.qrOverlay}>
          <View style={[styles.qrContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.qrHeaderRow}>
              <Text style={[styles.qrHeaderTitle, { color: colors.text }]}>
                {t("dashboard.qr.title")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowQrModal(false)}
                style={styles.qrCloseBtn}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.qrBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="qr-code-outline" size={220} color={colors.text} />
            </View>

            <View style={[styles.qrInfoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.qrInfoRow, { backgroundColor: colors.card }]}>
                <View
                  style={[styles.qrInfoIconBg, { backgroundColor: colors.primary + '20' }]}
                >
                  <Ionicons name="person-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.qrInfoTexts}>
                  <Text style={[styles.qrInfoLabel, { color: colors.text + "70" }]}>
                    {t("dashboard.qr.name")}
                  </Text>
                  <Text style={[styles.qrInfoValue, { color: colors.text }]}>Derly MOUPEPIDI</Text>
                </View>
              </View>

              <View style={[styles.qrInfoRow, { backgroundColor: colors.card }]}>
                <View
                  style={[styles.qrInfoIconBg, { backgroundColor: colors.card }]}
                >
                  <Ionicons name="barcode-outline" size={18} color={colors.success} />
                </View>
                <View style={styles.qrInfoTexts}>
                  <Text style={[styles.qrInfoLabel, { color: colors.text + "70" }]}>
                    {t("dashboard.qr.clientCode")}
                  </Text>
                  <Text style={[styles.qrInfoValue, { color: colors.text }]}>LP001234</Text>
                </View>
              </View>

              <View style={[styles.qrInfoRow, { backgroundColor: colors.card }]}>
                <View
                  style={[styles.qrInfoIconBg, { backgroundColor: colors.card }]}
                >
                  <Ionicons name="call-outline" size={18} color={colors.warning} />
                </View>
                <View style={styles.qrInfoTexts}>
                  <Text style={[styles.qrInfoLabel, { color: colors.text + "70" }]}>
                    {t("dashboard.qr.phone")}
                  </Text>
                  <Text style={[styles.qrInfoValue, { color: colors.text }]}>+241 77 68 38 55</Text>
                </View>
              </View>

              <View style={[styles.qrTipBox, { backgroundColor: colors.primary + '10' }]}>
                <View
                  style={[styles.qrTipIconBg, { backgroundColor: colors.primary + "20" }]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.qrTipText, { color: colors.text + "90" }]}>{t("dashboard.qr.tip")}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Carte principale - MASQUÉE EN MODE INVITÉ */}
      {!isGuestMode && (
        <View style={[styles.card, { backgroundColor: colors.card, marginTop: -15 }]}> // Réduit de 5 à -15
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, { color: colors.background }]}>DM</Text>
          </View>
          <View>
            <Text style={[styles.name, { color: colors.text }]}>Derly MOUPEPIDI</Text>
            <Text style={[styles.accountType, { color: colors.primary }]}>
              {t("dashboard.accountType.premium")}
            </Text>
          </View>
          <TouchableOpacity style={styles.eyeBtn}>
            <Ionicons name="eye-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.balanceSection}>
          <Text style={[styles.balanceLabel, { color: colors.text }]}>
            {t("dashboard.balance.label")}
          </Text>
          <Text style={[styles.balance, { color: colors.primary }]}>5 850 000 XAF</Text>
          <View style={styles.subInfo}>
            <Text style={[styles.subText, { color: colors.text }]}>{`💼 3 ${t(
              "dashboard.balance.activeAccountsLabel"
            )}`}</Text>
            <Text style={[styles.percent, { color: colors.success }]}>📈 +2.5%</Text>
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
              color={colors.primary}
            />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {t("dashboard.actions.transfer")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Accounts" as never)}
          >
            <Ionicons name="list-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {t("dashboard.actions.accounts")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Cards" as never)}
          >
            <Ionicons name="card-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {t("dashboard.actions.cards")}
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      )}

      {/* Actions rapides - EXISTANT */}
      <View style={[styles.section, { marginTop: 15, marginBottom: 2 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("dashboard.actions.quick")}</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              if (handleGuestRestriction("les virements")) return;
              navigation.navigate("Transfer" as never);
            }}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: colors.card }]}
            >
              <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>
              {t("dashboard.quick.transfer")}
            </Text>
            <Text style={[styles.quickActionSubtitle, { color: colors.primary }]}>
              {t("dashboard.quick.transfer.subtitle")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              if (handleGuestRestriction("les bénéficiaires")) return;
              navigation.navigate("BeneficiairesPage" as never);
            }}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: colors.card }]}
            >
              <Ionicons name="people-outline" size={24} color={colors.success} />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>
              {t("dashboard.quick.beneficiaries")}
            </Text>
            <Text style={[styles.quickActionSubtitle, { color: colors.primary }]}>
              {t("dashboard.quick.beneficiaries.subtitle")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              if (handleGuestRestriction("les produits")) return;
              navigation.navigate("DetailsProduits" as never);
            }}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: colors.card }]}
            >
              <Ionicons name="briefcase-outline" size={24} color={colors.warning} />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>
              {t("dashboard.quick.products")}
            </Text>
            <Text style={[styles.quickActionSubtitle, { color: colors.primary }]}>
              {t("dashboard.quick.products.subtitle")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              if (handleGuestRestriction("les cartes")) return;
              navigation.navigate("Cards" as never);
            }}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: colors.card }]}
            >
              <Ionicons name="card-outline" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>
              {t("dashboard.quick.cards")}
            </Text>
            <Text style={[styles.quickActionSubtitle, { color: colors.primary }]}>
              {t("dashboard.quick.cards.subtitle")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Offres spéciales - pagination horizontale */}
      <View style={[styles.section, { marginTop: 18, marginBottom: 8 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("dashboard.offers.title")}</Text>
        </View>
        <FlatList
          data={offers}
          renderItem={renderOfferItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.offersContainer, { paddingBottom: 10 }]}
          snapToAlignment="center"
          decelerationRate="fast"
          snapToInterval={offerCardWidth + itemSpacing}
          pagingEnabled
        />
      </View>

      {/* NOUVELLE SECTION : Nos services avec défilement horizontal */}
      <View style={[styles.section, { marginTop: 18, marginBottom: 8 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("dashboard.services.title")}</Text>
        <FlatList
          ref={servicesScrollRef}
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.servicesContainer, { paddingBottom: 10 }]}
          snapToAlignment="center"
          decelerationRate="fast"
        />
      </View>

      {/* NOUVELLE SECTION : Activité récente - MASQUÉE EN MODE INVITÉ */}
      {!isGuestMode && (
        <View style={[styles.section, { marginTop: 18, marginBottom: 15 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("dashboard.recent.title")}</Text>
          <TouchableOpacity onPress={() => setShowAllTransactions(!showAllTransactions)}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              {showAllTransactions ? "Voir moins" : t("dashboard.recent.seeAll")}
            </Text>
          </TouchableOpacity>
        </View>

        <View 
          style={[
            styles.transactionsList, 
            { 
              backgroundColor: colors.card, 
              borderColor: colors.border,
              minHeight: transactions.length * 75 // Hauteur minimale basée sur le nombre de transactions
            }
          ]} 
        >
          {transactions.map((transaction, index) => (
            <View key={transaction.id}>
              <View style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    <Ionicons
                      name={transaction.icon as any}
                      size={20}
                      color={transaction.iconColor}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionType, { color: colors.text }]}>
                      {tText(transaction.type)}
                    </Text>
                    <Text style={[styles.transactionDate, { color: colors.text + "60" }]}>
                      {tText(transaction.date)}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color: transaction.amount.startsWith("+")
                        ? colors.success
                        : colors.error,
                    },
                  ]}
                >
                  {transaction.amount}
                </Text>
              </View>

              {/* Séparateur sauf pour le dernier élément */}
              {index < transactions.length - 1 && (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>
        </View>
      )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8F9FB",
    flex: 1,
    position: 'relative',
  },
  header: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: 145, // Réduit de 165 à 145
    paddingBottom: 40, // Réduit de 60 à 40
    minHeight: Dimensions.get('window').height + 60, // Réduit de +80 à +60
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
    borderRadius: 14, // Rayon encore réduit
    padding: 14, // Padding encore réduit
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
    color: "#1A1A1A",
  },
  accountType: {
    color: "#007AFF",
    fontSize: 13,
  },
  eyeBtn: {
    marginLeft: "auto",
  },
  balanceSection: {
    marginTop: 15, // Espacement réduit
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
    marginTop: 12, // Espacement réduit
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 12, // Padding réduit
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
    marginTop: 15, // Espacement réduit entre sections
    marginBottom: 5, // Espacement minimal en bas
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10, // Espacement réduit
  },
  sectionTitle: {
    marginBottom: 15,
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
    gap: 10, // Espacement réduit
  },
  quickActionCard: {
    backgroundColor: "#fff",
    borderRadius: 12, // Rayon réduit
    padding: 12, // Padding réduit
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
    paddingLeft: 0,
    paddingRight: 0,
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
    marginRight: 12,
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
    // maxHeight sera géré dynamiquement via inline style
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
    // height sera géré dynamiquement via inline style
  },
  qrOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  qrContainer: {
    width: "90%",
    backgroundColor: "#fff", // Will be overridden by inline style
    borderRadius: 20,
    padding: 16,
  },
  qrHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  qrHeaderTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A1A" }, // Will be overridden by inline style
  qrCloseBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  qrBox: {
    backgroundColor: "#fff", // Will be overridden by inline style
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0", // Will be overridden by inline style
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
    backgroundColor: "#F8F9FB", // Will be overridden by inline style
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
  qrInfoLabel: { fontSize: 12, color: "#7F8C8D" }, // Will be overridden by inline style
  qrInfoValue: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" }, // Will be overridden by inline style
  qrTipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F1F6FF", // Will be overridden by inline style
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
  qrTipText: { flex: 1, fontSize: 12, color: "#344054", lineHeight: 18 }, // Will be overridden by inline style
});
