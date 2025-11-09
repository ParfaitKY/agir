import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    success: string;
    error: string;
    warning: string;
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#3498db',
    secondary: '#2c3e50',
    background: '#f8f9fa',
    card: '#ffffff',
    text: '#2c3e50',
    border: '#e0e0e0',
    notification: '#e74c3c',
    success: '#27ae60',
    error: '#e74c3c',
    warning: '#f39c12',
  },
};

const darkTheme: Theme = {
  colors: {
    primary: '#3498db',
    secondary: '#ecf0f1',
    background: '#121212',
    card: '#1e1e1e',
    text: '#ecf0f1',
    border: '#333333',
    notification: '#e74c3c',
    success: '#27ae60',
    error: '#e74c3c',
    warning: '#f39c12',
  },
};

const ThemeContext = createContext<Theme>(lightTheme);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};