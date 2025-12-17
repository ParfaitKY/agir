import { useState, useCallback } from "react";
import { clientByCompte } from "../../services/auth/clientByCompte";
import { secureSetItem, secureGetItem } from "../../shared/utils/secureStorage";
import { Platform } from "react-native";

export type ClientInfo = {
  id?: string;
  IDCLIENT?: string;
  NOMCLIENT?: string;
  PRENOMCLIENT?: string;
  fullName?: string;
  lastName?: string;
  firstName?: string;
  login?: string;
  agency?: string;
  NUMCOMPTE?: string;
  phone?: string;
  email?: string;
  address?: string;
  secret_key?: string;
  raw?: any;
};
//01/0/2025
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
      source?.SL_LOGIN ??
      source?.UT_LOGIN;

    const agency = source?.AGENCE ?? source?.agency;

    const NUMCOMPTE =
      source?.NUMCOMPTE ??
      source?.compte ??
      source?.ACCOUNT_NUMBER ??
      source?.CO_CODECOMPTE;

    const email =
      source?.EMAIL ??
      source?.MAIL ??
      source?.EMAILCLIENT ??
      source?.CL_EMAIL ??
      source?.EMAIL_ADDRESS ??
      source?.ADR_EMAIL ??
      pickKeyValue(source, [
        "EMAIL",
        "MAIL",
        "EMAILCLIENT",
        "CL_EMAIL",
        "EMAIL_ADDRESS",
        "ADR_EMAIL",
      ]);

    const phone =
      source?.CL_TELEPHONECLIENT ??
      source?.CONTACTCLIENT ??
      source?.TELEPHONE ??
      source?.TEL ??
      source?.PHONE ??
      source?.MOBILE ??
      source?.GSM ??
      source?.CONTACT ??
      pickKeyValue(source, [
        "CL_TELEPHONECLIENT",
        "CONTACTCLIENT",
        "TELEPHONE",
        "TEL",
        "PHONE",
        "MOBILE",
        "GSM",
        "CONTACT",
      ]);

    const address =
      source?.CL_ADRESSECLIENT ??
      source?.ADRESSE ??
      source?.ADDRESS ??
      source?.LOCALISATION ??
      source?.VILLE ??
      source?.CITY ??
      source?.LOCATION ??
      pickKeyValue(source, [
        "CL_ADRESSECLIENT",
        "ADRESSE",
        "ADDRESS",
        "LOCALISATION",
        "VILLE",
        "CITY",
        "LOCATION",
      ]);

    const secret_key =
      source?.CLE_SECRETE ??
      source?.SECRET_KEY ??
      source?.CL_CLE_SECRETE ??
      source?.CLE ??
      source?.KEY ??
      pickKeyValue(source, [
        "CLE_SECRETE",
        "SECRET_KEY",
        "CL_CLE_SECRETE",
        "CLE",
        "KEY",
      ]);

    // ✅ Ici on génère un client_id si l'API ne le renvoie pas
    const IDCLIENT =
      source?.IDCLIENT ??
      source?.CLIENT_ID ??
      source?.CODECLIENT ??
      id ??
      NUMCOMPTE;

    const NOMCLIENT = lastName;
    const PRENOMCLIENT = firstName;
    const fullName =
      `${firstName ?? ""} ${lastName ?? ""}`.trim() ||
      (typeof combined === "string" ? combined : undefined);

    return {
      id,
      IDCLIENT,
      NOMCLIENT,
      PRENOMCLIENT,
      fullName,
      lastName,
      firstName,
      login,
      agency,
      NUMCOMPTE,
      phone,
      email,
      address,
      secret_key,
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

      let device_id = await secureGetItem("device_id");
      if (!device_id) {
        const rand = Math.random().toString(36).slice(2);
        const t = Date.now().toString(36);
        device_id = `${Platform.OS}-${t}-${rand}`.toUpperCase();
        await secureSetItem("device_id", device_id);
      }
      let os = `${Platform.OS} ${Platform.Version}`;
      let brand = "Unknown";
      let model = "Unknown";

      try {
        const Device: any = await import("expo-device");
        const osName = Device?.osName;
        const osVersion = Device?.osVersion;
        const devBrand = Device?.brand;
        const devModel =
          Device?.modelName ?? Device?.modelId ?? Device?.deviceName;

        if (osName || osVersion) {
          os = `${osName ?? Platform.OS} ${osVersion ?? Platform.Version}`;
        }
        if (devBrand) brand = String(devBrand);
        if (devModel) model = String(devModel);
      } catch (_) {}

      if (Platform.OS === "web") {
        const ua =
          (globalThis as any)?.navigator?.userAgent ??
          (globalThis as any)?.navigator?.appVersion ??
          "";
        if (brand === "Unknown") brand = "Web";
        if (model === "Unknown" && ua) model = ua;
      }
      const headers: any = { "X-NO-AUTH": "true" };
      const result = await clientByCompte(
        {
          numero_compte,
          device_id,
          brand,
          model,
          os,
          code_cryptage: "Y}@128eVIXfoi7",
        },
        headers
      );

      if (result.error) {
        const err: any = result.error;
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

      const fullName =
        info.fullName ||
        `${info.PRENOMCLIENT ?? info.firstName ?? ""} ${
          info.NOMCLIENT ?? info.lastName ?? ""
        }`.trim();

      const userData = {
        id: info.IDCLIENT ?? numero_compte,
        username: info.login ?? numero_compte,
        login: info.login ?? numero_compte,
        name: fullName,
        email: info.email ?? "",
      };
      await secureSetItem("user_data", JSON.stringify(userData));
      if (info.firstName) await secureSetItem("user_firstname", info.firstName);
      if (info.lastName) await secureSetItem("user_lastname", info.lastName);
      await secureSetItem("user_login", info.login ?? numero_compte);
      const rawAccount = info.NUMCOMPTE ?? numero_compte;
      const normalizedAccount = String(rawAccount).trim().toUpperCase();
      await secureSetItem("user_account_number", normalizedAccount);
      await secureSetItem("user_id", info.IDCLIENT ?? numero_compte);
      if (info.agency) {
        const sanitizedAgency = String(info.agency).replace(/\D/g, "");
        await secureSetItem("user_agency", sanitizedAgency);
      }
      if (info.phone) await secureSetItem("user_phone", String(info.phone));
      if (info.email) await secureSetItem("user_email", String(info.email));
      if (info.address)
        await secureSetItem("user_address", String(info.address));

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
