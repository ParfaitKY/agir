import { useState, useCallback } from "react";
import { analyseDerniereTransaction } from "../../services/compte/analyseDerniereTransaction";
import { secureGetItem, secureSetItem } from "../../shared/utils/secureStorage";

export type AnalyseData = {
  NOMBRE_OPERATIONS_CREDIT: number;
  NOMBRE_OPERATIONS_DEBIT: number;
  NOMBRE_TOTAL_OPERATIONS: number;
  POURCENTAGE_CREDIT: number;
  POURCENTAGE_DEBIT: number;
  POURCENTAGE_SENS_FORT: number;
  SENS_FORT: string;
};

export const useAnalyseDerniereTransaction = (nombreTransactions: number = 50) => {
  const [data, setData] = useState<AnalyseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const clientId = await secureGetItem("client_id");
      const token = await secureGetItem("auth_token");
      const login = await secureGetItem("user_login");
      if (!clientId || !token) {
        setError("Identifiants manquants");
        return false;
      }
      const headers = {
        Authorization: `Bearer ${token}`,
      } as any;
      const result: any = await analyseDerniereTransaction(
        { Nombretransactions: nombreTransactions },
        headers
      );
      if (result?.error) {
        const err: any = result.error;
        const server = err?.response?.data;
        const msg =
          server?.message ||
          (Array.isArray(server?.errors) ? server.errors.join(", ") : undefined) ||
          err?.message ||
          "Erreur analyse";
        setError(msg);
        return false;
      }
      const payload = result?.data;
      const analyse: AnalyseData | null = payload?.data ?? null;
      setData(analyse);
      await secureSetItem("analyse_derniere_transaction", JSON.stringify(analyse ?? payload));
      return true;
    } catch (e: any) {
      setError(e?.message || "Erreur réseau");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [nombreTransactions]);

  return { data, isLoading, error, fetchData };
};

export default useAnalyseDerniereTransaction;

