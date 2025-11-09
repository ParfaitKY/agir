import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProviders } from './src/app/providers/AppProviders';
import { AppNavigator } from './src/app/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="auto" />
        <AppNavigator />
      </AppProviders>
    </SafeAreaProvider>
  );
}