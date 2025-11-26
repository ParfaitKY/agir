import { useState, useCallback } from "react";
import { clientByCompte } from "../../services/auth/clientByCompte";
import { secureSetItem } from "../../shared/utils/secureStorage";

export type ClientInfo = {
  id?: string;
  lastName?: string;
  firstName?: string;
  login?: string;
  agency?: string;
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

  const extractClientInfo = (raw: any): ClientInfo => {
    const source = normalizeSource(raw);
    const id =
      source?.id ?? source?.IDCLIENT ?? source?.clientId ?? source?.CLIENT_ID;
    const lastName =
      source?.NOMCLIENT ??
      source?.nom ??
      source?.lastName ??
      source?.NOM_CLIENT;
    const firstName =
      source?.PRENOMCLIENT ??
      source?.prenom ??
      source?.firstName ??
      source?.PRENOM_CLIENT;
    const login =
      source?.LOGIN ??
      source?.login ??
      source?.LOGINCLIENT ??
      source?.NUMCOMPTE;
    const agency = source?.AGENCE ?? source?.agency;
    return { id, lastName, firstName, login, agency, raw };
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
      const fullName = `${info.firstName ?? ""} ${info.lastName ?? ""}`.trim();
      const userData = {
        id: info.id ?? numero_compte,
        username: (info.login ?? numero_compte) as string,
        name: fullName || "",
        email: "",
      };
      await secureSetItem("user_data", JSON.stringify(userData));
      if (info.firstName) await secureSetItem("user_firstname", info.firstName);
      if (info.lastName) await secureSetItem("user_lastname", info.lastName);
      if (info.login) await secureSetItem("user_login", String(info.login));
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
