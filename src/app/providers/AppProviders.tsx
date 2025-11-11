import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../providers/AuthProvider';
import { I18nProvider } from './I18nProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <I18nProvider>
      <AuthProvider>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </AuthProvider>
    </I18nProvider>
  );
};
