import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../providers/AuthProvider';
import { ThemeProvider } from '../../shared/styles/ThemeProvider';
import { I18nProvider } from './I18nProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            {children}
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
};
