import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Import avec les bons chemins relatifs
import { LoginScreen } from '../../modules/auth/screens/LoginScreen';
import { ForgotPasswordScreen } from '../../modules/auth/screens/ForgotPasswordScreen';
import { ChangePasswordScreen } from '../../modules/auth/screens/ChangePasswordScreen';
import { DashboardScreen } from '../../modules/dashboard/screens/DashboardScreen';
import { TransactionsScreen } from '../../modules/transactions/screens/TransactionsScreen';
import { ProductsScreen } from '../../modules/products/screens/ProductsScreen';
import { SettingsScreen } from '../../modules/settings/screens/SettingsScreen';
import { TransferScreen } from '../../modules/transactions/screens/TransferScreen';
import { useAuth } from '../hooks/useAuth';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => (
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
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Transactions" component={TransactionsScreen} />
    <Tab.Screen name="Products" component={ProductsScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen 
            name="Transfer" 
            component={TransferScreen} 
            options={{ headerShown: true, title: 'Virement' }} 
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};
