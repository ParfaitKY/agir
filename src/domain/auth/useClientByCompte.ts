import { useState, useCallback } from "react";
import { clientByCompte } from "../../services/auth/clientByCompte";
import { secureSetItem } from "../../shared/utils/secureStorage";

export type ClientInfo = {
  id?: string;
  IDCLIENT?: string;
  NOMCLIENT?: string;
  PRENOMCLIENT?: string;
  lastName?: string;
  firstName?: string;
  login?: string;
  agency?: string;
  NUMCOMPTE?: string;
  raw?: any;
};

type FetchPayload = { NUMCOMPTE: string };

export const useClientByCompte = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientData, setClientData] = useState<ClientInfo | null>(null);

  const normalizeSource = (raw: any) => {
    if (!raw) return null;
    const d = raw?.data ?? raw;
    if (Array.isArray(d)) return d[0] ?? null;
    if (d?.client) return d.client;
    if (d?.result) return d.result;
    if (d?.payload) return d.payload;
    if (d?.data) {
      if (Array.isArray(d.data)) return d.data[0] ?? null;
      return d.data;
    }
    return d;
  };

  const pickKeyValue = (obj: any, patterns: string[]): any => {
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

  const extractClientInfo = (raw: any): ClientInfo => {
    const source = normalizeSource(raw);
    const id =
      source?.id ??
      source?.IDCLIENT ??
      source?.clientId ??
      source?.CLIENT_ID ??
      source?.CODECLIENT;
    let lastName =
      source?.NOMCLIENT ??
      source?.NOM ??
      source?.nom ??
      source?.lastName ??
      source?.NOM_CLIENT ??
      source?.NOMS ??
      pickKeyValue(source, [
        "NOMCLIENT",
        "NOM",
        "nom",
        "lastName",
        "NOM_CLIENT",
        "NOMS",
        "NomClient",
        "nomclient",
        "CL_NOMCLIENT",
      ]);
    let firstName =
      source?.PRENOMCLIENT ??
      source?.PRENOM ??
      source?.prenom ??
      source?.firstName ??
      source?.PRENOM_CLIENT ??
      source?.PRENOMS ??
      pickKeyValue(source, [
        "PRENOMCLIENT",
        "PRENOM",
        "prenom",
        "firstName",
        "PRENOM_CLIENT",
        "PRENOMS",
        "PrenomClient",
        "prenomclient",
        "CL_PRENOMCLIENT",
      ]);
    const combined = source?.name ?? source?.FULLNAME ?? source?.NOMPRENOM;
    if ((!lastName || !firstName) && typeof combined === "string") {
      const parts = combined.trim().split(/\s+/);
      if (parts.length >= 2) {
        firstName = firstName || parts[0];
        lastName = lastName || parts.slice(1).join(" ");
      } else {
        lastName = lastName || combined;
      }
    }
    const login =
      source?.LOGIN ??
      source?.login ??
      source?.LOGINCLIENT ??
      source?.NUMCOMPTE ??
      source?.compte ??
      source?.ACCOUNT_NUMBER ??
      source?.CO_CODECOMPTE;
    const agency = source?.AGENCE ?? source?.agency;
    const NUMCOMPTE =
      source?.NUMCOMPTE ??
      source?.compte ??
      source?.ACCOUNT_NUMBER ??
      source?.CO_CODECOMPTE;
    const IDCLIENT =
      source?.IDCLIENT ?? source?.CLIENT_ID ?? source?.CODECLIENT ?? id;
    const NOMCLIENT = lastName;
    const PRENOMCLIENT = firstName;
    return {
      id,
      IDCLIENT,
      NOMCLIENT,
      PRENOMCLIENT,
      lastName,
      firstName,
      login,
      agency,
      NUMCOMPTE,
      raw,
    };
  };

  const fetchClientInfo = useCallback(async (payload: FetchPayload) => {
    setError(null);
    setIsLoading(true);
    try {
      const numero_compte = payload?.NUMCOMPTE?.trim()?.toUpperCase();
      if (!numero_compte || numero_compte.length < 8) {
        setError("Numéro de compte invalide");
        return false;
      }
      const result = await clientByCompte({ numero_compte });
      if (result.error) {
        const err: any = result.error as any;
        const serverMsg = err?.response?.data?.message || err?.message;
        setError(serverMsg || "Impossible de récupérer le client");
        return false;
      }
      if (!result.data) {
        setError("Réponse API vide");
        return false;
      }
      const info = extractClientInfo(result.data);
      if (!info) {
        setError("Client introuvable ou données manquantes");
        return false;
      }
      setClientData(info);
      const fullName = `${info.PRENOMCLIENT ?? info.firstName ?? ""} ${
        info.NOMCLIENT ?? info.lastName ?? ""
      }`.trim();
      const userData = {
        id: numero_compte,
        username: numero_compte,
        name: fullName,
        email: "",
      };
      await secureSetItem("user_data", JSON.stringify(userData));
      if (info.firstName) await secureSetItem("user_firstname", info.firstName);
      if (info.lastName) await secureSetItem("user_lastname", info.lastName);
      await secureSetItem("user_login", numero_compte);
      await secureSetItem("user_account_number", numero_compte);
      return true;
    } catch (e) {
      const msg = (e as any)?.message ?? "Erreur réseau";
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchClientInfo, isLoading, error, clientData };
};

export default useClientByCompte;
