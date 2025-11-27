import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { login as loginApi, LoginPayload } from "../../services/auth/login";
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
      const body: LoginPayload = {
        LG_CODELANGUE: "fr",
        SL_LOGIN: credentials.username,
        SL_MOTPASSE: credentials.password,
        TYPEOPERATEUR: "CLIENT",
        TYPEOPERATION: "LOGIN",
        CODECRYPTAGE: "SHA256",
        TERMINALUUID: credentials.username,
      };
      const result = await loginApi(body);
      if ((result as any)?.error) {
        const err: any = (result as any).error;
        const msg =
          err?.response?.data?.message || err?.message || "Échec de connexion";
        throw new Error(msg);
      }
      const data: any = (result as any)?.data;
      const token =
        data?.token ||
        data?.jwt ||
        data?.access_token ||
        data?.data?.token ||
        data?.result?.token;
      if (!token) throw new Error("Token absent dans la réponse");
      await secureSetItem("auth_token", String(token));
      let finalUser: User | null = null;
      const saved = await secureGetItem("user_data");
      if (saved) {
        finalUser = JSON.parse(saved);
      } else {
        const fn = await secureGetItem("user_firstname");
        const ln = await secureGetItem("user_lastname");
        const name = `${fn ?? ""} ${ln ?? ""}`.trim() || credentials.username;
        finalUser = {
          id: credentials.username,
          username: credentials.username,
          name,
          email: "",
        } as User;
        await secureSetItem("user_data", JSON.stringify(finalUser));
      }
      setIsAuthenticated(true);
      if (finalUser) setUser(finalUser);
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

  // Le paramètre attendu est le PIN en clair; vérification locale via SHA-256
  const loginWithPin = async (pin: string) => {
    setIsLoading(true);
    try {
      const storedPin = await secureGetItem("pin_user");
      const userData = await secureGetItem("user_data");
      // Vérifie storedPin en clair ou déjà haché
      let matchStored = false;
      if (storedPin) {
        const isHash = /^[a-f0-9]{64}$/i.test(storedPin);
        if (isHash) {
          const hashedInput = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            pin
          );
          matchStored = storedPin === hashedInput;
        } else {
          const hashedStored = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            storedPin
          );
          const hashedInput = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            pin
          );
          matchStored = hashedStored === hashedInput;
        }
      }
      if (matchStored) {
        const lg = (await secureGetItem("user_login")) || undefined;
        if (!lg) {
          throw new Error("Identifiant utilisateur manquant");
        }
        const body: LoginPayload = {
          LG_CODELANGUE: "FR",
          SL_LOGIN: lg,
          SL_MOTPASSE: pin,
          TYPEOPERATEUR: "01",
          TYPEOPERATION: "01",
          CODECRYPTAGE: "Y}@128eVIXfoi7",
          TERMINALUUID: "",
        };
        const result: any = await loginApi(body);
        if (result?.error) {
          const err: any = result.error;
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Échec de connexion";
          throw new Error(msg);
        }
        const data: any = result?.data;
        const token =
          data?.token ||
          data?.jwt ||
          data?.access_token ||
          data?.data?.token ||
          data?.result?.token;
        if (!token) throw new Error("Token absent dans la réponse");
        await secureSetItem("auth_token", String(token));
        let finalUser: User | null = null;
        if (userData) {
          finalUser = JSON.parse(userData);
        } else {
          const fn = await secureGetItem("user_firstname");
          const ln = await secureGetItem("user_lastname");
          const name = `${fn ?? ""} ${ln ?? ""}`.trim() || lg;
          finalUser = { id: lg, username: lg, name, email: "" } as User;
          await secureSetItem("user_data", JSON.stringify(finalUser));
        }
        setIsAuthenticated(true);
        if (finalUser) setUser(finalUser);
      } else {
        throw new Error("PIN incorrect");
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
