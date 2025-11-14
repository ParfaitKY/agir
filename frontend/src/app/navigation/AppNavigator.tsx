import React from "react";
import { TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
import { ProfileScreen } from "../../modules/settings/screens/ProfileScreen";
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
import PrivacyPolicyScreen from "../../modules/settings/screens/PrivacyPolicyScreen";
import EmailSupportScreen from "../../modules/settings/screens/EmailSupportScreen";
import AboutAppScreen from "../../modules/settings/screens/AboutAppScreen";
import RateAppScreen from "../../modules/settings/screens/RateAppScreen";
import ShareAppScreen from "../../modules/settings/screens/ShareAppScreen";
import TermsOfUseScreen from "../../modules/settings/screens/TermsOfUseScreen";
import SplashScreen from "../../modules/auth/screens/SplashScreen";
import InitialSetupScreen from "../../modules/auth/screens/InitialSetupScreen";
import PinLoginScreen from "../../modules/auth/screens/PinLoginScreen";
import { useTheme } from "../../shared/styles/ThemeProvider";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Tab.Navigator
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
  const { isAuthenticated } = useAuth();
  const { t, tText } = useI18n();
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Splash"
    >
      {/* Écran Splash affiché au démarrage, redirige vers Main ou Login */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="InitialSetup" component={InitialSetupScreen} />
      <Stack.Screen name="PinLogin" component={PinLoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="Transfer"
            component={TransferScreen}
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
            component={AccountsScreen}
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
            component={AccountDetailsScreen}
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
            component={CardsScreen}
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
            component={ProductDetailPage}
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
            component={BeneficiairesPage}
            options={{
              headerShown: true,
              title: "Beneficiaires",
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.primary,
            }}
          />
          <Stack.Screen
            name="WalletScreens"
            component={WalletScreens}
            options={{
              headerShown: true,
              title: "Mon Wallet",
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
              title: "Langue / Language / 语言",
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
