import { useState, useCallback } from "react";
import { soldeGlobale } from "../../services/compte/soldeGlobale";
import { secureGetItem, secureSetItem } from "../../shared/utils/secureStorage";

export const useSoldeGlobale = () => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const clientId = await secureGetItem("client_id");
      const token = await secureGetItem("auth_token");
      if (!clientId || !token) {
        setError("Identifiants manquants");
        return false;
      }
      const headers = { Authorization: `Bearer ${token}`, "X-CLIENT-ID": clientId } as any;
      const result: any = await soldeGlobale({ client_id: clientId }, headers);
      if (result?.error) {
        const err: any = result.error;
        const msg = err?.response?.data?.message || err?.message || "Erreur solde";
        setError(msg);
        return false;
      }
      const payload = result?.data;
      setData(payload);
      await secureSetItem("solde_globale", JSON.stringify(payload));
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

export default useSoldeGlobale;
