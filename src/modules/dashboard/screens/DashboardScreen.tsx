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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme } from "../../../shared/styles/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../app/hooks/useAuth";
import { secureGetItem } from "../../../shared/utils/secureStorage";
import QRCode from "react-native-qrcode-svg";

import { EmptyState } from "../../../shared/components/EmptyState";
import { useSoldeGlobale } from "../../../domain/compte/useSoldeGlobale";
import { useCompteStatistiques } from "../../../domain/compte/useCompteStatistiques";
import { useDernieresOperationsClient } from "../../../domain/compte/useDernieresOperationsClient";

export const DashboardScreen: React.FC = () => {
  const servicesScrollRef = useRef<FlatList>(null);
  const navigation = useNavigation();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showFeatureUnavailableModal, setShowFeatureUnavailableModal] =
    useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();

  const {
    data: soldeData,
    isLoading: loadingSolde,
    fetchData: fetchSolde,
  } = useSoldeGlobale();
  const {
    data: compteStats,
    isLoading: loadingStats,
    fetchData: fetchCompteStats,
  } = useCompteStatistiques();

  // Tentative de récupération du code client depuis les stats si disponible
  const clientCodeFromStats = compteStats?.COMPTES?.[0]?.CL_CODECLIENT;
  const {
    operations: recentOps,
    statistiques: recentStats,
    isLoading: loadingRecent,
    error: recentError,
    fetchData: fetchRecent,
  } = useDernieresOperationsClient(15);
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const isGuestMode = isAuthenticated && user?.username === "invite";
    if (isGuestMode) return;
    fetchSolde();
    fetchCompteStats();
    fetchRecent();
  }, [isAuthenticated, user?.username]);
  // Détection du mode invité (username === "invite")
  const isGuestMode = isAuthenticated && user?.username === "invite";
  const [loginDisplay, setLoginDisplay] = useState("");
  const [clientIdDisplay, setClientIdDisplay] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  React.useEffect(() => {
    const run = async () => {
      const lg = (await secureGetItem("user_login")) || "";
      setLoginDisplay(lg);
      const cid = (await secureGetItem("client_id")) || "";
      setClientIdDisplay(cid);
      const ph = (await secureGetItem("user_phone")) || "";
      setPhoneDisplay(ph);
    };
    run();
  }, []);
  const displayName = (
    loginDisplay ||
    user?.username ||
    user?.name ||
    ""
  ).trim();
  const initials = displayName
    ? displayName
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";
  const fmt = (n: any) => new Intl.NumberFormat("fr-FR").format(Number(n || 0));
  const [now, setNow] = useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Rafraîchit le solde depuis l'API et bascule la visibilité
  const toggleBalanceVisibility = async () => {
    if (handleGuestRestriction("la vérification du solde")) return;

    if (isBalanceHidden) {
      // Révéler : on rafraîchit d'abord depuis l'API
      setIsRefreshingBalance(true);
      try {
        await Promise.all([fetchSolde(), fetchCompteStats(), fetchRecent()]);
      } catch (err) {
        console.error("Erreur lors de la mise à jour du solde:", err);
      } finally {
        setIsRefreshingBalance(false);
      }
      setIsBalanceHidden(false);
    } else {
      // Cacher : pas besoin d'appel API
      setIsBalanceHidden(true);
    }
  };
  const timeText = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  const greetingText = (() => {
    const h = now.getHours();
    return h >= 5 && h < 12
      ? "Bonjour"
      : h >= 12 && h < 18
        ? "Bon après-midi"
        : h >= 18 && h < 23
          ? "Bonsoir"
          : "Bonne nuit";
  })();
  const hexToRgb = (hex: string) => {
    const h = hex.replace("#", "");
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  };
  const getBrightness = (c: string) => {
    try {
      const { r, g, b } = hexToRgb(c);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    } catch (_) {
      return 255;
    }
  };
  const headerTextColor =
    getBrightness(colors.background) < 128 ? "#FFFFFFCC" : colors.background;
  const helloFontSize = Math.round(
    Math.max(20, Math.min(26, Dimensions.get("window").width * 0.06)),
  );
  const timeFontSize = Math.round(
    Math.max(12, Math.min(14, Dimensions.get("window").width * 0.04)),
  );
  const nombreComptes = Number(
    (compteStats?.NOMBRE_COMPTES ??
      (Array.isArray(compteStats?.COMPTES)
        ? compteStats?.COMPTES?.length
        : 0)) ||
      0,
  );

  // Solde disponible réel : somme des SOLDE de chaque compte (hors montant bloqué)
  // SOLDE = solde disponible, SOLDE_GLOBAL = solde total incluant montant bloqué
  const soldeDisponible = (compteStats?.COMPTES || []).reduce(
    (sum, account) => sum + (Number(account.SOLDE) || 0),
    0,
  );

  // Fallback sur recentStats si compteStats pas encore chargé
  const soldeFromRecent = recentStats?.solde ?? (recentStats as any)?.SOLDE ?? null;

  const soldeGlobalFromStats =
    soldeDisponible > 0
      ? soldeDisponible
      : soldeFromRecent ?? 0;

  const isLoadingBalance = isRefreshingBalance || loadingSolde || loadingStats;

  // Fonction pour gérer les restrictions en mode invité
  const handleGuestRestriction = (_featureName: string) => {
    console.log("handleGuestRestriction - isGuestMode:", isGuestMode);
    if (isGuestMode) {
      Alert.alert(
        "Connexion requise",
        "Veuillez vous connecter pour accéder à cette fonctionnalité.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Se connecter",
            onPress: () => navigation.navigate("Login" as never),
          },
        ],
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

  // Calculer la valeur du QR Code
  // Utiliser l'ID client, le login ou le numéro de compte comme valeur fiable
  // L'utilisateur a précisé que CL_CODECLIENT est la clé correcte, par exemple "00007950"
  // On priorise les stats (données fraîches), puis le stockage local
  const qrValue =
    clientCodeFromStats || clientIdDisplay || loginDisplay || "INVITE";

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

  const [activeOfferIndex, setActiveOfferIndex] = useState(0);
  const offerViewabilityConfigRef = useRef({
    viewAreaCoveragePercentThreshold: 60,
  });
  const onOfferViewableItemsChanged = useRef((info: any) => {
    const idx = info?.viewableItems?.[0]?.index ?? 0;
    setActiveOfferIndex(idx);
  }).current;

  const services = [
    {
      id: 1,
      title: "Crédit Express",
      subtitle: "Prêt rapide",
      icon: "rocket-outline",
      iconColor: "#fff",
      gradientStart: colors.primary,
      gradientEnd: colors.primary + "CC",
      available: true,
      action: () => navigation.navigate("CreditRequest" as never),
    },
    {
      id: 2,
      title: "Paiement factures",
      subtitle: "Eau, électricité",
      icon: "receipt-outline",
      iconColor: "#fff",
      gradientStart: colors.success,
      gradientEnd: colors.success + "CC",
      available: false,
    },
    {
      id: 3,
      title: "Recharge",
      subtitle: "Tous opérateurs",
      icon: "phone-portrait-outline",
      iconColor: "#fff",
      gradientStart: colors.warning,
      gradientEnd: colors.warning + "CC",
      available: false,
    },
    {
      id: 4,
      title: "Assurance",
      subtitle: "Protection complète",
      icon: "shield-checkmark-outline",
      iconColor: "#fff",
      gradientStart: "#8B5CF6",
      gradientEnd: "#8B5CF6CC",
      available: false,
    },
    {
      id: 5,
      title: "Change",
      subtitle: "Taux avantageux",
      icon: "swap-horizontal",
      iconColor: "#fff",
      gradientStart: "#06B6D4",
      gradientEnd: "#06B6D4CC",
      available: false,
    },
    {
      id: 6,
      title: "Épargne+",
      subtitle: "Taux attractif",
      icon: "trending-up-outline",
      iconColor: "#fff",
      gradientStart: colors.success,
      gradientEnd: colors.success + "CC",
      available: false,
    },
    {
      id: 7,
      title: "Transfert Int.",
      subtitle: "Monde entier",
      icon: "earth-outline",
      iconColor: "#fff",
      gradientStart: "#F59E0B",
      gradientEnd: "#F59E0BCC",
      available: false,
    },
    {
      id: 8,
      title: "Tontine",
      subtitle: "Épargne groupe",
      icon: "people-outline",
      iconColor: "#fff",
      gradientStart: "#EC4899",
      gradientEnd: "#EC4899CC",
      available: false,
    },
  ];

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
        <Text style={[styles.offerTitle, { color: colors.text }]}>
          {tText(item.title)}
        </Text>
        <Text style={[styles.offerSubtitle, { color: colors.primary }]}>
          {tText(item.subtitle)}
        </Text>
        <Text style={[styles.offerDescription, { color: colors.text + "80" }]}>
          {tText(item.description)}
        </Text>
      </View>
    </View>
  );

  const renderServiceItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={[
        styles.serviceCard,
        {
          backgroundColor: colors.card,
          borderColor: item.available ? item.gradientStart + "40" : colors.border,
          marginRight: index === services.length - 1 ? 0 : 12,
        },
      ]}
      onPress={() => {
        if (!item.available) { setShowFeatureUnavailableModal(true); return; }
        item.action?.();
      }}
      activeOpacity={0.8}
    >
      {/* Colored icon area */}
      <View style={[styles.serviceIconWrap, { backgroundColor: item.gradientStart }]}>
        <Ionicons name={item.icon as any} size={22} color="#fff" />
      </View>

      {/* Text */}
      <Text style={[styles.serviceTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
        {tText(item.title)}
      </Text>
      <Text style={[styles.serviceSubtitle, { color: colors.text + "80" }]} numberOfLines={1} ellipsizeMode="tail">
        {tText(item.subtitle)}
      </Text>

      {/* Badge */}
      {item.available ? (
        <View style={[styles.serviceAvailBadge, { backgroundColor: colors.success + "20" }]}>
          <View style={[styles.serviceAvailDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.serviceAvailText, { color: colors.success }]}>Actif</Text>
        </View>
      ) : (
        <View style={[styles.serviceAvailBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.serviceAvailText, { color: colors.primary }]}>Bientôt</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header fixe avec View normale - HAUTEUR AUGMENTÉE */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.primary, paddingTop: insets.top + 20 },
        ]}
      >
        <View>
          <Text
            style={[
              styles.time,
              { color: headerTextColor, fontSize: timeFontSize },
            ]}
          >
            {timeText}
          </Text>
          <Text
            style={[
              styles.hello,
              { color: headerTextColor, fontSize: helloFontSize },
            ]}
          >
            {tText(greetingText)}
          </Text>
          <Text style={{ color: headerTextColor, fontSize: 12, marginTop: 4 }}>
            {isGuestMode
              ? t("dashboard.status.guest")
              : isAuthenticated
                ? t("dashboard.status.connected")
                : t("dashboard.status.disconnected")}
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
            <View
              style={[styles.headerIconBg, { borderColor: headerTextColor }]}
            >
              <Ionicons
                name="qr-code-outline"
                size={22}
                color={headerTextColor}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleGuestRestriction("les notifications")}
          >
            <View
              style={[styles.headerIconBg, { borderColor: headerTextColor }]}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={headerTextColor}
              />
            </View>
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={[styles.badgeText, { color: headerTextColor }]}>
                5
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenu scrollable - ESPACEMENT RÉDUIT */}
      <ScrollView
        style={[styles.scrollContent, { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: headerHeight - 10 },
        ]} // Réduit de +3 à -10
      >
        {/* Modal QR Code */}
        <Modal
          transparent
          visible={showQrModal}
          animationType="fade"
          onRequestClose={() => setShowQrModal(false)}
        >
          <View style={styles.qrOverlay}>
            <View
              style={[
                styles.qrContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
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

              <View
                style={[
                  styles.qrBox,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <QRCode
                  value={qrValue}
                  size={220}
                  backgroundColor={colors.background}
                  color={colors.text}
                />
              </View>

              <View
                style={[
                  styles.qrInfoCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View
                  style={[styles.qrInfoRow, { backgroundColor: colors.card }]}
                >
                  <View
                    style={[
                      styles.qrInfoIconBg,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.qrInfoTexts}>
                    <Text
                      style={[
                        styles.qrInfoLabel,
                        { color: colors.text + "70" },
                      ]}
                    >
                      {t("dashboard.qr.name")}
                    </Text>
                    <Text style={[styles.qrInfoValue, { color: colors.text }]}>
                      {displayName || ""}
                    </Text>
                  </View>
                </View>

                <View
                  style={[styles.qrInfoRow, { backgroundColor: colors.card }]}
                >
                  <View
                    style={[
                      styles.qrInfoIconBg,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    <Ionicons
                      name="barcode-outline"
                      size={18}
                      color={colors.success}
                    />
                  </View>
                  <View style={styles.qrInfoTexts}>
                    <Text
                      style={[
                        styles.qrInfoLabel,
                        { color: colors.text + "70" },
                      ]}
                    >
                      {t("dashboard.qr.clientCode")}
                    </Text>
                    <Text style={[styles.qrInfoValue, { color: colors.text }]}>
                      {clientCodeFromStats || clientIdDisplay || ""}
                    </Text>
                  </View>
                </View>

                <View
                  style={[styles.qrInfoRow, { backgroundColor: colors.card }]}
                >
                  <View
                    style={[
                      styles.qrInfoIconBg,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={colors.warning}
                    />
                  </View>
                  <View style={styles.qrInfoTexts}>
                    <Text
                      style={[
                        styles.qrInfoLabel,
                        { color: colors.text + "70" },
                      ]}
                    >
                      {t("dashboard.qr.phone")}
                    </Text>
                    <Text style={[styles.qrInfoValue, { color: colors.text }]}>
                      {phoneDisplay || ""}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.qrTipBox,
                    { backgroundColor: colors.primary + "10" },
                  ]}
                >
                  <View
                    style={[
                      styles.qrTipIconBg,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <Text
                    style={[styles.qrTipText, { color: colors.text + "90" }]}
                  >
                    {t("dashboard.qr.tip")}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Feature Unavailable */}
        <Modal
          transparent
          visible={showFeatureUnavailableModal}
          animationType="fade"
          onRequestClose={() => setShowFeatureUnavailableModal(false)}
        >
          <View style={styles.qrOverlay}>
            <View
              style={[
                styles.qrContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.qrHeaderRow}>
                <Text style={[styles.qrHeaderTitle, { color: colors.text }]}>
                  Module indisponible
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFeatureUnavailableModal(false)}
                  style={styles.qrCloseBtn}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 20, alignItems: "center" }}>
                <Ionicons
                  name="construct-outline"
                  size={48}
                  color={colors.warning}
                  style={{ marginBottom: 16 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.text,
                    textAlign: "center",
                  }}
                >
                  Fonctionnalité à venir
                </Text>
              </View>
            </View>
          </View>
        </Modal>

        {/* Carte principale - MASQUÉE EN MODE INVITÉ */}
        {!isGuestMode && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, marginTop: -15 },
            ]}
          >
            <View style={styles.userSection}>
              <View style={styles.avatar}>
                <Text style={[styles.avatarText, { color: colors.background }]}>
                  {initials || ""}
                </Text>
              </View>
              <View>
                <Text style={[styles.name, { color: colors.text }]}>
                  {displayName || tText("Utilisateur")}
                </Text>
                <Text style={[styles.accountType, { color: colors.primary }]}>
                  {t("dashboard.accountType.premium")}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={toggleBalanceVisibility}
                disabled={isRefreshingBalance}
              >
                {isRefreshingBalance ? (
                  <Ionicons
                    name="sync-outline"
                    size={20}
                    color={colors.primary}
                  />
                ) : (
                  <Ionicons
                    name={isBalanceHidden ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.text}
                  />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.balanceSection}>
              <Text style={[styles.balanceLabel, { color: colors.text }]}>
                {t("dashboard.balance.label")}
              </Text>
              <Text style={[styles.balance, { color: colors.primary }]}>
                {isBalanceHidden
                  ? "••••••••"
                  : isLoadingBalance
                    ? t("dashboard.loading")
                    : `${fmt(soldeGlobalFromStats)} XOF`}
              </Text>
              <View style={styles.subInfo}>
                <Text
                  style={[styles.subText, { color: colors.text }]}
                >{`💼 ${nombreComptes} ${t(
                  nombreComptes > 1
                    ? "dashboard.balance.activeAccountsLabel"
                    : "dashboard.balance.activeAccountLabel",
                )}`}</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Analytics" as never)}
                    style={{ marginLeft: 8 }}
                  >
                    <Text
                      style={[styles.seeAllText, { color: colors.primary }]}
                    >
                      {t("dashboard.recent.seeAll")}
                    </Text>
                  </TouchableOpacity>
                </View>
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
                <Ionicons
                  name="list-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  {t("dashboard.actions.accounts")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowFeatureUnavailableModal(true)}
              >
                <Ionicons
                  name="card-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  {t("dashboard.actions.cards")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Actions rapides - EXISTANT */}
        <View style={[styles.section, { marginTop: 15, marginBottom: 2 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("dashboard.actions.quick")}
            </Text>
            <View
              style={[
                styles.sectionHeaderIconBg,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Ionicons name="flash-outline" size={18} color={colors.primary} />
            </View>
          </View>
          <View style={styles.quickActions}>
            {isGuestMode && (
              <TouchableOpacity
                style={[
                  styles.quickActionCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => navigation.navigate("AccountOpening" as never)}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                  Ouvrir un compte
                </Text>
                <Text
                  style={[
                    styles.quickActionSubtitle,
                    { color: colors.primary },
                  ]}
                >
                  Devenir client
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => {
                if (handleGuestRestriction("les virements")) return;
                navigation.navigate("Transfer" as never);
              }}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                {t("dashboard.quick.transfer")}
              </Text>
              <Text
                style={[styles.quickActionSubtitle, { color: colors.primary }]}
              >
                {t("dashboard.quick.transfer.subtitle")}
              </Text>
            </TouchableOpacity>
            {!isGuestMode && (
              <TouchableOpacity
                style={[
                  styles.quickActionCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => {
                  if (handleGuestRestriction("les bénéficiaires")) return;
                  navigation.navigate("BeneficiairesPage" as never);
                }}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={24}
                    color={colors.success}
                  />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                  {t("dashboard.quick.beneficiaries")}
                </Text>
                <Text
                  style={[
                    styles.quickActionSubtitle,
                    { color: colors.primary },
                  ]}
                >
                  {t("dashboard.quick.beneficiaries.subtitle")}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.quickActionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => {
                setShowFeatureUnavailableModal(true);
              }}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={24}
                  color={colors.warning}
                />
              </View>
              <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                {t("dashboard.quick.products")}
              </Text>
              <Text
                style={[styles.quickActionSubtitle, { color: colors.primary }]}
              >
                {t("dashboard.quick.products.subtitle")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickActionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setShowFeatureUnavailableModal(true)}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                {t("dashboard.quick.cards")}
              </Text>
              <Text
                style={[styles.quickActionSubtitle, { color: colors.primary }]}
              >
                {t("dashboard.quick.cards.subtitle")}
              </Text>
            </TouchableOpacity>

            {/* NOUVELLES CARTES */}
            <TouchableOpacity
              style={[
                styles.quickActionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => {
                if (handleGuestRestriction("la demande de crédit")) return;
                navigation.navigate("CreditRequest" as never);
              }}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                {t("dashboard.quick.creditRequest")}
              </Text>
              <Text
                style={[styles.quickActionSubtitle, { color: colors.primary }]}
              >
                {t("dashboard.quick.creditRequest.subtitle")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => {
                if (handleGuestRestriction("le simulateur de crédit")) return;
                navigation.navigate("CreditSimulator" as never);
              }}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons
                  name="calculator-outline"
                  size={24}
                  color={colors.warning}
                />
              </View>
              <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                {t("dashboard.quick.creditSimulator")}
              </Text>
              <Text
                style={[styles.quickActionSubtitle, { color: colors.primary }]}
              >
                {t("dashboard.quick.creditSimulator.subtitle")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Offres spéciales - pagination horizontale */}
        <View style={[styles.section, { marginTop: 18, marginBottom: 8 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("dashboard.offers.title")}
            </Text>
            <View
              style={[
                styles.sectionHeaderIconBg,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Ionicons name="gift-outline" size={18} color={colors.primary} />
            </View>
          </View>
          <FlatList
            data={offers}
            renderItem={renderOfferItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.offersContainer,
              { paddingBottom: 10 },
            ]}
            snapToAlignment="center"
            decelerationRate="fast"
            snapToInterval={offerCardWidth + itemSpacing}
            pagingEnabled
            onViewableItemsChanged={onOfferViewableItemsChanged}
            viewabilityConfig={offerViewabilityConfigRef.current}
          />
          <View style={styles.paginationDots}>
            {offers.map((_, i) => (
              <View
                key={`dot-${i}`}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor:
                      i === activeOfferIndex ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* NOUVELLE SECTION : Nos services avec défilement horizontal */}
        <View style={[styles.section, { marginTop: 18, marginBottom: 8 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("dashboard.services.title")}
            </Text>
            <View
              style={[
                styles.sectionHeaderIconBg,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Ionicons
                name="grid-outline"
                size={18}
                color={colors.primary}
              />
            </View>
          </View>
          <FlatList
            ref={servicesScrollRef}
            data={services}
            renderItem={renderServiceItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.servicesContainer,
              { paddingBottom: 10 },
            ]}
            decelerationRate="fast"
          />
        </View>

        {/* ACTIVITÉ RÉCENTE */}
        {isAuthenticated && !isGuestMode && (
          <View style={[styles.section, { marginTop: 18, marginBottom: 15 }]}>
            {/* Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("dashboard.recent.title")}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Transactions" as never)}
                style={[styles.recentSeeAllBtn, { backgroundColor: colors.primary + "15" }]}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  {t("dashboard.recent.seeAll")}
                </Text>
                <Ionicons name="arrow-forward" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Loading skeleton */}
            {loadingRecent && (
              <View style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={[styles.recentSkeletonRow, { borderBottomColor: colors.border, borderBottomWidth: i < 3 ? 1 : 0 }]}>
                    <View style={[styles.recentSkeletonIcon, { backgroundColor: colors.border }]} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={[styles.recentSkeletonLine, { width: "60%", backgroundColor: colors.border }]} />
                      <View style={[styles.recentSkeletonLine, { width: "35%", backgroundColor: colors.border }]} />
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <View style={[styles.recentSkeletonLine, { width: 80, backgroundColor: colors.border }]} />
                      <View style={[styles.recentSkeletonLine, { width: 45, backgroundColor: colors.border }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Error */}
            {!!recentError && (
              <EmptyState type="error" message={String(recentError)} onRetry={fetchRecent} compact style={{ paddingVertical: 20 }} />
            )}

            {/* List */}
            {!loadingRecent && !recentError && (
              <View style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {recentOps.length === 0 ? (
                  <EmptyState type="empty" message={t("transactions.empty.none")} compact style={{ paddingVertical: 20 }} />
                ) : (
                  (showAllTransactions ? recentOps : recentOps.slice(0, 5)).map((op, i, arr) => {
                    const label = String(op.MC_LIBELLEOPERATION || "");
                    let creditAmount = Number(op.MC_MONTANTCREDIT || 0);
                    let debitAmount = Number(op.MC_MONTANTDEBIT || 0);

                    if (label.toUpperCase().includes("OUVERTURE") && (creditAmount > 0 || debitAmount > 0)) {
                      debitAmount = creditAmount + debitAmount;
                      creditAmount = 0;
                    }

                    let isCredit = op.MC_SENS === "C" ? true : op.MC_SENS === "D" ? false : creditAmount > 0;
                    if (label.toUpperCase().includes("OUVERTURE")) isCredit = false;
                    if (!label.toUpperCase().includes("OUVERTURE")) {
                      if (isCredit && creditAmount === 0 && debitAmount > 0) isCredit = false;
                      else if (!isCredit && debitAmount === 0 && creditAmount > 0) isCredit = true;
                    }

                    const amt = isCredit ? creditAmount : debitAmount;
                    const color = isCredit ? colors.success : colors.error;
                    const isLast = i === arr.length - 1;

                    // Icône contextuelle
                    const up = label.toUpperCase();
                    const iconName: any =
                      up.includes("VIREMENT") || up.includes("TRANSFER") ? "swap-horizontal" :
                      up.includes("RETRAIT") ? "cash-outline" :
                      up.includes("DEPOT") || up.includes("DÉPÔT") ? "arrow-down-circle-outline" :
                      up.includes("OUVERTURE") ? "folder-open-outline" :
                      up.includes("FRAIS") || up.includes("COMMISSION") ? "receipt-outline" :
                      isCredit ? "arrow-down-circle-outline" : "arrow-up-circle-outline";

                    return (
                      <View
                        key={`op-${i}`}
                        style={[
                          styles.recentRow,
                          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                        ]}
                      >
                        {/* Icon */}
                        <View style={[styles.recentIcon, { backgroundColor: color + "18" }]}>
                          <Ionicons name={iconName} size={18} color={color} />
                        </View>

                        {/* Label */}
                        <View style={styles.recentInfo}>
                          <Text numberOfLines={1} style={[styles.recentLabel, { color: colors.text }]}>
                            {label}
                          </Text>
                          <View style={styles.recentMeta}>
                            <View style={[styles.recentDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.recentMetaText, { color: colors.text + "50" }]}>
                              {isCredit ? "Crédit" : "Débit"}
                            </Text>
                          </View>
                        </View>

                        {/* Amount */}
                        <View style={styles.recentRight}>
                          <Text style={[styles.recentAmount, { color }]}>
                            {isCredit ? "+" : "-"}{fmt(amt)}
                          </Text>
                          <Text style={[styles.recentCurrency, { color: colors.text + "45" }]}>XOF</Text>
                        </View>
                      </View>
                    );
                  })
                )}

                {/* Voir plus / moins inline */}
                {recentOps.length > 5 && (
                  <TouchableOpacity
                    style={[styles.recentToggleBtn, { borderTopColor: colors.border }]}
                    onPress={() => setShowAllTransactions(!showAllTransactions)}
                  >
                    <Text style={[styles.recentToggleText, { color: colors.primary }]}>
                      {showAllTransactions ? t("dashboard.recent.seeLess") : `Voir les ${recentOps.length - 5} autres`}
                    </Text>
                    <Ionicons name={showAllTransactions ? "chevron-up" : "chevron-down"} size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
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
    position: "relative",
  },
  header: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: "absolute",
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
    minHeight: Dimensions.get("window").height + 60, // Réduit de +80 à +60
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
  headerIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
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
  sectionHeaderIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
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
    paddingRight: 0,
  },
  serviceCard: {
    borderRadius: 18,
    padding: 14,
    width: 120,
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    minHeight: 160,
    backgroundColor: "#fff",
  },
  serviceIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
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
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 3,
  },
  serviceSubtitle: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 10,
  },
  serviceAvailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: "auto",
  },
  serviceAvailDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  serviceAvailText: {
    fontSize: 9,
    fontWeight: "700",
  },
  // ACTIVITÉ RÉCENTE
  recentCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 3,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  recentIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
    gap: 4,
  },
  recentLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  recentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  recentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  recentMetaText: {
    fontSize: 11,
  },
  recentRight: {
    alignItems: "flex-end",
    gap: 3,
  },
  recentAmount: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  recentCurrency: {
    fontSize: 10,
    fontWeight: "600",
  },
  recentSeeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  recentToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  recentToggleText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // Skeleton
  recentSkeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  recentSkeletonIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  recentSkeletonLine: {
    height: 12,
    borderRadius: 6,
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
