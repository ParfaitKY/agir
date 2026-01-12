import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { login as loginApi, LoginPayload } from "../../services/auth/login";
import {
  secureGetItem,
  secureSetItem,
  secureDeleteItem,
} from "../../shared/utils/secureStorage";
import { on } from "../../shared/utils/eventBus";
import { useVerifyTokenV2 } from "../../domain/auth/useVerifyTokenV2";

interface AuthContextType {
  isAuthenticated: boolean;
  isConfigured: boolean;
  user: User | null;
  login: (credentials: LoginDTO) => Promise<void>;
  loginWithPin: (pin: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
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
  const { verifyToken } = useVerifyTokenV2();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const unsub = on("auth:expired", async () => {
      try {
        await logout();
      } catch {}
    });
    return () => {
      unsub();
    };
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const configured = await secureGetItem("is_configured");

      // Step 2: Verify Initial Token (V2 Requirement)
      // "lorsque l’utilisateur s’est déjà connecte ... il faut toujour verifirer le authtoken"
      if (configured === "true") {
        const isValid = await verifyToken();
        if (!isValid) {
          console.log("Initial Token Invalid -> Soft Logout (Pin preserved)");
          // On ne supprime pas is_configured ici, on laisse logout() gérer la déconnexion "douce"
          // pour permettre à l'utilisateur de se reconnecter avec son PIN.
          await logout();
          return;
        }
      }

      const token = await secureGetItem("auth_token");
      const userData = await secureGetItem("user_data");

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
      const normalize = (raw: any) => {
        const d = raw?.data ?? raw;
        if (Array.isArray(d)) return d[0] ?? {};
        if (Array.isArray(d?.data)) return d.data[0] ?? {};
        if (Array.isArray(d?.result)) return d.result[0] ?? {};
        if (Array.isArray(d?.payload)) return d.payload[0] ?? {};
        if (d?.data && typeof d.data === "object") return d.data;
        return d ?? {};
      };
      const pick = (obj: any, patterns: string[]) => {
        if (!obj) return undefined;
        const keys = Object.keys(obj);
        for (const p of patterns) {
          const np = p.toLowerCase().replace(/_/g, "");
          for (const k of keys) {
            const nk = k.toLowerCase().replace(/_/g, "");
            if (nk === np) return obj[k];
          }
        }
        return undefined;
      };
      const block = normalize(data);
      const fnSaved = await secureGetItem("user_firstname");
      const lnSaved = await secureGetItem("user_lastname");

      // SAUVEGARDE DU CODE CLIENT
      const clientCode =
        pick(block, [
          "CL_CODECLIENT",
          "CODECLIENT",
          "CLIENT_ID",
          "ID_CLIENT",
        ]) || "";
      if (clientCode) await secureSetItem("client_id", String(clientCode));
      const fn =
        block?.CL_PRENOMCLIENT ||
        pick(block, [
          "CL_PRENOMCLIENT",
          "PRENOMCLIENT",
          "PRENOM",
          "firstName",
        ]) ||
        fnSaved ||
        "";
      const ln =
        block?.CL_NOMCLIENT ||
        pick(block, ["CL_NOMCLIENT", "NOMCLIENT", "NOM", "lastName"]) ||
        lnSaved ||
        "";
      const username =
        block?.SL_LOGIN ||
        pick(block, ["SL_LOGIN", "LOGIN", "login", "username"]) ||
        data?.username ||
        credentials.username;
      const email =
        pick(block, [
          "CL_EMAILCLIENT",
          "CL_EMAIL",
          "EMAILCLIENT",
          "ADRESSEMAIL",
          "ADRESSE_EMAIL",
          "EMAIL",
          "MAIL",
          "E_MAIL",
        ]) ||
        data?.email ||
        (await secureGetItem("user_email")) ||
        "";
      const phone =
        pick(block, [
          "TELEPHONE",
          "TEL",
          "PHONE",
          "MOBILE",
          "GSM",
          "CONTACT",
        ]) ||
        (await secureGetItem("user_phone")) ||
        "";

      const name = `${fn} ${ln}`.trim() || data?.name || username;
      const finalUser: User = {
        id: username,
        username,
        name,
        email,
        phone,
      } as User;
      await secureSetItem("user_data", JSON.stringify(finalUser));

      const address =
        pick(block, [
          "ADRESSE",
          "ADDRESS",
          "LOCALISATION",
          "VILLE",
          "CITY",
          "LOCATION",
        ]) || "";
      if (phone) await secureSetItem("user_phone", String(phone));
      if (address) await secureSetItem("user_address", String(address));
      setIsAuthenticated(true);
      if (finalUser) setUser(finalUser);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = async () => {
    setIsLoading(true);
    try {
      const guestUser: User = {
        id: "invite",
        username: "invite",
        name: "Invité",
        email: "",
      };
      await secureSetItem("auth_token", "guest");
      await secureSetItem("user_data", JSON.stringify(guestUser));
      await secureSetItem("user_login", "invite");
      try {
        const hashedDefaultPin = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          "12345"
        );
        await secureSetItem("pin_user", hashedDefaultPin);
      } catch {}
      await secureSetItem("is_configured", "true");
      setIsAuthenticated(true);
      setUser(guestUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // 1. Suppression des données de session (Token + UserData en mémoire)
      await secureDeleteItem("auth_token");
      await secureDeleteItem("user_data");

      // 2. Vérification robuste de la configuration
      // On lit directement le storage pour éviter les problèmes d'état React obsolète
      const storedConfig = await secureGetItem("is_configured");
      const isGuest = user?.username === "invite";

      // Si c'est un invité OU que l'app n'est pas configurée, on nettoie tout
      if (isGuest || storedConfig !== "true") {
        const GUEST_CLEAR_KEYS = [
          "is_configured",
          "pin_user",
          "user_login",
          "user_firstname",
          "user_lastname",
          "user_phone",
          "user_address",
          "user_account_number",
          "user_agency",
          "user_id",
          "user_secret_key",
          "access_data",
          "client_id",
          "solde_globale",
          "compte_statistiques",
          "analyse_derniere_transaction",
        ];
        for (const k of GUEST_CLEAR_KEYS) {
          try {
            await secureDeleteItem(k);
          } catch {}
        }
        try {
          if (typeof window !== "undefined") {
            window.localStorage?.clear?.();
          }
        } catch {}
        setIsConfigured(false);
      } else {
        // Sinon (Mode Connecté standard), on GARDE is_configured et pin_user
        // On s'assure que l'état reflète bien la configuration
        setIsConfigured(true);
      }

      // 3. Réinitialisation de l'état d'authentification
      setIsAuthenticated(false);
      setUser(null);

      console.log("=== LOGOUT PERFORMED ===");
      console.log(
        storedConfig === "true"
          ? "Soft Logout (Pin preserved)"
          : "Hard Logout (Data wiped)"
      );
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

      // Si aucun PIN n'est stocké localement (cas de réinstallation ou suppression de données),
      // on tente une authentification serveur directe (mode restauration).
      if (!storedPin) {
        console.log(
          "No stored PIN found. Attempting server verification for restoration."
        );
        // On continue sans vérification locale matchStored
      }

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
      } else {
        // Mode restauration : on suppose que c'est bon pour laisser le serveur décider
        matchStored = true;
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
          // Si on était en mode restauration et que ça échoue, c'est que le PIN est vraiment faux
          throw new Error(msg);
        }

        // Si succès et qu'on n'avait pas de PIN stocké, on le sauvegarde (Restauration)
        if (!storedPin) {
          const hashedNewPin = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            pin
          );
          await secureSetItem("pin_user", hashedNewPin);
          await secureSetItem("is_configured", "true");
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
        const normalize = (raw: any) => {
          const d = raw?.data ?? raw;
          if (Array.isArray(d)) return d[0] ?? {};
          if (Array.isArray(d?.data)) return d.data[0] ?? {};
          if (Array.isArray(d?.result)) return d.result[0] ?? {};
          if (Array.isArray(d?.payload)) return d.payload[0] ?? {};
          if (d?.data && typeof d.data === "object") return d.data;
          return d ?? {};
        };
        const pick = (obj: any, patterns: string[]) => {
          if (!obj) return undefined;
          const keys = Object.keys(obj);
          for (const p of patterns) {
            const np = p.toLowerCase().replace(/_/g, "");
            for (const k of keys) {
              const nk = k.toLowerCase().replace(/_/g, "");
              if (nk === np) return obj[k];
            }
          }
          return undefined;
        };
        const block = normalize(data);
        let finalUser: User | null = null;
        if (userData) {
          finalUser = JSON.parse(userData);
        } else {
          const fnSaved = await secureGetItem("user_firstname");
          const lnSaved = await secureGetItem("user_lastname");
          const fn =
            block?.CL_PRENOMCLIENT ||
            pick(block, [
              "CL_PRENOMCLIENT",
              "PRENOMCLIENT",
              "PRENOM",
              "firstName",
            ]) ||
            fnSaved ||
            "";
          const ln =
            block?.CL_NOMCLIENT ||
            pick(block, ["CL_NOMCLIENT", "NOMCLIENT", "NOM", "lastName"]) ||
            lnSaved ||
            "";
          const email =
            pick(block, [
              "CL_EMAILCLIENT",
              "CL_EMAIL",
              "EMAILCLIENT",
              "ADRESSEMAIL",
              "ADRESSE_EMAIL",
              "EMAIL",
              "MAIL",
              "E_MAIL",
            ]) ||
            data?.email ||
            "";
          const name = `${fn} ${ln}`.trim() || lg;
          finalUser = { id: lg, username: lg, name, email } as User;
          await secureSetItem("user_data", JSON.stringify(finalUser));
        }
        const phone =
          pick(block, [
            "CL_TELEPHONECLIENT",
            "CONTACTCLIENT",
            "TELEPHONE",
            "TEL",
            "PHONE",
            "MOBILE",
            "GSM",
            "CONTACT",
          ]) || "";
        const address =
          pick(block, [
            "CL_ADRESSECLIENT",
            "ADRESSE",
            "ADDRESS",
            "LOCALISATION",
            "VILLE",
            "CITY",
            "LOCATION",
          ]) || "";
        if (phone) await secureSetItem("user_phone", String(phone));
        if (address) await secureSetItem("user_address", String(address));
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
        loginAsGuest,
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
