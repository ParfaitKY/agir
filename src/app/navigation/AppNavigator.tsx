import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Import avec les bons chemins relatifs
import { LoginScreen } from '../../modules/auth/screens/LoginScreen';
import { ForgotPasswordScreen } from '../../modules/auth/screens/ForgotPasswordScreen';
import { ChangePasswordScreen } from '../../modules/auth/screens/ChangePasswordScreen';
import { DashboardScreen } from '../../modules/dashboard/screens/DashboardScreen';
import { CardsScreen } from '../../modules/cards/screens/CardsScreen';
import { TransactionsScreen } from '../../modules/transactions/screens/TransactionsScreen';
import { ProductsScreen } from '../../modules/products/screens/ProductsScreen';
import { SettingsScreen } from '../../modules/settings/screens/SettingsScreen';
import { ProfileScreen } from '../../modules/settings/screens/ProfileScreen';
import LanguageScreen from '../../modules/settings/screens/LanguageScreen';
import { TransferScreen } from '../../modules/transactions/screens/TransferScreen';
import { AccountsScreen } from '../../modules/accounts/screens/AccountsScreen';
import { AccountDetailsScreen } from '../../modules/accounts/screens/AccountDetailsScreen';
import { StatementsScreen } from '../../modules/accounts/screens/StatementsScreen';

// ✅ IMPORT CORRECT (default export)
import ProductDetailPage from '../../modules/products/screens/DetailsProduitsScreen';

import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../providers/I18nProvider';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
  const { t } = useI18n();
  return (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any;
        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Transactions':
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
            break;
          case 'Products':
            iconName = focused ? 'card' : 'card-outline';
            break;
          case 'Settings':
            iconName = focused ? 'settings' : 'settings-outline';
            break;
          default:
            iconName = 'help-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: t('tabs.dashboard') }} />
    <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ tabBarLabel: t('tabs.transactions') }} />
    <Tab.Screen name="Products" component={ProductsScreen} options={{ tabBarLabel: t('tabs.products') }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t('tabs.settings') }} />
  </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { tText } = useI18n();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {
        !isAuthenticated ? (
          <>
            <Stack.Screen name="Auth" component={LoginScreen} />
            {/* éventuellement Forget et ChangePassword */}
          </>
        ) :
          (
            <>
              {/* ✅ Un seul Main */}
              <Stack.Screen name="Main" component={MainTabs} />

              <Stack.Screen
                name="Transfer"
                component={TransferScreen}
                options={{ headerShown: true, title: tText('Virement') }}
              />

              <Stack.Screen
                name="Accounts"
                component={AccountsScreen}
                options={{ headerShown: true, title: tText('Mes Comptes') }}
              />

              <Stack.Screen
                name="AccountDetails"
                component={AccountDetailsScreen}
                options={{ headerShown: true, title: tText('Détails du compte') }}
              />

              <Stack.Screen
                name="Cards"
                component={CardsScreen}
                options={{ headerShown: true, title: tText('Mes Cartes') }}
              />

              {/* ✅ Détails Produit — accessible uniquement connecté */}
              <Stack.Screen
                name="DetailsProduits"
                component={ProductDetailPage}
                options={{ headerShown: true, title: tText('Détail du produit') }}
              />

              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ headerShown: true, title: tText('Mon Profil') }}
              />

              <Stack.Screen
                name="Language"
                component={LanguageScreen}
                options={{ headerShown: true, title: 'Langue / Language / 语言' }}
              />

              <Stack.Screen
                name="Statements"
                component={StatementsScreen}
                options={{ headerShown: false }}
              />
            </>
          )}

    </Stack.Navigator>
  );
};
