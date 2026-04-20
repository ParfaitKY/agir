import { useState, useCallback } from "react";
import { compteStatistiques } from "../../services/compte/compteStatistiques";
import { secureGetItem, secureSetItem } from "../../shared/utils/secureStorage";

type CompteItem = {
  AG_CODEAGENCE?: string;
  CL_CODECLIENT?: string;
  CL_IDCLIENT?: string | number;
  CO_CODECOMPTE?: string;
  CO_DATECLOTURE?: string;
  CO_INTITULECOMPTE?: string;
  IDF?: number;
  MONTANTBLOQUE?: number;
  NUMEROCOMPTE?: string;
  PD_CODETYPEPRODUIT?: string;
  PD_LIBELLE?: string;
  POURCENTAGE_SOLDE?: number;
  PS_CODESOUSPRODUIT?: string;
  PT_CODEPRODUIT?: string;
  SOLDE?: number;
  SOLDE_GLOBAL?: number;
  id?: number;
  duration?: string;
  nextDueDate?: string;
};

export type CompteStatsData = {
  CL_IDCLIENT?: string | number;
  COMPTES?: CompteItem[];
  NOMBRE_COMPTES?: number;
  SOLDE_GLOBAL?: number;
};

export const useCompteStatistiques = () => {
  const [data, setData] = useState<CompteStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const clientId = await secureGetItem("client_id");
      const token = await secureGetItem("auth_token");

      // Fallback : chercher le client_id dans user_data si absent
      let resolvedClientId = clientId;
      if (!resolvedClientId) {
        try {
          const userData = await secureGetItem("user_data");
          if (userData) {
            const parsed = JSON.parse(userData);
            resolvedClientId = parsed?.id || parsed?.CL_IDCLIENT || parsed?.client_id || null;
          }
        } catch {}
      }

      if (!resolvedClientId || !token) {
        setError("Identifiants manquants");
        return false;
      }

      // Sauvegarder pour les prochains appels
      if (!clientId && resolvedClientId) {
        const { secureSetItem: save } = await import("../../shared/utils/secureStorage");
        await save("client_id", String(resolvedClientId));
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      } as any;
      const body = {
        DateReference: "",
        LG_CODELANGUE: "FR",
        CLIENT_ID: resolvedClientId,
        CODECRYPTAGE: "Y}@128eVIXfoi7",
      } as any;
      const result: any = await compteStatistiques(body, headers);
      if (result?.error) {
        const err: any = result.error;
        const server = err?.response?.data;
        const msg =
          server?.message ||
          (Array.isArray(server?.errors)
            ? server.errors.join(", ")
            : undefined) ||
          err?.message ||
          "Échec des statistiques de comptes";
        setError(msg);
        return false;
      }
      const payload = result?.data;
      console.log("[CompteStats] raw response:", JSON.stringify(payload));

      // Normalisation flexible de la réponse
      let stats: CompteStatsData | null =
        payload?.data ??
        payload?.DONNEES ??
        payload?.result ??
        (payload?.COMPTES ? payload : null) ??
        null;

      // Correction : Déduplication des comptes basée sur le numéro de compte nettoyé (alphanumeric only)
      // Cela empêche les comptes en double d'apparaître dans l'interface utilisateur
      if (stats && Array.isArray(stats.COMPTES)) {
        const uniqueAccounts = Array.from(
          new Map(
            stats.COMPTES.map((item) => {
              // Nettoyage agressif : garde uniquement chiffres et lettres, majuscules
              const rawNum = String(item.NUMEROCOMPTE || "");
              const num = rawNum.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
              
              // Fallback sur CO_CODECOMPTE si le numéro est vide
              const code = String(item.CO_CODECOMPTE || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
              
              // Clé unique : Priorité au Numéro, sinon Code, sinon ID aléatoire
              const key = num || code || `id_${item.id || Math.random()}`;
              
              return [key, item];
            }),
          ).values(),
        );
        stats.COMPTES = uniqueAccounts;
        stats.NOMBRE_COMPTES = uniqueAccounts.length;
      }

      setData(stats);
      await secureSetItem(
        "compte_statistiques",
        JSON.stringify(stats ?? payload),
      );
      return true;
    } catch (e: any) {
      setError(e?.message || "Erreur réseau");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, fetchData };
};

export default useCompteStatistiques;
