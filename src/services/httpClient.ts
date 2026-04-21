import axios, { AxiosInstance, AxiosResponse } from "axios";
import { secureGetItem } from "../shared/utils/secureStorage";
import { BASE_URL } from "./endpoints";
import { emit } from "../shared/utils/eventBus";

export type AuthHeaders = Record<string, string>;

export type RequestResult<T = any> = {
  data?: T;
  error?: unknown;
};

export const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Force la baseURL à chaque requête pour éviter le cache du bundler web
httpClient.interceptors.request.use((config) => {
  config.baseURL = BASE_URL;
  return config;
});

httpClient.interceptors.request.use(async (config) => {
  try {
    const noAuth =
      (config.headers as any)?.["X-NO-AUTH"] === "true" ||
      String(config.url || "").includes("/auth/client-by-compte") ||
      String(config.url || "").includes("/auth/silent-otp") ||
      String(config.url || "").includes("/auth/verify-otp");
    const token = await secureGetItem("auth_token");
    if (token && !noAuth) {
      config.headers = config.headers || {};
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
    // Sur web, supprimer X-NO-AUTH après lecture pour éviter le blocage CORS preflight
    if (typeof document !== "undefined") {
      delete (config.headers as any)["X-NO-AUTH"];
    }
    if (__DEV__) console.log("[http] request", {
      url: config.url,
      method: config.method,
    });
  } catch {}
  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    if (__DEV__) console.log("[http] response", {
      url: response.config?.url,
      status: response.status,
    });
    return response;
  },
  (error) => {
    const cfg = error?.config || {};
    if (__DEV__) console.error("[http] error", {
      url: cfg.url,
      status: error?.response?.status,
      message: error?.message,
    });
    try {
      const status = error?.response?.status;
      const msg = String(
        error?.response?.data?.message || error?.message || "",
      ).toLowerCase();
      // Détection des erreurs de token (401, 403 ou message explicite)
      const tokenIssue =
        /token/.test(msg) && /(expir|invalid|expire|invalide)/.test(msg);

      if (status === 401 || status === 403 || tokenIssue) {
        console.log("[http] Auth expired or invalid, triggering global logout");
        emit("auth:expired", { status, msg });
      }
    } catch (e) {
      console.error("[http] Error in interceptor", e);
    }
    return Promise.reject(error);
  },
);

export async function handleRequest<T = any>(
  request: Promise<AxiosResponse<T>>,
): Promise<RequestResult<T>> {
  try {
    const res = await request;
    return { data: res.data };
  } catch (err: any) {
    console.error(err?.message ?? "request_error");
    return { error: err };
  }
}

/**
 * Extrait un message d'erreur lisible depuis une erreur axios.
 * Distingue les erreurs réseau/CORS des erreurs serveur.
 */
export function extractErrorMessage(err: any, fallback = "Une erreur est survenue"): string {
  if (!err) return fallback;

  // Erreur réseau (pas de réponse du serveur — CORS, timeout, hors ligne)
  if (err.message === "Network Error" || !err.response) {
    return "Impossible de contacter le serveur. Vérifiez votre connexion.";
  }

  // Timeout
  if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
    return "La requête a pris trop de temps. Réessayez.";
  }

  // Message serveur explicite
  const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
  if (serverMsg) return String(serverMsg);

  // Code HTTP
  const status = err?.response?.status;
  if (status === 401 || status === 403) return "Session expirée. Reconnectez-vous.";
  if (status === 404) return "Ressource introuvable.";
  if (status >= 500) return "Erreur serveur. Réessayez plus tard.";

  return err?.message || fallback;
}
