import React from "react";
import { TouchableOpacity, View, Text, Alert } from "react-native";
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
import TermsOfUseScreen from "../../modules/settings/screens/TermsOfUseScreen";
import SplashScreen from "../../modules/auth/screens/SplashScreen";
import InitialSetupScreen from "../../modules/auth/screens/InitialSetupScreen";
import PinLoginScreen from "../../modules/auth/screens/PinLoginScreen";
import PasswordRecoveryScreen from "../../modules/auth/screens/PasswordRecoveryScreen";
import OtpVerifyScreen from "../../modules/auth/screens/OtpVerifyScreen";
import { useTheme } from "../../shared/styles/ThemeProvider";
import { AnalyticsScreen } from "../../modules/analytics/screens/AnalyticsScreen";

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
  const handleGuestRestriction = () => {
    Alert.alert(
      "Connexion requise",
      "Veuillez vous connecter pour accéder à cette fonctionnalité.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Se connecter", onPress: () => navigation.navigate("Login") },
      ]
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingBottom: 5,
        paddingTop: 5,
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
        const iconName = options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? colors.primary : colors.text,
          size: 24,
        });

        // Liste des écrans restreints en mode invité (Settings accessible)
        const restrictedScreens = ["Transactions", "Products"];
        const isRestricted =
          isGuestMode && restrictedScreens.includes(route.name);

        const onPress = () => {
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
            style={{ flex: 1, alignItems: "center", paddingVertical: 8 }}
            disabled={isRestricted}
          >
            <View style={{ opacity: isRestricted ? 0.5 : 1 }}>{iconName}</View>
            <Text
              style={{
                color: isFocused ? colors.primary : colors.text,
                fontSize: 12,
                marginTop: 4,
                opacity: isRestricted ? 0.5 : 1,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
  const { isAuthenticated, user } = useAuth();
  const { t, tText } = useI18n();
  const { colors } = useTheme();
  const isGuestMode = isAuthenticated && user?.username === "invite";
  React.useEffect(() => {
    try {
      console.log(
        "[nav] appNavigator",
        JSON.stringify({ isAuthenticated, user, isGuestMode })
      );
    } catch {}
  }, [isAuthenticated, user?.username]);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Splash"
    >
      {/* Écran Splash affiché au démarrage, redirige vers Main ou Login */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="InitialSetup" component={InitialSetupScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      {!isGuestMode && (
        <Stack.Screen name="PinLogin" component={PinLoginScreen} />
      )}
      <Stack.Screen
        name="PasswordRecovery"
        component={PasswordRecoveryScreen}
        options={{
          headerShown: true,
          title: "Récupération de mot de passe",
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
