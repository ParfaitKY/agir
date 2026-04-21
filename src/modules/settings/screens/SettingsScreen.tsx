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
import { useAuth } from "../../../app/hooks/useAuth";
import { secureDeleteItem, secureGetItem, secureSetItem } from "../../../shared/utils/secureStorage";
import * as Crypto from "expo-crypto";
import { updateLogin } from "../../../services/auth/updateLogin";
import { clearAppCache } from "../../../shared/utils/cacheManager";
import { useNavigation } from "@react-navigation/native";
import { useI18n } from "../../../app/providers/I18nProvider";
import { useTheme, useThemeMode } from "../../../shared/styles/ThemeProvider";
// Intégration ThemeProvider pour le mode sombre/système

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const { preference, isDark, setPreference } = useThemeMode();
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
  type SettingsSection = { title: string; items: SettingItem[] };
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
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
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
      items: [
        {
          icon: "wallet-outline",
          iconColor: colors.primary,
          title: "Mon Wallet",
          onPress: () => (navigation as any).navigate("WalletScreens"),
          showChevron: true,
          isRestricted: true,
        },
        {
          icon: "phone-portrait-outline",
          iconColor: colors.primary,
          title: "Souscriptions Mobile",
          onPress: () => (navigation as any).navigate("WalletMobileScreens"),
          showChevron: true,
          isRestricted: true,
        },
        {
          icon: "card-outline",
          iconColor: colors.primary,
          title: "Gérer mes comptes",
          onPress: () => (navigation as any).navigate("Accounts"),
          showChevron: true,
          isRestricted: true,
        },
        {
          icon: "people-outline",
          iconColor: colors.primary,
          title: "Mes bénéficiaires",
          onPress: () => (navigation as any).navigate("BeneficiairesPage"),
          showChevron: true,
          isRestricted: true,
        },
        {
          icon: "grid-outline",
          iconColor: colors.primary,
          title: "Mes produits",
          onPress: () => setShowFeatureUnavailableModal(true),
          showChevron: true,
          isRestricted: true,
        },
      ],
    },
    {
      title: "PRÉFÉRENCES",
      items: [
        {
          icon: "notifications-outline",
          iconColor: colors.primary,
          title: "Notifications",
          rightElement: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          ),
        },
        {
          icon: "language-outline",
          iconColor: colors.primary,
          title: t("settings.language"),
          onPress: () => (navigation as any).navigate("Language"),
          showChevron: true,
        },
        {
          icon: "moon-outline",
          iconColor: colors.primary,
          title: t("settings.darkMode"),
          onPress: () => setShowThemeModal(true),
          rightElement: (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: colors.card,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 12 }}>
                {preference === "system"
                  ? t("theme.system")
                  : preference === "dark"
                    ? t("theme.dark")
                    : t("theme.light")}
              </Text>
            </View>
          ),
          showChevron: true,
        },
      ],
    },
    {
      title: "SÉCURITÉ",
      items: [
        {
          icon: "finger-print-outline",
          iconColor: colors.primary,
          title: "Authentification biométrique",
          rightElement: (
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          ),
        },
        {
          icon: "shield-checkmark-outline",
          iconColor: colors.primary,
          title: "Confidentialité",
          onPress: () => (navigation as any).navigate("PrivacySettings"),
          showChevron: true,
        },
      ],
    },
    {
      title: "SUPPORT",
      items: [
        {
          icon: "headset-outline",
          iconColor: colors.primary,
          title: "Service client",
          onPress: () => (navigation as any).navigate("CustomerSupport"),
          showChevron: true,
        },
        {
          icon: "chatbubble-outline",
          iconColor: colors.primary,
          title: "Chat en ligne",
          onPress: () => setShowChatUnavailableModal(true),
          showChevron: true,
        },
        {
          icon: "mail-outline",
          iconColor: colors.primary,
          title: "Envoyer un email",
          onPress: () => (navigation as any).navigate("EmailSupport"),
          showChevron: true,
        },
        {
          icon: "help-circle-outline",
          iconColor: colors.primary,
          title: "Centre d'aide / FAQ",
          onPress: () => (navigation as any).navigate("HelpCenter"),
          showChevron: true,
        },
        {
          icon: "warning-outline",
          iconColor: colors.primary,
          title: "Signaler un problème",
          onPress: () => (navigation as any).navigate("ReportProblem"),
          showChevron: true,
        },
      ],
    },
    {
      title: "APPLICATION",
      items: [
        {
          icon: "information-circle-outline",
          iconColor: colors.primary,
          title: "À propos",
          onPress: () => (navigation as any).navigate("AboutApp"),
          showChevron: true,
        },
        {
          icon: "document-text-outline",
          iconColor: colors.primary,
          title: "Conditions d'utilisation",
          onPress: () => (navigation as any).navigate("TermsOfUse"),
          showChevron: true,
        },
        {
          icon: "shield-outline",
          iconColor: colors.primary,
          title: "Politique de confidentialité",
          onPress: () => (navigation as any).navigate("PrivacyPolicy"),
          showChevron: true,
        },
        {
          icon: "star-outline",
          iconColor: colors.primary,
          title: "Évaluer l'application",
          onPress: () => (navigation as any).navigate("RateApp"),
          showChevron: true,
        },
        {
          icon: "share-social-outline",
          iconColor: colors.primary,
          title: "Partager l'application",
          onPress: () => (navigation as any).navigate("ShareApp"),
          showChevron: true,
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text + "50" }]}>
              {tText(section.title)}
            </Text>
            <View
              style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {section.items.map((item, itemIndex) => {
                const restricted = isGuestMode && item.isRestricted;
                const isLast = itemIndex === section.items.length - 1;
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
                    <View style={[styles.settingIconWrap, { backgroundColor: restricted ? colors.border + "40" : (item.iconColor || colors.primary) + "15" }]}>
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={restricted ? colors.text + "40" : (item.iconColor || colors.primary)}
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
          <Text style={[styles.sectionTitle, { color: colors.text + "50" }]}>
            {tText("DÉCONNEXION")}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                onPress={() => {
                  if (newPassword !== confirmPassword) {
                    setPasswordError("Les clés ne correspondent pas");
                    return;
                  }
                  setPasswordError(null);
                  console.log("Change secret key", {
                    currentPassword,
                    newPassword,
                  });
                  setShowChangePasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <Text style={[styles.actionText, { color: "#fff" }]}>
                  Confirmer
                </Text>
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
                      const userSecret = await secureGetItem("user_secret_key");
                      const storedPin = await secureGetItem("pin_user");

                      if (!userLogin) {
                        setPinError("Impossible de récupérer l'identifiant utilisateur.");
                        setLoadingPin(false);
                        return;
                      }

                      // (Optionnel) Vérification de l'ancien PIN si nécessaire
                      // Note: Ici storedPin est hashé, donc on devrait hasher currentPin pour comparer.
                      // Mais pour l'instant on fait confiance à l'utilisateur qui est déjà connecté.
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
                      // On utilise le service existant 'updateLogin' qui gère la mise à jour
                      // login + mot de passe (PIN) + clé secrète.
                      // On garde le MEME login, on change juste le PIN.
                      // On suppose que la clé secrète est requise par le serveur pour valider l'opération,
                      // donc on utilise celle stockée ou on demande à l'utilisateur de la saisir (ici on utilise celle stockée si dispo).
                      
                      // Si pas de clé secrète stockée, on pourrait bloquer ou demander à l'utilisateur, 
                      // mais essayons avec une chaîne vide ou une valeur par défaut si l'API l'accepte,
                      // ou alors on affiche une erreur.
                      const secretKeyToUse = userSecret || ""; 

                      const payload = {
                        nouveau_login: userLogin, // On ne change pas le login
                        nouveau_motpasse: newPin, // Le nouveau PIN
                        cle_secrete: secretKeyToUse,
                        code_cryptage: "Y}@128eVIXfoi7",
                        // Champs de compatibilité
                        SL_LOGIN: userLogin,
                        LOGIN: userLogin,
                      };

                      // 3. Appel API
                      // On utilise X-NO-AUTH ou le token actuel selon le besoin.
                      const token = await secureGetItem("auth_token");
                      const clientId = await secureGetItem("client_id");
                      
                      const headers = {
                         "Accept": "application/json",
                         "Content-Type": "application/json",
                         // On force l'auth si besoin, ou on laisse l'intercepteur faire
                         ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                         // IMPORTANT: Certains endpoints exigent le X-CLIENT-ID explicitement
                         ...(clientId ? { "X-CLIENT-ID": String(clientId) } : {}),
                      };

                      console.log("[Settings] Updating PIN...", { userLogin });
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

                      Alert.alert("Succès", "Votre code PIN a été modifié avec succès.");
                      
                      setShowChangePinModal(false);
                      setCurrentPin("");
                      setNewPin("");
                      setConfirmPin("");

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
