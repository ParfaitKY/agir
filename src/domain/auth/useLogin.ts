import { useState, useCallback } from "react";
import { login as loginApi, LoginPayload } from "../../services/auth/login";
import { secureSetItem, secureGetItem } from "../../shared/utils/secureStorage";

export type LoginResult = {
  token?: string;
  user?: {
    id: string;
    username: string;
    name: string;
    email?: string;
  };
};

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<LoginResult | null>(null);

  const loginUser = useCallback(async (payload: LoginPayload) => {
    setError(null);
    setIsLoading(true);

    try {
      const result: any = await loginApi(payload);

      if (result?.error) {
        // Si result.error est déjà une chaîne (cas géré dans services/auth/login.ts)
        if (typeof result.error === "string") {
          const msg = result.error;
          setError(msg);
          return { success: false, error: msg };
        }

        // Sinon, on tente d'extraire le message d'erreur de l'objet
        const err: any = result.error;
        const msg =
          err?.response?.data?.message || err?.message || "Échec de connexion";
        setError(msg);
        return { success: false, error: msg };
      }

      const data: any = result?.data;
      const token = data?.token || data?.jwt || data?.access_token;

      if (!token) {
        const msg = "Token absent dans la réponse";
        setError(msg);
        return { success: false, error: msg };
      }

      // Stockage sécurisé du token
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

      const agencyCode =
        pick(block, ["AG_CODEAGENCE", "CODE_AGENCE", "AGENCE", "CODEAGENCE"]) ||
        "";
      if (agencyCode) await secureSetItem("user_agency", String(agencyCode));

      const workDate =
        pick(block, [
          "JT_DATEJOURNEETRAVAIL",
          "DATE_JOURNEE_TRAVAIL",
          "DATE_TRAVAIL",
          "WORK_DATE",
        ]) || "";
      if (workDate) await secureSetItem("work_date", String(workDate));

      const fn =
        block?.CL_PRENOMCLIENT ||
        pick(block, [
          "CL_PRENOMCLIENT",
          "PRENOMCLIENT",
          "PRENOM",
          "firstName",
        ]) ||
        "";
      const ln =
        block?.CL_NOMCLIENT ||
        pick(block, ["CL_NOMCLIENT", "NOMCLIENT", "NOM", "lastName"]) ||
        "";
      const username =
        block?.SL_LOGIN ||
        pick(block, ["SL_LOGIN", "LOGIN", "login", "username"]) ||
        payload?.SL_LOGIN ||
        "";
      const name =
        `${fn} ${ln}`.trim() || block?.name || data?.name || username || "";
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
      const phone =
        pick(block, [
          "CL_TELEPHONE",
          "CL_TELEPHONECLIENT",
          "TEL",
          "PHONE",
          "MOBILE",
          "CONTACT",
        ]) || "";
      const id = data?.id || username || "";
      const userData = {
        id,
        username,
        name,
        email,
        ...(phone ? { phone } : {}),
      };
      await secureSetItem("user_data", JSON.stringify(userData));
      if (phone) await secureSetItem("user_phone", String(phone));

      const clientId =
        block?.IDCLIENT ||
        block?.CLIENT_ID ||
        pick(block, ["IDCLIENT", "CLIENT_ID", "CODECLIENT"]) ||
        data?.id;

      if (clientId) {
        await secureSetItem("client_id", String(clientId));
      }

      await secureSetItem("user_login", username);

      setUserInfo({ token, user: userData });
      return { success: true };
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Erreur réseau";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { loginUser, isLoading, error, userInfo };
};

export default useLogin;
