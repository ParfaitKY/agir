import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  Alert,
  Modal,
  StyleSheet,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Import avec les bons chemins relatifs
import { LoginScreen } from "../../modules/auth/screens/LoginScreen";
import { ForgotPasswordScreen } from "../../modules/auth/screens/ForgotPasswordScreen";
import { ChangePasswordScreen } from "../../modules/auth/screens/ChangePasswordScreen";
import { DashboardScreen } from "../../modules/dashboard/screens/DashboardScreen";
import { CardsScreen } from "../../modules/cards/screens/CardsScreen";
import { TransactionsScreen } from "../../modules/transactions/screens/TransactionsScreen";
import { ProductsScreen } from "../../modules/products/screens/ProductsScreen";
import { SettingsScreen } from "../../modules/settings/screens/SettingsScreen";
import ProfileScreen from "../../modules/settings/screens/ProfileScreen";
import LanguageScreen from "../../modules/settings/screens/LanguageScreen";
import { TransferScreen } from "../../modules/transactions/screens/TransferScreen";
import { AccountsScreen } from "../../modules/accounts/screens/AccountsScreen";
import { AccountDetailsScreen } from "../../modules/accounts/screens/AccountDetailsScreen";
import { StatementsScreen } from "../../modules/accounts/screens/StatementsScreen";

// ✅ IMPORT CORRECT (default export)
import ProductDetailPage from "../../modules/products/screens/DetailsProduitsScreen";
import BeneficiairesPage from "../../modules/dashboard/screens/BeneficiairesPage";

import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../providers/I18nProvider";
import WalletScreens from "../../modules/settings/screens/WalletScreens";
import WalletMobileScreens from "../../modules/settings/screens/WalletMobileScreens";
import WalletMobileSubscribeScreen from "../../modules/settings/screens/WalletMobileSubscribeScreen";
import WalletMobileUnsubscribeScreen from "../../modules/settings/screens/WalletMobileUnsubscribeScreen";
import WalletMobileOperationsListScreen from "../../modules/settings/screens/WalletMobileOperationsListScreen";
import PrivacyPolicyScreen from "../../modules/settings/screens/PrivacyPolicyScreen";
import EmailSupportScreen from "../../modules/settings/screens/EmailSupportScreen";
import AboutAppScreen from "../../modules/settings/screens/AboutAppScreen";
import RateAppScreen from "../../modules/settings/screens/RateAppScreen";
import ShareAppScreen from "../../modules/settings/screens/ShareAppScreen";
import { CustomerSupportScreen } from "../../modules/settings/screens/CustomerSupportScreen";
import { HelpCenterScreen } from "../../modules/settings/screens/HelpCenterScreen";
import { ReportProblemScreen } from "../../modules/settings/screens/ReportProblemScreen";
import { PrivacySettingsScreen } from "../../modules/settings/screens/PrivacySettingsScreen";
import TermsOfUseScreen from "../../modules/settings/screens/TermsOfUseScreen";
import SplashScreen from "../../modules/auth/screens/SplashScreen";
import InitialSetupScreen from "../../modules/auth/screens/InitialSetupScreen";
import PinLoginScreen from "../../modules/auth/screens/PinLoginScreen";
import PasswordRecoveryScreen from "../../modules/auth/screens/PasswordRecoveryScreen";
import OtpVerifyScreen from "../../modules/auth/screens/OtpVerifyScreen";
import { useTheme } from "../../shared/styles/ThemeProvider";
import { usePrivacy } from "../providers/PrivacyProvider";
import { AnalyticsScreen } from "../../modules/analytics/screens/AnalyticsScreen";
import { CreditSimulatorScreen } from "../../modules/credits/screens/CreditSimulatorScreen";
import { CreditRequestScreen } from "../../modules/credits/screens/CreditRequestScreen";
import { Linking } from "react-native";
import useClientByTokenV2 from "../../domain/auth/useClientByTokenV2";
import { BASE_URL } from "../../services/endpoints";
import OtpSimpleScreen from "../../modules/auth/screens/OtpSimpleScreen";

