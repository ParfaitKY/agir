import React from "react";
import {
  NavigationContainer,
  Theme as NavigationTheme,
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
import { AuthProvider } from "../providers/AuthProvider";
import { I18nProvider } from "./I18nProvider";
import { NetworkProvider } from "./NetworkProvider";
import {
  ThemeProvider,
  useTheme,
  useThemeMode,
} from "../../shared/styles/ThemeProvider";

interface AppProvidersProps {
  children: React.ReactNode;
}

const ThemedNavigation: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colors } = useTheme();
  const { isDark } = useThemeMode();
  // Extend from React Navigation's built-in themes to include required properties (e.g., fonts)
  const baseTheme = isDark ? NavigationDarkTheme : NavigationDefaultTheme;
  const navTheme: NavigationTheme = {
    ...baseTheme,
    dark: isDark,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.notification,
    },
  };
  return <NavigationContainer theme={navTheme}>{children}</NavigationContainer>;
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  React.useEffect(() => {
    try {
      // Clear web localStorage when query contains reset=1
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("reset") === "1") {
          window.localStorage?.clear?.();
        }
      }
    } catch {}
  }, []);
  return (
    <ThemeProvider>
      <I18nProvider>
        <NetworkProvider>
          <AuthProvider>
            <ThemedNavigation>{children}</ThemedNavigation>
          </AuthProvider>
        </NetworkProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};
