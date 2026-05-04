import { useState, useCallback } from "react";
import { getCreditProduits, getCreditHistorique, CreditProduitItem } from "../../services/credit/creditProduits";
import { secureGetItem } from "../../shared/utils/secureStorage";
import { CODECRYPTAGE } from "../../services/endpoints";

export type CreditHistoriqueItem = {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  nature?: string;
  produit?: string;
};

export function useCreditProduits() {
  const [produits, setProduits] = useState<CreditProduitItem[]>([]);
  const [historique, setHistorique] = useState<CreditHistoriqueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const clientId = await secureGetItem("client_id");
      const token = await secureGetItem("auth_token");

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await getCreditProduits(
        { LG_CODELANGUE: "FR", CLIENT_ID: clientId || "", CODECRYPTAGE },
        headers
      );

      if (res.error) {
        setError("Impossible de charger les produits de crédit.");
        return;
      }

      const raw = res.data;
      // Normalisation flexible de la réponse
      const list: CreditProduitItem[] =
        raw?.data ??
        raw?.PRODUITS ??
        raw?.produits ??
        raw?.result ??
        (Array.isArray(raw) ? raw : []);

      setProduits(Array.isArray(list) ? list : []);
    } catch {
      setError("Erreur lors du chargement des produits.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHistorique = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const clientId = await secureGetItem("client_id");
      const token = await secureGetItem("auth_token");
      if (!clientId) return;

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await getCreditHistorique(
        { CLIENT_ID: clientId, LG_CODELANGUE: "FR", CODECRYPTAGE },
        headers
      );

      if (res.error || !res.data) return;

      const raw = res.data;
      const list =
        raw?.data ??
        raw?.DEMANDES ??
        raw?.demandes ??
        raw?.result ??
        (Array.isArray(raw) ? raw : []);

      if (!Array.isArray(list)) return;

      const mapped: CreditHistoriqueItem[] = list.map((item: any, i: number) => ({
        id: String(item.CR_IDCREDIT ?? item.id ?? i),
        type: item.PT_LIBELLE ?? item.type ?? "Crédit",
        amount: Number(item.CR_MONTANTCREDIT ?? item.amount ?? 0),
        date: item.CR_DATEMISEENPLACE ?? item.date ?? "",
        status: resolveStatus(item.CR_ETAT ?? item.status ?? ""),
        nature: item.PS_LIBELLE ?? item.nature ?? "",
        produit: item.PS_CODESOUSPRODUIT ?? item.produit ?? "",
      }));

      setHistorique(mapped);
    } catch {
      // Silencieux — l'historique est optionnel
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  return { produits, historique, isLoading, isLoadingHistory, error, fetchProduits, fetchHistorique };
}

function resolveStatus(raw: string): "PENDING" | "APPROVED" | "REJECTED" {
  const s = String(raw).toUpperCase();
  if (s.includes("VALID") || s.includes("APPROV") || s === "1" || s === "A") return "APPROVED";
  if (s.includes("REJET") || s.includes("REFUS") || s === "2" || s === "R") return "REJECTED";
  return "PENDING";
}
