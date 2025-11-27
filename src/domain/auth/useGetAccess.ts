import { useState, useCallback } from "react";
import { getAccess as getAccessApi } from "../../services/auth/getAccess";
import { secureGetItem, secureSetItem } from "../../shared/utils/secureStorage";

export const useGetAccess = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessData, setAccessData] = useState<any | null>(null);

  const getAccess = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const clientId = await secureGetItem("client_id");
      const token = await secureGetItem("auth_token");
      const secret = await secureGetItem("user_secret_key");
      if (!clientId || !token || !secret) {
        setError("Informations d’accès manquantes");
        return false;
      }
      const headers = {
        Authorization: `Bearer ${token}`,
        "X-CLIENT-ID": clientId,
      } as any;
      const body = {
        LG_CODELANGUE: "FR",
        CLIENT_ID: clientId,
        CLE_SECRETE: secret,
        CODECRYPTAGE: "Y}@128eVIXfoi7",
      } as any;
      const result: any = await getAccessApi(body, headers);
      if (result?.error) {
        const err: any = result.error;
        const server = err?.response?.data;
        const msg =
          server?.message ||
          (Array.isArray(server?.errors)
            ? server.errors.join(", ")
            : undefined) ||
          err?.message ||
          "Échec de récupération des accès";
        setError(msg);
        return false;
      }
      const data: any = result?.data;
      setAccessData(data);
      await secureSetItem("access_data", JSON.stringify(data));
      return true;
    } catch (e: any) {
      setError(e?.message || "Erreur réseau");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getAccess, isLoading, error, accessData };
};

export default useGetAccess;
