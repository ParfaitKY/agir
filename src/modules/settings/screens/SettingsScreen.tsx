import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../app/hooks/useAuth";
import { secureDeleteItem } from "../../../shared/utils/secureStorage";
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
      "Veuillez vous connecter pour accéder à cette fonctionnalité."
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
  const [currentPin, setCurrentPin] = React.useState("");
  const [newPin, setNewPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [pinError, setPinError] = React.useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [logoutProcessing, setLogoutProcessing] = React.useState<
    "normal" | "forget" | null
  >(null);

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
      const ALL_CLEAR_KEYS = [
        "auth_token",
        "user_data",
        "is_configured",
        "pin_user",
        "user_login",
        "user_firstname",
        "user_lastname",
        "user_phone",
        "user_address",
        "user_account_number",
        "user_agency",
        "user_id",
        "user_secret_key",
        "access_data",
        "client_id",
        "solde_globale",
        "compte_statistiques",
        "analyse_derniere_transaction",
      ];
      for (const k of ALL_CLEAR_KEYS) {
        try {
          await secureDeleteItem(k);
        } catch {}
      }
      try {
        if (typeof window !== "undefined") {
          window.localStorage?.clear?.();
        }
      } catch {}
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
          title: "Changer le mot de passe",
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
          title: "Mon Wallet Mobile",
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
          onPress: () => (navigation as any).navigate("Products"),
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
          title: "Mode sombre",
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
                  ? "Système"
                  : preference === "dark"
                  ? "Sombre"
                  : "Clair"}
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
          onPress: () => console.log("Confidentialité"),
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
          onPress: () => console.log("Service client"),
          showChevron: true,
        },
        {
          icon: "chatbubble-outline",
          iconColor: colors.primary,
          title: "Chat en ligne",
          onPress: () => console.log("Chat"),
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
          onPress: () => console.log("FAQ"),
          showChevron: true,
        },
        {
          icon: "warning-outline",
          iconColor: colors.primary,
          title: "Signaler un problème",
          onPress: () => console.log("Signaler"),
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text + "90" }]}>
              {tText(section.title)}
            </Text>
            <View
              style={[styles.sectionContent, { backgroundColor: colors.card }]}
            >
              {section.items.map((item, itemIndex) => {
                const restricted = isGuestMode && item.isRestricted;
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.settingItem,
                      itemIndex === section.items.length - 1 &&
                        styles.settingItemLast,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => {
                      if (restricted) {
                        guestAlert();
                        return;
                      }
                      if (item.onPress) item.onPress();
                    }}
                    activeOpacity={restricted ? 1 : 0.7}
                  >
                    <View style={styles.settingLeft}>
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={
                          restricted
                            ? colors.text + "60"
                            : item.iconColor || colors.primary
                        }
                      />
                      <Text
                        style={[
                          styles.settingTitle,
                          {
                            color: restricted
                              ? colors.text + "60"
                              : colors.text,
                          },
                        ]}
                      >
                        {tText(item.title)}
                      </Text>
                    </View>
                    {("rightElement" in item && item.rightElement) ||
                      (!restricted && item.showChevron && (
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={colors.border}
                        />
                      ))}
                    {restricted && (
                      <Ionicons
                        name="lock-closed"
                        size={20}
                        color={colors.text + "60"}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Déconnexion Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text + "90" }]}>
            {tText("DÉCONNEXION")}
          </Text>
          <View
            style={[styles.sectionContent, { backgroundColor: colors.card }]}
          >
            <TouchableOpacity
              style={[styles.settingItem, styles.settingItemLast]}
              onPress={() => setShowLogoutModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color={colors.error}
                />
                <Text
                  style={[
                    styles.settingTitle,
                    styles.logoutText,
                    { color: colors.text },
                  ]}
                >
                  {tText("Se déconnecter")}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.border}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.text }]}>
            {t("settings.version")} 1.0.0
          </Text>
          <Text style={[styles.copyrightText, { color: colors.text }]}>
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
              {t("password.change.title")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              placeholder={t("password.current")}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              placeholder={t("password.new")}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              placeholder={t("password.confirm")}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
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
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  if (newPassword.length < 6) {
                    setPasswordError(t("password.error.length"));
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setPasswordError(t("password.error.mismatch"));
                    return;
                  }
                  setPasswordError(null);
                  console.log("Change password", {
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
                  {t("common.confirm")}
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
              {t("pin.change.title")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              placeholder={t("pin.current")}
              secureTextEntry
              keyboardType="numeric"
              value={currentPin}
              onChangeText={setCurrentPin}
              maxLength={5}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              placeholder={t("pin.new.label")}
              secureTextEntry
              keyboardType="numeric"
              value={newPin}
              onChangeText={setNewPin}
              maxLength={5}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              placeholder={t("pin.confirm")}
              secureTextEntry
              keyboardType="numeric"
              value={confirmPin}
              onChangeText={setConfirmPin}
              maxLength={5}
            />
            {pinError && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {pinError}
              </Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.card }]}
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
                onPress={() => {
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
                  setPinError(null);
                  console.log("Change PIN", { currentPin, newPin });
                  setShowChangePinModal(false);
                  setCurrentPin("");
                  setNewPin("");
                  setConfirmPin("");
                }}
              >
                <Text style={[styles.actionText, { color: "#fff" }]}>
                  {t("common.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
              Choisir le thème
            </Text>
            {[
              { key: "light", label: "Clair" },
              { key: "dark", label: "Sombre" },
              { key: "system", label: "Suivre le système" },
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
                  Fermer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
    marginLeft: 20,
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: "#fff",
    marginHorizontal: 0,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#000",
    marginLeft: 16,
  },
  logoutText: {
    color: "#FF3B30",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: "#CCC",
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
