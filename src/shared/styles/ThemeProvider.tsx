import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme, Animated } from "react-native";
import * as SecureStore from "expo-secure-store";

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
    primary: "#3498db",
    secondary: "#2c3e50",
    background: "#f8f9fa",
    card: "#ffffff",
    text: "#2c3e50",
    border: "#e0e0e0",
    notification: "#e74c3c",
    success: "#27ae60",
    error: "#e74c3c",
    warning: "#f39c12",
  },
};

const darkTheme: Theme = {
  colors: {
    primary: "#3498db",
    secondary: "#ecf0f1",
    background: "#121212",
    card: "#1e1e1e",
    text: "#ecf0f1",
    border: "#333333",
    notification: "#e74c3c",
    success: "#27ae60",
    error: "#e74c3c",
    warning: "#f39c12",
  },
};

const ThemeContext = createContext<Theme>(lightTheme);

type ThemePreference = "light" | "dark" | "system";

interface ThemeModeValue {
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeModeContext = createContext<ThemeModeValue | undefined>(undefined);

const STORAGE_KEY = "APP_THEME_MODE";

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (
          mounted &&
          (saved === "light" || saved === "dark" || saved === "system")
        ) {
          setPreferenceState(saved as ThemePreference);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isDark = useMemo(() => {
    if (preference === "dark") return true;
    if (preference === "light") return false;
    return systemScheme === "dark";
  }, [preference, systemScheme]);

  const theme = isDark ? darkTheme : lightTheme;

  const setPreference = async (pref: ThemePreference) => {
    try {
      setPreferenceState(pref);
      await SecureStore.setItemAsync(STORAGE_KEY, pref);
    } catch {
      // ignore persistence errors
    }
  };

  useEffect(() => {
    // Animation douce lors du changement de thème
    fadeAnim.setValue(0.85);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, preference]);

  return (
    <ThemeContext.Provider value={theme}>
      <ThemeModeContext.Provider value={{ preference, isDark, setPreference }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {children}
        </Animated.View>
      </ThemeModeContext.Provider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (context === undefined) {
    throw new Error("useThemeMode must be used within a ThemeProvider");
  }
  return context;
};