import { AccountOpeningScreen } from "../../modules/guest/screens/AccountOpeningScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Composant TabBar personnalisé pour gérer le mode invité
const CustomTabBar = ({
  state,
  descriptors,
  navigation,
  colors,
  isGuestMode,
}: any) => {
  const [showFeatureUnavailableModal, setShowFeatureUnavailableModal] =
    React.useState(false);
  const { useSafeAreaInsets } = require("react-native-safe-area-context");
  const insets = useSafeAreaInsets();

  const handleGuestRestriction = () => {
    Alert.alert(
      "Connexion requise",
      "Veuillez vous connecter pour accéder à cette fonctionnalité.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Se connecter", onPress: () => navigation.navigate("Login") },
      ],
    );
  };

  const TAB_ICONS: Record<string, [string, string]> = {
    Dashboard:    ["home",             "home-outline"],
    Transactions: ["swap-horizontal",  "swap-horizontal-outline"],
    Products:     ["card",             "card-outline"],
    Settings:     ["settings",         "settings-outline"],
  };

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingBottom: insets.bottom || 8,
        paddingTop: 8,
        paddingHorizontal: 8,
        flexDirection: "row",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: -3 },
        shadowRadius: 12,
        elevation: 12,
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;
        const [iconFocused, iconBlur] = TAB_ICONS[route.name] ?? ["help", "help-outline"];

        const restrictedScreens = ["Transactions", "Products"];
        const isRestricted = isGuestMode && restrictedScreens.includes(route.name);

        const onPress = () => {
          if (route.name === "Products") {
            setShowFeatureUnavailableModal(true);
            return;
          }
          if (isRestricted) {
            handleGuestRestriction();
          } else {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 4,
              opacity: isRestricted && route.name !== "Products" ? 0.45 : 1,
            }}
            disabled={isRestricted && route.name !== "Products"}
          >
            {/* Active pill indicator */}
            {isFocused && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  width: 32,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: colors.primary,
                }}
              />
            )}

            {/* Icon container */}
            <View
              style={{
                width: 44,
                height: 32,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isFocused ? colors.primary + "18" : "transparent",
              }}
            >
              <Ionicons
                name={(isFocused ? iconFocused : iconBlur) as any}
                size={22}
                color={isFocused ? colors.primary : colors.text + "70"}
              />
            </View>

            <Text
              style={{
                color: isFocused ? colors.primary : colors.text + "70",
                fontSize: 11,
                fontWeight: isFocused ? "700" : "500",
                marginTop: 2,
                letterSpacing: 0.2,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}

      <Modal
        transparent
        visible={showFeatureUnavailableModal}
        animationType="fade"
        onRequestClose={() => setShowFeatureUnavailableModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Module indisponible
              </Text>
              <TouchableOpacity
                onPress={() => setShowFeatureUnavailableModal(false)}
                style={styles.closeBtn}
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

const MainTabs = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isAuthenticated, user } = useAuth();

  // Détection du mode invité (username === "invite")
  const isGuestMode = isAuthenticated && user?.username === "invite";

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <CustomTabBar {...props} colors={colors} isGuestMode={isGuestMode} />
      )}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          switch (route.name) {
            case "Dashboard":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Transactions":
              iconName = focused
                ? "swap-horizontal"
                : "swap-horizontal-outline";
              break;
            case "Products":
              iconName = focused ? "card" : "card-outline";
              break;
            case "Settings":
              iconName = focused ? "settings" : "settings-outline";
              break;
            default:
              iconName = "help-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: t("tabs.dashboard") }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarLabel: t("tabs.transactions"),
          headerShown: true,
          title: t("tabs.transactions"),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={({ navigation }) => ({
          tabBarLabel: t("tabs.products"),
          headerShown: true,
          title: t("tabs.products"),
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
          },
          headerStyle: { backgroundColor: colors.card },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("Dashboard")
              }
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t("tabs.settings"),
          headerShown: true,
          title: t("tabs.settings"),
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.primary,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, user, isConfigured, logout, markConfigured } =
    useAuth();
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const isGuestMode = isAuthenticated && user?.username === "invite";
  const navigation = useNavigation<any>();
  const { fetchClientInfo } = useClientByTokenV2();
  const { privacyAccepted, privacyChecked } = usePrivacy();

  React.useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log("[DeepLink] Received:", url);

      try {
        // ── Helpers ────────────────────────────────────────────────────────
        const getParam = (key: string) => {
          const m = new RegExp(`[?&]${key}=([^&#]*)`).exec(url);
          return m ? decodeURIComponent(m[1]) : null;
        };

        const isAuthLink =
          url.includes("/auth/verify") ||
          url.includes("auth/verify") ||
          url.includes("auth-success") ||
          url.includes("mgdigitalplus.com/api/auth") ||
          url.includes("cedaici://");

        // ── CAS PRINCIPAL : tout lien d'authentification ───────────────────
        if (isAuthLink) {
          const token = getParam("token");
          const otp   = getParam("otp");
          const uid   = getParam("uid");
          const exp   = getParam("exp");

          console.log("[DeepLink] token:", token?.slice(0, 40), "| otp:", otp, "| uid:", uid);

          // Expiration
          if (exp && Date.now() / 1000 > Number(exp)) {
            Alert.alert("Lien expiré", "Veuillez demander un nouveau lien de connexion.");
            return;
          }

          // CAS A — OTP + UID présents → OtpSimpleScreen (auto-submit)
          if (otp && uid) {
            console.log("[DeepLink] CAS A → OtpSimpleScreen");
            navigation.reset({
              index: 0,
              routes: [{ name: "OtpSimple", params: { user_id: uid, debug_otp: otp, from_deeplink: true, token } }],
            });
            return;
          }

          // CAS B — Token seul → vérification serveur → Dashboard direct
          if (token) {
            console.log("[DeepLink] CAS B → fetchClientInfo");
            const clientInfo = await fetchClientInfo({ authtoken: token });
            console.log("[DeepLink] clientInfo:", JSON.stringify(clientInfo)?.slice(0, 150));

            const { secureSetItem } = require("../../shared/utils/secureStorage");

            if (clientInfo && clientInfo !== false) {
              // Normaliser la réponse
              const raw: any = clientInfo;
              const d = raw?.data ?? raw;
              const block = Array.isArray(d) ? d[0] ?? {} : (d?.data && typeof d.data === "object" ? d.data : d ?? {});

              const login    = block.SL_LOGIN ?? block.LOGIN ?? block.login ?? block.username ?? "";
              const clientId = block.CL_IDCLIENT ?? block.CL_CODECLIENT ?? block.client_id ?? "";
              const authTok  = block.access_token ?? block.token ?? block.jwt ?? token;
              const fn       = block.CL_PRENOMCLIENT ?? block.PRENOM ?? block.firstName ?? "";
              const ln       = block.CL_NOMCLIENT ?? block.NOM ?? block.lastName ?? "";
              const email    = block.CL_EMAILCLIENT ?? block.EMAIL ?? block.email ?? "";
              const phone    = block.CL_TELEPHONECLIENT ?? block.TELEPHONE ?? block.phone ?? "";
              const agency   = block.AG_CODEAGENCE ?? block.CODE_AGENCE ?? "";
              const workDate = block.JT_DATEJOURNEETRAVAIL ?? block.WORK_DATE ?? "";
              const account  = block.CO_CODECOMPTE ?? block.NUMEROCOMPTE ?? "";
              const name     = `${fn} ${ln}`.trim() || login;

              // Sauvegarder tout
              if (authTok)  await secureSetItem("auth_token", String(authTok));
              if (login)    await secureSetItem("user_login", String(login));
              if (clientId) await secureSetItem("client_id", String(clientId));
              if (email)    await secureSetItem("user_email", String(email));
              if (phone)    await secureSetItem("user_phone", String(phone));
              if (agency)   await secureSetItem("user_agency", String(agency));
              if (workDate) await secureSetItem("work_date", String(workDate));
              if (account)  await secureSetItem("user_account_number", String(account));
              await secureSetItem("user_data", JSON.stringify({ id: login, username: login, name, email }));

              await markConfigured(true);

              // OTP renvoyé par le serveur ?
              const srvOtp = raw?.otp ?? raw?.data?.otp ?? null;
              const srvUid = uid ?? raw?.uid ?? raw?.data?.uid ?? login ?? "";

              if (srvOtp && srvUid) {
                navigation.reset({ index: 0, routes: [{ name: "OtpSimple", params: { user_id: String(srvUid), debug_otp: String(srvOtp), from_deeplink: true, token } }] });
              } else if (raw?.token_info?.autoplay === false) {
                navigation.reset({ index: 0, routes: [{ name: "PinLogin" }] });
              } else {
                // ✅ Connexion directe au Dashboard
                navigation.reset({ index: 0, routes: [{ name: "Main" }] });
              }
            } else {
              // fetchClientInfo a échoué — sauvegarder le token et aller au PinLogin
              console.warn("[DeepLink] fetchClientInfo failed → PinLogin fallback");
              await secureSetItem("auth_token_init", token);
              await markConfigured(true);
              navigation.reset({ index: 0, routes: [{ name: "PinLogin" }] });
            }
            return;
          }

          // Ni token ni otp → rien à faire
          console.warn("[DeepLink] Aucun token ni OTP dans le lien");
          return;
        }

        // ── CAS SMS / WhatsApp ─────────────────────────────────────────────
        if (url.includes("verify-sms") || url.includes("sms-verify")) {
          try {
            const token = getParam("token");
            if (!token) return;
            const linkPath = url.replace(/^cedaici:\/\//, "");
            const serverUrl = `${BASE_URL}/${linkPath}`;
            const response = await fetch(serverUrl, { method: "GET", headers: { "X-NO-AUTH": "true" } });
            const data = await response.json();
            if (data?.success === true) {
              navigation.reset({ index: 0, routes: [{ name: "Main" }] });
            } else {
              Alert.alert("Lien invalide", data?.message || "Ce lien n'est plus valide.");
            }
          } catch (e) {
            console.error("[DeepLink SMS]", e);
          }
          return;
        }

        // ── CAS token générique (fallback) ─────────────────────────────────
        const fallbackToken = getParam("token");
        if (fallbackToken) {
          console.log("[DeepLink] Fallback token handler");
          const clientInfo = await fetchClientInfo({ authtoken: fallbackToken });
          if (clientInfo && clientInfo !== false) {
            const raw: any = clientInfo;
            const { secureSetItem } = require("../../shared/utils/secureStorage");
            const d = raw?.data ?? raw;
            const block = Array.isArray(d) ? d[0] ?? {} : (d?.data && typeof d.data === "object" ? d.data : d ?? {});
            const login = block.SL_LOGIN ?? block.LOGIN ?? block.login ?? block.username ?? "";
            if (login) await secureSetItem("user_login", String(login));
            const authTok = block.access_token ?? block.token ?? block.jwt ?? fallbackToken;
            if (authTok) await secureSetItem("auth_token", String(authTok));
            await secureSetItem("user_data", JSON.stringify({ id: login, username: login, name: login, email: "" }));
            await markConfigured(true);
            if (raw?.token_info?.autoplay === false) {
              navigation.reset({ index: 0, routes: [{ name: "PinLogin" }] });
            } else {
              navigation.reset({ index: 0, routes: [{ name: "Main" }] });
            }
          } else {
            await markConfigured(true);
            navigation.reset({ index: 0, routes: [{ name: "PinLogin" }] });
          }
        }

      } catch (e) {
        console.error("[DeepLink] Error:", e);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);

  React.useEffect(() => {
    try {
      if (!privacyChecked || !privacyAccepted) {
        return;
      }

      console.log(
        "[nav] appNavigator",
        JSON.stringify({ isAuthenticated, user, isGuestMode, isConfigured }),
      );
      // Redirection automatique vers PinLogin si déconnecté mais configuré
      if (!isAuthenticated && isConfigured && !isGuestMode) {
        // On utilise un setTimeout pour laisser le temps au state de se propager
        // et éviter les conflits de navigation pendant le rendu
        setTimeout(() => {
          // On vérifie si on peut naviguer vers PinLogin
          // Note: PinLogin est toujours monté dans le Stack (voir plus bas)
          if (navigation && navigation.reset) {
            navigation.reset({
              index: 0,
              routes: [{ name: "PinLogin" }],
            });
          }
        }, 100);
      } else if (!isAuthenticated && !isConfigured && !isGuestMode) {
        // Si l'utilisateur n'est pas connecté et n'est PAS configuré (cas de suppression de données),
        // on le redirige explicitement vers InitialSetup pour saisir son token.
        setTimeout(() => {
          if (navigation && navigation.reset) {
            // On ne fait le reset que si on n'est pas sur le Splash
            navigation.reset({
              index: 0,
              routes: [{ name: "InitialSetup" }],
            });
          }
        }, 100);
      }
    } catch {}
  }, [
    isAuthenticated,
    user?.username,
    isConfigured,
    privacyChecked,
    privacyAccepted,
  ]);

  if (!privacyChecked) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Splash"
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="InitialSetup" component={InitialSetupScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="OtpSimple" component={OtpSimpleScreen} />
      {!isGuestMode && (
        <Stack.Screen name="PinLogin" component={PinLoginScreen} />
      )}
      <Stack.Screen
        name="PasswordRecovery"
        component={PasswordRecoveryScreen}
        options={{
          headerShown: true,
          title: "Code de sécurité oublié",
        }}
      />
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Analytics"
            component={withGuestRestriction(AnalyticsScreen)}
            options={{
              headerShown: true,
              title: tText("Analytics"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="Transfer"
            component={withGuestRestriction(TransferScreen)}
            options={{
              headerShown: true,
              title: tText("Virement"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="Accounts"
            component={withGuestRestriction(AccountsScreen)}
            options={{
              headerShown: true,
              title: tText("Mes Comptes"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="AccountDetails"
            component={withGuestRestriction(AccountDetailsScreen)}
            options={{
              headerShown: true,
              title: tText("Détails du compte"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="Cards"
            component={withGuestRestriction(CardsScreen)}
            options={{
              headerShown: true,
              title: tText("Mes Cartes"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="DetailsProduits"
            component={withGuestRestriction(ProductDetailPage)}
            options={{
              headerShown: true,
              title: tText("Détail du produit"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="ProductsList"
            component={ProductsScreen}
            options={{
              headerShown: true,
              title: "Mes Produits",
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="BeneficiairesPage"
            component={withGuestRestriction(BeneficiairesPage)}
            options={{
              headerShown: true,
              title: tText("Bénéficiaires"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />

          <Stack.Screen
            name="CreditSimulator"
            component={withGuestRestriction(CreditSimulatorScreen)}
            options={{
              headerShown: true,
              title: t("credit.simulator.title"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
              headerTitleAlign: "center",
            }}
          />

          <Stack.Screen
            name="CreditRequest"
            component={withGuestRestriction(CreditRequestScreen)}
            options={{
              headerShown: true,
              title: t("credit.request.title"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
              headerTitleAlign: "center",
            }}
          />

          <Stack.Screen
            name="WalletScreens"
            component={withGuestRestriction(WalletScreens)}
            options={{
              headerShown: true,
              title: tText("Mon Wallet"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="WalletMobileScreens"
            component={withGuestRestriction(WalletMobileScreens)}
            options={{
              headerShown: true,
              title: tText("Mon Wallet Mobile"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="WalletMobileSubscribe"
            component={withGuestRestriction(WalletMobileSubscribeScreen)}
            options={{
              headerShown: true,
              title: t("wallet.mobile.subscribe.title"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="WalletMobileUnsubscribe"
            component={withGuestRestriction(WalletMobileUnsubscribeScreen)}
            options={{
              headerShown: true,
              title: t("wallet.mobile.unsubscribe.title"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="WalletMobileOperationsList"
            component={withGuestRestriction(WalletMobileOperationsListScreen)}
            options={{
              headerShown: true,
              title: t("wallet.mobile.operations.title"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />

          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              headerShown: true,
              title: tText("Mon Profil"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="Language"
            component={LanguageScreen}
            options={{
              headerShown: true,
              title: tText("Langue"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="Statements"
            component={StatementsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="TermsOfUse"
            component={TermsOfUseScreen}
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="EmailSupport"
            component={EmailSupportScreen}
            options={{
              headerShown: true,
              title: tText("Envoyer un email"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="AboutApp"
            component={AboutAppScreen}
            options={{
              headerShown: true,
              title: tText("settings.app.about"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="RateApp"
            component={RateAppScreen}
            options={{
              headerShown: true,
              title: tText("settings.app.rate"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="ShareApp"
            component={ShareAppScreen}
            options={{
              headerShown: true,
              title: t("settings.app.share"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="CustomerSupport"
            component={CustomerSupportScreen}
            options={{
              headerShown: true,
              title: tText("Service client"),
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="HelpCenter"
            component={HelpCenterScreen}
            options={{
              headerShown: true,
              title: "Centre d'aide",
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="ReportProblem"
            component={ReportProblemScreen}
            options={{
              headerShown: true,
              title: "Signaler un problème",
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="PrivacySettings"
            component={PrivacySettingsScreen}
            options={{
              headerShown: true,
              title: "Confidentialité",
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="AccountOpening"
            component={AccountOpeningScreen}
            options={{
              headerShown: true,
              title: "Ouvrir un compte",
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
// Wrapper de restriction pour les écrans sensibles en mode invité
const withGuestRestriction = (Component: any) => (props: any) => {
  const { isAuthenticated, user } = useAuth();
  const { colors } = useTheme();
  const { tText } = useI18n();
  const navigation = useNavigation<any>();
  const isGuestMode = isAuthenticated && user?.username === "invite";
  if (isGuestMode) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <Ionicons name="lock-closed-outline" size={48} color={colors.border} />
        <Text style={{ color: colors.text, marginTop: 8, fontWeight: "600" }}>
          {tText("Connexion requise")}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={{
            marginTop: 12,
            paddingVertical: 10,
            paddingHorizontal: 16,
            backgroundColor: colors.primary,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {tText("Se connecter")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  return <Component {...props} />;
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
