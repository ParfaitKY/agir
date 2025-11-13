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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../app/hooks/useAuth";
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

  const handleLogout = async () => {
    await logout();
  };

  const settingsSections = [
    {
      title: "COMPTE",
      items: [
        {
          icon: "person-outline",
          iconColor: colors.primary,
          title: "Mon Profil",
          onPress: () => (navigation as any).navigate("Profile"),
          showChevron: true,
        },
        {
          icon: "lock-closed-outline",
          iconColor: colors.primary,
          title: "Changer le code PIN",
          onPress: () => setShowChangePinModal(true),
          showChevron: true,
        },
        {
          icon: "key-outline",
          iconColor: colors.primary,
          title: "Changer le mot de passe",
          onPress: () => setShowChangePasswordModal(true),
          showChevron: true,
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
        },
        {
          icon: "card-outline",
          iconColor: colors.primary,
          title: "Gérer mes comptes",
          onPress: () => (navigation as any).navigate("Accounts"),
          showChevron: true,
        },
        {
          icon: "people-outline",
          iconColor: colors.primary,
          title: "Mes bénéficiaires",
          onPress: () => (navigation as any).navigate("BeneficiairesPage"),
          showChevron: true,
        },
        {
          icon: "grid-outline",
          iconColor: colors.primary,
          title: "Mes produits",
          onPress: () => (navigation as any).navigate("Products"),
          showChevron: true,
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
            <Text style={[styles.sectionTitle, { color: colors.text + '90' }]}>
              {tText(section.title)}
            </Text>
            <View
              style={[styles.sectionContent, { backgroundColor: colors.card }]}
            >
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 &&
                      styles.settingItemLast,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={item.iconColor || colors.primary}
                    />
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      {tText(item.title)}
                    </Text>
                  </View>
                  {item.rightElement ||
                    (item.showChevron && (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.border}
                      />
                    ))}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Déconnexion Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text + '90' }]}>
            {tText("DÉCONNEXION")}
          </Text>
          <View
            style={[styles.sectionContent, { backgroundColor: colors.card }]}
          >
            <TouchableOpacity
              style={[styles.settingItem, styles.settingItemLast]}
              onPress={handleLogout}
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
              Changer le mot de passe
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
              placeholder="Mot de passe actuel"
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
              placeholder="Nouveau mot de passe"
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
              placeholder="Confirmer le nouveau mot de passe"
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
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  // Validation simple
                  if (newPassword.length < 6) {
                    setPasswordError(
                      "Le mot de passe doit contenir au moins 6 caractères"
                    );
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setPasswordError("Les mots de passe ne correspondent pas");
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
                  Valider
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
              Changer le code PIN
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
              placeholder="PIN actuel"
              secureTextEntry
              keyboardType="numeric"
              value={currentPin}
              onChangeText={setCurrentPin}
              maxLength={6}
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
              placeholder="Nouveau PIN (4-6 chiffres)"
              secureTextEntry
              keyboardType="numeric"
              value={newPin}
              onChangeText={setNewPin}
              maxLength={6}
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
              placeholder="Confirmer le nouveau PIN"
              secureTextEntry
              keyboardType="numeric"
              value={confirmPin}
              onChangeText={setConfirmPin}
              maxLength={6}
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
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  // Validation simple du PIN
                  const pinRegex = /^\d{4,6}$/;
                  if (!pinRegex.test(newPin)) {
                    setPinError("Le PIN doit contenir 4 à 6 chiffres");
                    return;
                  }
                  if (newPin !== confirmPin) {
                    setPinError("Les PINs ne correspondent pas");
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
                  Valider
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
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
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
