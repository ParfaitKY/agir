import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../providers/AuthProvider';
import { ThemeProvider } from '../../shared/styles/ThemeProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
};