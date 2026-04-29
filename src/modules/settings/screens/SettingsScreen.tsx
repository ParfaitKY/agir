import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../app/hooks/useAuth";
import { secureDeleteItem, secureGetItem, secureSetItem } from "../../../shared/utils/secureStorage";
import * as Crypto from "expo-crypto";
import { updateLogin } from "../../../services/auth/updateLogin";
import { clearAppCache } from "../../../shared/utils/cacheManager";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme, useThemeMode } from "../../../shared/styles/ThemeProvider";

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const { preference, isDark, setPreference } = useThemeMode();
  const insets = useSafeAreaInsets();
  const isGuestMode = user?.username === "invite";
  const guestAlert = () => {
    Alert.alert(
      "Connexion requise",
      "Veuillez vous connecter pour accéder à cette fonctionnalité.",
    );
  };
  type SettingItem = {
    icon: string;
    iconColor?: string;
    title: string;
    onPress?: () => void;
    showChevron?: boolean;
    rightElement?: React.ReactNode;
    isRestricted?: boolean;
  };
  type SettingsSection = { title: string; accent: string; icon: string; items: SettingItem[] };
  // Styles statiques uniquement
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [showThemeModal, setShowThemeModal] = React.useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] =
    React.useState(false);
  const [showChangePinModal, setShowChangePinModal] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [currentPinForSecret, setCurrentPinForSecret] = React.useState(""); // PIN pour valider le changement de secret
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [showCurrentPinForSecret, setShowCurrentPinForSecret] = React.useState(false);
  const [currentPin, setCurrentPin] = React.useState("");
  const [newPin, setNewPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [pinError, setPinError] = React.useState<string | null>(null);
  const [showCurrentPin, setShowCurrentPin] = React.useState(false);
  const [showNewPin, setShowNewPin] = React.useState(false);
  const [showConfirmPin, setShowConfirmPin] = React.useState(false);
  const [showFeatureUnavailableModal, setShowFeatureUnavailableModal] =
    React.useState(false);
  const [showChatUnavailableModal, setShowChatUnavailableModal] =
    React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [logoutProcessing, setLogoutProcessing] = React.useState<
    "normal" | "forget" | null
  >(null);
  const [loadingPin, setLoadingPin] = React.useState(false);
  const [loadingPassword, setLoadingPassword] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    try {
      const isGuestMode = user?.username === "invite";
      const target = isGuestMode ? "InitialSetup" : "PinLogin";
      (navigation as any).reset({ index: 0, routes: [{ name: target }] });
    } catch (e) {
      const isGuestMode = user?.username === "invite";
      const fallback = isGuestMode ? "InitialSetup" : "PinLogin";
      (navigation as any).navigate(fallback);
    }
  };

  const handleLogoutAndForget = async () => {
    setLogoutProcessing("forget");
    try {
      await logout();

      // Use smart cache clear that preserves device_id for autoplay
      await clearAppCache();

      (navigation as any).reset({
        index: 0,
        routes: [{ name: "InitialSetup" }],
      });
    } catch (e) {
      (navigation as any).navigate("InitialSetup");
    } finally {
      setShowLogoutModal(false);
      setLogoutProcessing(null);
    }
  };

  const settingsSections: SettingsSection[] = [
    {
      title: "COMPTE",
      accent: colors.primary,
      icon: "person-circle-outline",
      items: [
        {
          icon: "person-outline",
          iconColor: colors.primary,
          title: "Mon Profil",
          onPress: () => (navigation as any).navigate("Profile"),
          showChevron: true,
          isRestricted: true,
        },
        {
          icon: "lock-closed-outline",
          iconColor: colors.primary,
          title: "Changer le code PIN",
          onPress: () => setShowChangePinModal(true),
          showChevron: true,
          isRestricted: true,
        },
        {
          icon: "key-outline",
          iconColor: colors.primary,
          title: "Changer le code secret",
          onPress: () => setShowChangePasswordModal(true),
          showChevron: true,
          isRestricted: true,
        },
      ],
    },
    {
      title: "SERVICES FINANCIERS",
      accent: colors.success,
      icon: "wallet-outline",
      items: [
        {
          icon: "wallet-outline",
          iconColor: colors.success,
          title: "Mon Wallet",
          onPress: () => (navigation as any).navigate("WalletScreens"),
          showChevron: true,
          isRestricted: true,
        },
        {
          icon: "phone-portrait-outline",
          iconColor: colors.success,
          title: "Souscriptions Mobile",
          onPress: () => (navigation as any).navigate("WalletMobileScreens"),
          showChevron: true,
          isRestricted: true,
        },
        {
          icon: "card-outline",
          iconColor: colors.success,
          title: "Gérer mes comptes",
          onPress: () => (navigation as any).navigate("Accounts"),
          showChevron: true,
          isRestricted: true,
        },
        {
          icon: "people-outline",
          iconColor: colors.success,
          title: "Mes bénéficiaires",
          onPress: () => (navigation as any).navigate("BeneficiairesPage"),
          showChevron: true,
          isRestricted: true,
        },
        {
          icon: "grid-outline",
          iconColor: colors.success,
          title: "Mes produits",
          onPress: () => setShowFeatureUnavailableModal(true),
          showChevron: true,
          isRestricted: true,
        },
      ],
    },
    {
      title: "PRÉFÉRENCES",
      accent: "#F59E0B",
      icon: "options-outline",
      items: [
        {
          icon: "notifications-outline",
          iconColor: "#F59E0B",
          title: "Notifications",
          rightElement: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: "#F59E0B" }}
              thumbColor="#fff"
            />
          ),
        },
        {
          icon: "language-outline",
          iconColor: "#F59E0B",
          title: t("settings.language"),
          onPress: () => (navigation as any).navigate("Language"),
          showChevron: true,
        },
        {
          icon: "moon-outline",
          iconColor: "#F59E0B",
          title: t("settings.darkMode"),
          onPress: () => setShowThemeModal(true),
          rightElement: (
            <View style={[st.themePill, { backgroundColor: "#F59E0B18" }]}>
              <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "700" }}>
                {preference === "system" ? t("theme.system") : preference === "dark" ? t("theme.dark") : t("theme.light")}
              </Text>
            </View>
          ),
          showChevron: true,
        },
      ],
    },
    {
      title: "SÉCURITÉ",
      accent: "#6366F1",
      icon: "shield-checkmark-outline",
      items: [
        {
          icon: "finger-print-outline",
          iconColor: "#6366F1",
          title: "Authentification biométrique",
          rightElement: (
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: colors.border, true: "#6366F1" }}
              thumbColor="#fff"
            />
          ),
        },
        {
          icon: "shield-checkmark-outline",
          iconColor: "#6366F1",
          title: "Confidentialité",
          onPress: () => (navigation as any).navigate("PrivacySettings"),
          showChevron: true,
        },
      ],
    },
    {
      title: "SUPPORT",
      accent: "#06B6D4",
      icon: "headset-outline",
      items: [
        {
          icon: "headset-outline",
          iconColor: "#06B6D4",
          title: "Service client",
          onPress: () => (navigation as any).navigate("CustomerSupport"),
          showChevron: true,
        },
        {
          icon: "chatbubble-outline",
          iconColor: "#06B6D4",
          title: "Chat en ligne",
          onPress: () => setShowChatUnavailableModal(true),
          showChevron: true,
        },
        {
          icon: "mail-outline",
          iconColor: "#06B6D4",
          title: "Envoyer un email",
          onPress: () => (navigation as any).navigate("EmailSupport"),
          showChevron: true,
        },
        {
          icon: "help-circle-outline",
          iconColor: "#06B6D4",
          title: "Centre d'aide / FAQ",
          onPress: () => (navigation as any).navigate("HelpCenter"),
          showChevron: true,
        },
        {
          icon: "warning-outline",
          iconColor: "#06B6D4",
          title: "Signaler un problème",
          onPress: () => (navigation as any).navigate("ReportProblem"),
          showChevron: true,
        },
      ],
    },
    {
      title: "APPLICATION",
      accent: "#8B5CF6",
      icon: "information-circle-outline",
      items: [
        {
          icon: "information-circle-outline",
          iconColor: "#8B5CF6",
          title: "À propos",
          onPress: () => (navigation as any).navigate("AboutApp"),
          showChevron: true,
        },
        {
          icon: "document-text-outline",
          iconColor: "#8B5CF6",
          title: "Conditions d'utilisation",
          onPress: () => (navigation as any).navigate("TermsOfUse"),
          showChevron: true,
        },
        {
          icon: "shield-outline",
          iconColor: "#8B5CF6",
          title: "Politique de confidentialité",
          onPress: () => (navigation as any).navigate("PrivacyPolicy"),
          showChevron: true,
        },
        {
          icon: "star-outline",
          iconColor: "#8B5CF6",
          title: "Évaluer l'application",
          onPress: () => (navigation as any).navigate("RateApp"),
          showChevron: true,
        },
        {
          icon: "share-social-outline",
          iconColor: "#8B5CF6",
          title: "Partager l'application",
          onPress: () => (navigation as any).navigate("ShareApp"),
          showChevron: true,
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Hero Header ── */}
      <View style={[st.hero, { backgroundColor: colors.primary, paddingTop: insets.top + 16 }]}>
        <View style={st.heroBlob1} />
        <View style={st.heroBlob2} />
        <View style={st.heroRow}>
          <View>
            <Text style={st.heroEyebrow}>CEDAICI</Text>
            <Text style={st.heroTitle}>Paramètres</Text>
          </View>
          <View style={[st.heroAvatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={st.heroAvatarText}>
              {(user?.username || user?.name || "U").slice(0, 2).toUpperCase()}
            </Text>
          </View>
        </View>
        {isGuestMode && (
          <View style={st.guestBanner}>
            <Ionicons name="information-circle-outline" size={14} color="#fff" />
            <Text style={st.guestBannerText}>Mode invité — certaines fonctions sont limitées</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            {/* Section header with accent */}
            <View style={st.sectionHead}>
              <View style={[st.sectionAccentBar, { backgroundColor: section.accent }]} />
              <View style={[st.sectionIconWrap, { backgroundColor: section.accent + "18" }]}>
                <Ionicons name={section.icon as any} size={14} color={section.accent} />
              </View>
              <Text style={[styles.sectionTitle, { color: section.accent }]}>
                {tText(section.title)}
              </Text>
            </View>
            <View
              style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: section.accent + "25" }]}
            >
              {section.items.map((item, itemIndex) => {
                const restricted = isGuestMode && item.isRestricted;
                const isLast = itemIndex === section.items.length - 1;
                const accent = item.iconColor ?? section.accent;
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.settingItem,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                    onPress={() => {
                      if (restricted) { guestAlert(); return; }
                      if (item.onPress) item.onPress();
                    }}
                    activeOpacity={restricted ? 1 : 0.7}
                  >
                    <View style={[styles.settingIconWrap, { backgroundColor: restricted ? colors.border + "40" : accent + "18" }]}>
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={restricted ? colors.text + "40" : accent}
                      />
                    </View>
                    <Text
                      style={[
                        styles.settingTitle,
                        { color: restricted ? colors.text + "50" : colors.text },
                      ]}
                    >
                      {tText(item.title)}
                    </Text>
                    <View style={styles.settingRight}>
                      {("rightElement" in item && item.rightElement) ||
                        (restricted
                          ? <Ionicons name="lock-closed" size={16} color={colors.text + "40"} />
                          : item.showChevron
                            ? <Ionicons name="chevron-forward" size={16} color={colors.text + "25"} />
                            : null
                        )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Déconnexion Section */}
        <View style={styles.section}>
          <View style={st.sectionHead}>
            <View style={[st.sectionAccentBar, { backgroundColor: colors.error }]} />
            <View style={[st.sectionIconWrap, { backgroundColor: colors.error + "18" }]}>
              <Ionicons name="log-out-outline" size={14} color={colors.error} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.error }]}>
              {tText("DÉCONNEXION")}
            </Text>
          </View>
          <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.error + "25" }]}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setShowLogoutModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconWrap, { backgroundColor: colors.error + "15" }]}>
                <Ionicons name="log-out-outline" size={18} color={colors.error} />
              </View>
              <Text style={[styles.settingTitle, { color: colors.error }]}>
                {tText("Se déconnecter")}
              </Text>
              <View style={styles.settingRight}>
                <Ionicons name="chevron-forward" size={16} color={colors.error + "50"} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <View style={[styles.versionBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={14} color={colors.text + "50"} />
            <Text style={[styles.versionText, { color: colors.text + "60" }]}>
              {t("settings.version")} 1.0.0
            </Text>
          </View>
          <Text style={[styles.copyrightText, { color: colors.text + "35" }]}>
            {t("settings.copyright")}
          </Text>
        </View>
      </ScrollView>

      {/* Modal Changer le mot de passe */}
      {/* Modal Déconnexion */}
      <Modal
        visible={showLogoutModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)" },
          ]}
        >
          <View
            style={[styles.modalContainer, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("logout.modal.title")}
            </Text>
            <View style={styles.modalActionsColumn}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.actionButtonBlock,
                  { backgroundColor: colors.primary },
                ]}
                onPress={async () => {
                  setLogoutProcessing("normal");
                  await handleLogout();
                  setShowLogoutModal(false);
                  setLogoutProcessing(null);
                }}
              >
                <Text style={[styles.actionText, { color: "#fff" }]}>
                  {t("settings.logout")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.actionButtonBlock,
                  { backgroundColor: colors.error },
                ]}
                onPress={handleLogoutAndForget}
              >
                <Text style={[styles.actionText, { color: "#fff" }]}>
                  {t("logout.modal.erase")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.actionButtonBlock,
                  { backgroundColor: colors.card },
                ]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.actionText, { color: colors.text }]}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Changer le mot de passe */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)" },
          ]}
        >
          <View
            style={[styles.modalContainer, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Changer la clé secrète
            </Text>
            
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: currentPinForSecret.length === 5 ? "#4CAF50" : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                placeholder="Code PIN actuel (requis)"
                secureTextEntry={!showCurrentPinForSecret}
                keyboardType="numeric"
                value={currentPinForSecret}
                onChangeText={setCurrentPinForSecret}
                maxLength={5}
                placeholderTextColor={colors.text + "80"}
              />
              {currentPinForSecret.length === 5 && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#4CAF50"
                  style={{ marginRight: 8 }}
                />
              )}
              <TouchableOpacity
                onPress={() => setShowCurrentPinForSecret(!showCurrentPinForSecret)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showCurrentPinForSecret ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                placeholder="Clé secrète actuelle"
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholderTextColor={colors.text + "80"}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                placeholder="Nouvelle clé secrète"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholderTextColor={colors.text + "80"}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                placeholder="Confirmer la clé secrète"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor={colors.text + "80"}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            {passwordError && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {passwordError}
              </Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={[styles.actionText, { color: colors.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={async () => {
                  if (newPassword !== confirmPassword) {
                    setPasswordError("Les clés ne correspondent pas");
                    return;
                  }
                  if (!newPassword || newPassword.length < 4) {
                    setPasswordError("La clé secrète doit contenir au moins 4 caractères");
                    return;
                  }
                  if (!currentPinForSecret || currentPinForSecret.length !== 5) {
                    setPasswordError("Veuillez saisir votre code PIN actuel (5 chiffres)");
                    return;
                  }

                  try {
                    setLoadingPassword(true);
                    setPasswordError(null);

                    // Récupérer les informations utilisateur
                    const userLogin = await secureGetItem("user_login");
                    const storedSecret = await secureGetItem("user_secret_key");
                    const storedPin = await secureGetItem("pin_user");

                    if (!userLogin) {
                      setPasswordError("Impossible de récupérer l'identifiant utilisateur.");
                      setLoadingPassword(false);
                      return;
                    }

                    // Vérifier l'ancienne clé secrète
                    if (storedSecret && storedSecret !== currentPassword) {
                      setPasswordError("La clé secrète actuelle est incorrecte.");
                      setLoadingPassword(false);
                      return;
                    }

                    // Vérifier le PIN actuel
                    if (storedPin) {
                      const isHash = /^[a-f0-9]{64}$/i.test(storedPin);
                      let pinMatch = false;
                      if (isHash) {
                        const hashedCurrentPin = await Crypto.digestStringAsync(
                          Crypto.CryptoDigestAlgorithm.SHA256,
                          currentPinForSecret
                        );
                        pinMatch = hashedCurrentPin === storedPin;
                      } else {
                        pinMatch = storedPin === currentPinForSecret;
                      }
                      
                      if (!pinMatch) {
                        setPasswordError("Le code PIN actuel est incorrect.");
                        setLoadingPassword(false);
                        return;
                      }
                    }

                    // Préparer le payload
                    const deviceId = await secureGetItem("device_id");
                    const storedClientId = await secureGetItem("client_id");
                    
                    const payload = {
                      nouveau_login: userLogin,
                      nouveau_motpasse: currentPinForSecret, // PIN actuel en clair
                      cle_secrete: newPassword, // Nouvelle clé secrète
                      device_id: deviceId || "", // Device ID requis par le serveur
                      client_id: storedClientId || "", // Client ID requis par le serveur
                      CLIENT_ID: storedClientId || "", // Variante du client_id
                      CL_IDCLIENT: storedClientId || "", // Autre variante possible
                      code_cryptage: "Y}@128eVIXfoi7",
                      // Champs de compatibilité (comme dans InitialSetupScreen)
                      SL_LOGIN: userLogin,
                      LOGIN: userLogin,
                      sl_login: userLogin,
                    };

                    // Appel API avec X-CLIENT-ID dans les headers
                    const token = await secureGetItem("auth_token");
                    
                    const headers: any = {
                      "Accept": "application/json",
                      "Content-Type": "application/json",
                      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                    };
                    
                    // Le serveur a besoin du client_id pour valider le token
                    // On l'ajoute dans les headers malgré le risque CORS
                    if (storedClientId) {
                      headers["X-CLIENT-ID"] = String(storedClientId);
                    }

                    console.log("[Settings] Updating secret key...", { userLogin, clientId: storedClientId });
                    const result: any = await updateLogin(payload, headers);

                    if (result.error) {
                      const err = result.error;
                      const msg = typeof err === 'string' ? err : (err?.response?.data?.message || err?.message || "Erreur lors de la mise à jour");
                      setPasswordError(msg);
                      setLoadingPassword(false);
                      return;
                    }

                    // Succès : Mise à jour locale
                    console.log("[Settings] Secret Key Update Success.");
                    await secureSetItem("user_secret_key", newPassword);

                    // Fermer la modale
                    setShowChangePasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setCurrentPinForSecret("");

                    // Afficher un message et forcer la reconnexion
                    Alert.alert(
                      "Succès", 
                      "Votre clé secrète a été modifiée avec succès. Vous allez être déconnecté pour appliquer les changements.",
                      [
                        {
                          text: "OK",
                          onPress: async () => {
                            try {
                              await logout();
                            } catch (e) {
                              console.error("[Settings] Logout error:", e);
                            }
                          }
                        }
                      ]
                    );

                  } catch (e: any) {
                    console.error("[Settings] Change Secret Key Error:", e);
                    setPasswordError("Une erreur est survenue : " + (e.message || "Inconnue"));
                  } finally {
                    setLoadingPassword(false);
                  }
                }}
                disabled={loadingPassword}
              >
                {loadingPassword ? (
                  <Text style={[styles.actionText, { color: "#fff" }]}>Patientez...</Text>
                ) : (
                  <Text style={[styles.actionText, { color: "#fff" }]}>
                    Confirmer
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Changer le code PIN */}
      <Modal
        visible={showChangePinModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowChangePinModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={[
              styles.modalOverlay,
              {
                backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)",
              },
            ]}
          >
            <View
              style={[styles.modalContainer, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("pin.change.title")}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor:
                      currentPin.length === 5 ? "#4CAF50" : colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <TextInput
                  style={[styles.inputField, { color: colors.text }]}
                  placeholder={t("pin.current")}
                  secureTextEntry={!showCurrentPin}
                  keyboardType="numeric"
                  value={currentPin}
                  onChangeText={setCurrentPin}
                  maxLength={5}
                  placeholderTextColor={colors.text + "80"}
                />
                {currentPin.length === 5 && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#4CAF50"
                    style={{ marginRight: 8 }}
                  />
                )}
                <TouchableOpacity
                  onPress={() => setShowCurrentPin(!showCurrentPin)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showCurrentPin ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor:
                      newPin.length === 5 ? "#4CAF50" : colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <TextInput
                  style={[styles.inputField, { color: colors.text }]}
                  placeholder={t("pin.new.label")}
                  secureTextEntry={!showNewPin}
                  keyboardType="numeric"
                  value={newPin}
                  onChangeText={setNewPin}
                  maxLength={5}
                  placeholderTextColor={colors.text + "80"}
                />
                {newPin.length === 5 && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#4CAF50"
                    style={{ marginRight: 8 }}
                  />
                )}
                <TouchableOpacity
                  onPress={() => setShowNewPin(!showNewPin)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showNewPin ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor:
                      confirmPin.length === 5 && confirmPin === newPin
                        ? "#4CAF50"
                        : colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <TextInput
                  style={[styles.inputField, { color: colors.text }]}
                  placeholder={t("pin.confirm")}
                  secureTextEntry={!showConfirmPin}
                  keyboardType="numeric"
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  maxLength={5}
                  placeholderTextColor={colors.text + "80"}
                />
                {confirmPin.length === 5 && confirmPin === newPin && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#4CAF50"
                    style={{ marginRight: 8 }}
                  />
                )}
                <TouchableOpacity
                  onPress={() => setShowConfirmPin(!showConfirmPin)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPin ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
              {pinError && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {pinError}
                </Text>
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.card },
                  ]}
                  onPress={() => setShowChangePinModal(false)}
                >
                  <Text style={[styles.actionText, { color: colors.text }]}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={async () => {
                    // Validation simple du PIN
                    const pinRegex = /^\d{5}$/;
                    if (!pinRegex.test(newPin)) {
                      setPinError(t("pin.error.length"));
                      return;
                    }
                    if (newPin !== confirmPin) {
                      setPinError(t("pin.error.mismatch"));
                      return;
                    }

                    // --- INTEGRATION CHANGEMENT DE PIN (SERVEUR + LOCAL) ---
                    try {
                      setLoadingPin(true);
                      setPinError(null);

                      // 1. Récupération des infos utilisateur nécessaires
                      const userLogin = await secureGetItem("user_login");
                      const storedPin = await secureGetItem("pin_user");

                      if (!userLogin) {
                        setPinError("Impossible de récupérer l'identifiant utilisateur.");
                        setLoadingPin(false);
                        return;
                      }

                      // Vérification de l'ancien PIN
                      if (storedPin) {
                         const isHash = /^[a-f0-9]{64}$/i.test(storedPin);
                         let match = false;
                         if (isHash) {
                            const hashedCurrent = await Crypto.digestStringAsync(
                                Crypto.CryptoDigestAlgorithm.SHA256,
                                currentPin
                            );
                            match = hashedCurrent === storedPin;
                         } else {
                            match = storedPin === currentPin; // Legacy
                         }
                         
                         if (!match) {
                            setPinError("Le code PIN actuel est incorrect.");
                            setLoadingPin(false);
                            return;
                         }
                      }

                      // 2. Préparation du Payload pour updateLogin
                      // Pour changer le PIN, on envoie la clé secrète stockée
                      const userSecret = await secureGetItem("user_secret_key");
                      const deviceId = await secureGetItem("device_id");
                      const storedClientId = await secureGetItem("client_id");
                      
                      const payload = {
                        nouveau_login: userLogin, // On ne change pas le login
                        nouveau_motpasse: newPin, // Le nouveau PIN
                        cle_secrete: userSecret || "", // Clé secrète stockée
                        device_id: deviceId || "", // Device ID requis par le serveur
                        client_id: storedClientId || "", // Client ID requis par le serveur
                        CLIENT_ID: storedClientId || "", // Variante du client_id
                        CL_IDCLIENT: storedClientId || "", // Autre variante possible
                        code_cryptage: "Y}@128eVIXfoi7",
                        // Champs de compatibilité (comme dans InitialSetupScreen)
                        SL_LOGIN: userLogin,
                        LOGIN: userLogin,
                        sl_login: userLogin,
                      };

                      // 3. Appel API avec X-CLIENT-ID dans les headers
                      const token = await secureGetItem("auth_token");
                      
                      const headers: any = {
                         "Accept": "application/json",
                         "Content-Type": "application/json",
                         ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                      };
                      
                      // Le serveur a besoin du client_id pour valider le token
                      // On l'ajoute dans les headers malgré le risque CORS
                      if (storedClientId) {
                        headers["X-CLIENT-ID"] = String(storedClientId);
                      }

                      console.log("[Settings] Updating PIN...", { userLogin, clientId: storedClientId });
                      const result: any = await updateLogin(payload, headers);

                      if (result.error) {
                        const err = result.error;
                        const msg = typeof err === 'string' ? err : (err?.response?.data?.message || err?.message || "Erreur lors de la mise à jour");
                        setPinError(msg);
                        setLoadingPin(false);
                        return;
                      }

                      // 4. Succès : Mise à jour locale
                      console.log("[Settings] PIN Update Success. Updating local storage.");
                      const hashedNewPin = await Crypto.digestStringAsync(
                        Crypto.CryptoDigestAlgorithm.SHA256,
                        newPin
                      );
                      await secureSetItem("pin_user", hashedNewPin);

                      // Fermer la modale
                      setShowChangePinModal(false);
                      setCurrentPin("");
                      setNewPin("");
                      setConfirmPin("");

                      // Afficher un message et forcer la reconnexion
                      Alert.alert(
                        "Succès", 
                        "Votre code PIN a été modifié avec succès. Vous allez être déconnecté pour appliquer les changements.",
                        [
                          {
                            text: "OK",
                            onPress: async () => {
                              try {
                                // Déconnexion pour forcer la reconnexion avec le nouveau PIN
                                await logout();
                              } catch (e) {
                                console.error("[Settings] Logout error:", e);
                              }
                            }
                          }
                        ]
                      );

                    } catch (e: any) {
                      console.error("[Settings] Change PIN Error:", e);
                      setPinError("Une erreur est survenue : " + (e.message || "Inconnue"));
                    } finally {
                      setLoadingPin(false);
                    }
                  }}
                  disabled={loadingPin}
                >
                  {loadingPin ? (
                    <Text style={[styles.actionText, { color: "#fff" }]}>Patientez...</Text>
                  ) : (
                    <Text style={[styles.actionText, { color: "#fff" }]}>
                      {t("common.confirm")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Modal Choisir le thème */}
      <Modal
        visible={showThemeModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)" },
          ]}
        >
          <View
            style={[styles.modalContainer, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("theme.choose")}
            </Text>
            {[
              { key: "light", label: t("theme.light") },
              { key: "dark", label: t("theme.dark") },
              { key: "system", label: t("theme.followSystem") },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.settingItem,
                  { borderBottomColor: colors.border },
                ]}
                onPress={async () => {
                  await setPreference(opt.key as any);
                  setShowThemeModal(false);
                }}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name={
                      opt.key === "dark"
                        ? "moon"
                        : opt.key === "light"
                          ? "sunny"
                          : "contrast-outline"
                    }
                    size={22}
                    color={colors.primary}
                  />
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {opt.label}
                  </Text>
                </View>
                {preference === opt.key ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.border}
                  />
                )}
              </TouchableOpacity>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={() => setShowThemeModal(false)}
              >
                <Text style={[styles.actionText, { color: colors.text }]}>
                  {t("common.close")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Chat Unavailable */}
      <Modal
        transparent
        visible={showChatUnavailableModal}
        animationType="fade"
        onRequestClose={() => setShowChatUnavailableModal(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)",
            },
          ]}
        >
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text, marginBottom: 0 },
                ]}
              >
                Service indisponible
              </Text>
              <TouchableOpacity
                onPress={() => setShowChatUnavailableModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, alignItems: "center" }}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={48}
                color={colors.warning || "#FFC107"}
                style={{ marginBottom: 16 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  color: colors.text,
                  textAlign: "center",
                }}
              >
                Le chat en ligne est momentanément indisponible. Veuillez
                réessayer plus tard.
              </Text>
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
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)",
            },
          ]}
        >
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text, marginBottom: 0 },
                ]}
              >
                Module indisponible
              </Text>
              <TouchableOpacity
                onPress={() => setShowFeatureUnavailableModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, alignItems: "center" }}>
              <Ionicons
                name="construct-outline"
                size={48}
                color={colors.warning || "#FFC107"}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  settingRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#FF3B30",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingBottom: 48,
    gap: 8,
  },
  versionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  versionText: {
    fontSize: 13,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: "#FAFAFA",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: "#FAFAFA",
  },
  inputField: {
    flex: 1,
    height: "100%",
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 13,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalActionsColumn: {
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonBlock: {
    alignSelf: "stretch",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  confirmButton: {
    backgroundColor: "#0066CC",
  },
  actionText: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "600",
  },
});

// ── Extra styles (inline object to avoid StyleSheet limitations with dynamic values) ──
const st = StyleSheet.create({
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    overflow: "hidden",
  },
  heroBlob1: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.07)", top: -60, right: -50,
  },
  heroBlob2: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: -20,
  },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroEyebrow: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  heroAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  heroAvatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  guestBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 14,
  },
  guestBannerText: { color: "#fff", fontSize: 12, fontWeight: "500", flex: 1 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8, marginLeft: 2 },
  sectionAccentBar: { width: 3, height: 14, borderRadius: 2 },
  sectionIconWrap: { width: 22, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  themePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
});
