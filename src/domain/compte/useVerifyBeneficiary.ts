import { useState } from "react";
import { verifyBeneficiaryAccount, BeneficiaryAccountInfo } from "../../services/compte/verifyBeneficiaryAccount";
import { secureGetItem } from "../../shared/utils/secureStorage";
import { CODECRYPTAGE } from "../../services/endpoints";
import { Platform } from "react-native";

export const useVerifyBeneficiary = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beneficiaryInfo, setBeneficiaryInfo] = useState<BeneficiaryAccountInfo | null>(null);

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

  const verify = async (numeroCompte: string) => {
    setIsLoading(true);
    setError(null);
    setBeneficiaryInfo(null);

    try {
      const numero_compte = numeroCompte.trim().toUpperCase();
      
      if (!numero_compte || numero_compte.length < 8) {
        setError("Numéro de compte invalide");
        setIsLoading(false);
        return { success: false, error: "Numéro de compte invalide" };
      }

      // Récupérer device_id
      let device_id = await secureGetItem("device_id");
      if (!device_id) {
        const rand = Math.random().toString(36).slice(2);
        const t = Date.now().toString(36);
        device_id = `${Platform.OS}-${t}-${rand}`.toUpperCase();
      }

      let os = `${Platform.OS} ${Platform.Version}`;
      let brand = "Unknown";
      let model = "Unknown";

      try {
        const Device: any = await import("expo-device");
        const osName = Device?.osName;
        const osVersion = Device?.osVersion;
        const devBrand = Device?.brand;
        const devModel = Device?.modelName ?? Device?.modelId ?? Device?.deviceName;

        if (osName || osVersion) {
          os = `${osName ?? Platform.OS} ${osVersion ?? Platform.Version}`;
        }
        if (devBrand) brand = String(devBrand);
        if (devModel) model = String(devModel);
      } catch (err) {
        console.warn("[VerifyBeneficiary] Error capturing device info:", err);
      }

      // Logique spécifique pour le Web
      if (Platform.OS === "web") {
        const ua = (globalThis as any)?.navigator?.userAgent || "";
        if (ua.includes("Windows")) {
          os = "Windows";
          brand = "PC";
          model = "Windows PC";
        } else if (ua.includes("Macintosh") || ua.includes("Mac OS")) {
          os = "macOS";
          brand = "Apple";
          model = "Mac";
        } else if (ua.includes("Linux")) {
          os = "Linux";
          brand = "PC";
          model = "Linux PC";
        }
      }

      const headers: any = { "X-NO-AUTH": "true" };
      const response = await verifyBeneficiaryAccount(
        {
          numero_compte,
          device_id,
          brand,
          model,
          os,
          code_cryptage: CODECRYPTAGE,
        },
        headers
      );

      console.log("[VerifyBeneficiary] Response:", JSON.stringify(response));

      if (response.error) {
        const serverMsg = response.error?.response?.data?.message || response.error?.message || "Compte introuvable";
        setError(serverMsg);
        setIsLoading(false);
        return { success: false, error: serverMsg };
      }

      if (!response.data) {
        setError("Aucune donnée reçue");
        setIsLoading(false);
        return { success: false, error: "Aucune donnée reçue" };
      }

      // Normaliser la réponse
      const source = normalizeSource(response.data);
      console.log("[VerifyBeneficiary] Normalized source:", JSON.stringify(source));

      if (!source) {
        setError("Compte destinataire introuvable");
        setIsLoading(false);
        return { success: false, error: "Compte destinataire introuvable" };
      }

      // Extraire les informations du client
      const lastName = 
        source?.NOMCLIENT ??
        source?.NOM ??
        source?.nom ??
        source?.lastName ??
        source?.NOM_CLIENT ??
        pickKeyValue(source, ["NOMCLIENT", "NOM", "nom", "lastName", "NOM_CLIENT"]);

      const firstName = 
        source?.PRENOMCLIENT ??
        source?.PRENOM ??
        source?.prenom ??
        source?.firstName ??
        source?.PRENOM_CLIENT ??
        pickKeyValue(source, ["PRENOMCLIENT", "PRENOM", "prenom", "firstName", "PRENOM_CLIENT"]);

      const accountNumber = 
        source?.NUMCOMPTE ??
        source?.compte ??
        source?.ACCOUNT_NUMBER ??
        source?.CO_CODECOMPTE ??
        numero_compte;

      const accountType = 
        source?.CO_INTITULECOMPTE ??
        source?.TYPE_COMPTE ??
        source?.INTITULE ??
        "Compte";

      const clientId = 
        source?.IDCLIENT ??
        source?.CLIENT_ID ??
        source?.CODECLIENT;

      const info: BeneficiaryAccountInfo = {
        NUMEROCOMPTE: String(accountNumber),
        CO_INTITULECOMPTE: String(accountType),
        NOM_TITULAIRE: lastName,
        PRENOM_TITULAIRE: firstName,
        IDCLIENT: clientId,
      };

      console.log("[VerifyBeneficiary] Extracted info:", JSON.stringify(info));

      setBeneficiaryInfo(info);
      setIsLoading(false);
      return { success: true, data: info };

    } catch (err: any) {
      console.error("[VerifyBeneficiary] Error:", err);
      const errorMsg = err.message || "Erreur lors de la vérification du compte";
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  const reset = () => {
    setBeneficiaryInfo(null);
    setError(null);
  };

  return {
    verify,
    reset,
    isLoading,
    error,
    beneficiaryInfo,
  };
};
