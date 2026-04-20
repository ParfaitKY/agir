import { useState, useCallback } from "react";
import { soldeGlobale } from "../../services/compte/soldeGlobale";
import { secureGetItem, secureSetItem } from "../../shared/utils/secureStorage";
import { extractErrorMessage } from "../../services/httpClient";

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
        setError("Session expirée. Reconnectez-vous.");
        return false;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      } as any;
      const result: any = await soldeGlobale(
        {
          CLIENT_ID: resolvedClientId,
          LG_CODELANGUE: "FR",
          CODECRYPTAGE: "Y}@128eVIXfoi7",
        },
        headers
      );
      if (result?.error) {
        setError(extractErrorMessage(result.error, "Impossible de charger le solde"));
        return false;
      }
      const payload = result?.data;
      console.log("[SoldeGlobale] raw response:", JSON.stringify(payload));
      setData(payload);
      await secureSetItem("solde_globale", JSON.stringify(payload));
      return true;
    } catch (e: any) {
      setError(extractErrorMessage(e, "Impossible de charger le solde"));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, fetchData };
};

export default useSoldeGlobale;
