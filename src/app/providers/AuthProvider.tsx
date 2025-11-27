import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import {
  secureGetItem,
  secureSetItem,
  secureDeleteItem,
} from "../../shared/utils/secureStorage";

interface AuthContextType {
  isAuthenticated: boolean;
  isConfigured: boolean;
  user: User | null;
  login: (credentials: LoginDTO) => Promise<void>;
  loginWithPin: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  markConfigured: (configured: boolean) => Promise<void>;
  isLoading: boolean;
}

interface LoginDTO {
  username: string;
  password: string;
}

// Typage explicite de l’utilisateur pour éviter les erreurs de forme
interface User {
  id: string;
  username: string;
  name: string;
  email: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const DEFAULT_TEST_PIN = "12345";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await secureGetItem("auth_token");
      const userData = await secureGetItem("user_data");
      const configured = await secureGetItem("is_configured");

      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      }
      setIsConfigured(!!configured && configured === "true");
    } catch (error) {
      console.error("Error checking auth status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginDTO) => {
    setIsLoading(true);
    try {
      // Simulation d'authentification
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await secureSetItem("auth_token", "mock-jwt-token");
     

      setIsAuthenticated(true); //@ts-ignore
      setUser(mockUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Supprimer TOUTES les données d'authentification
      await secureDeleteItem("auth_token");
      await secureDeleteItem("user_data");

      // Préserver la configuration pour les utilisateurs déjà inscrits
      // Ne supprimer is_configured / pin_user QUE pour le mode invité ou si l'app n'est pas configurée
      const isGuest = user?.username === "invite";
      if (isGuest || !isConfigured) {
        await secureDeleteItem("is_configured");
        await secureDeleteItem("pin_user");
        setIsConfigured(false);
      }

      // Réinitialiser l'état d'authentification
      setIsAuthenticated(false);
      setUser(null);

      console.log("=== COMPLETE LOGOUT PERFORMED ===");
      console.log("All authentication data cleared");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Le paramètre attendu est le hash SHA-256 du PIN
  const loginWithPin = async (hashedPin: string) => {
    setIsLoading(true);
    try {
      const storedPin = await secureGetItem("pin_user");
      const userData = await secureGetItem("user_data");
      // Vérifie storedPin en clair ou déjà haché
      let matchStored = false;
      if (storedPin) {
        const isHash = /^[a-f0-9]{64}$/i.test(storedPin);
        if (isHash) {
          matchStored = storedPin === hashedPin;
        } else {
          const hashedStored = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            storedPin
          );
          matchStored = hashedStored === hashedPin;
        }
      }
      const hashedDefault = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        DEFAULT_TEST_PIN
      );
      if (matchStored && userData) {
        await secureSetItem("auth_token", "pin-login-token");
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } else if (hashedPin === hashedDefault) {
        const mockUser: User = {
          id: "test",
          username: "demo",
          name: "Utilisateur Test",
          email: "test@zenith.mf",
        };
        await secureSetItem("auth_token", "pin-login-token");
        await secureSetItem("user_data", JSON.stringify(mockUser));
        setIsAuthenticated(true);
        setUser(mockUser);
      } else {
        throw new Error("PIN invalide");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const markConfigured = async (configured: boolean) => {
    await secureSetItem("is_configured", configured ? "true" : "false");
    setIsConfigured(configured);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isConfigured,
        user,
        login,
        loginWithPin,
        logout,
        markConfigured,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
