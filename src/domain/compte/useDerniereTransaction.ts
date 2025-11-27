import { useState, useCallback } from "react";
import { getDerniereTransaction } from "../../services/compte/derniereTransaction";
import { secureGetItem, secureSetItem } from "../../shared/utils/secureStorage";

export const useDerniereTransaction = () => {
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
      const accountNumber = await secureGetItem("user_account_number");
      const agencyRaw = (await secureGetItem("user_agency")) || "1000";
      const sanitizedAccount = String(accountNumber || "").replace(/\D/g, "");
      const sanitizedAgency =
        String(agencyRaw || "").replace(/\D/g, "") || "1000";
      const login = await secureGetItem("user_login");
      const headers = {
        Authorization: `Bearer ${token}`,
        "X-CLIENT-ID": clientId,
        ...(login ? { "X-LOGIN": login } : {}),
      } as any;
      if (!sanitizedAccount || !/^\d+$/.test(sanitizedAccount)) {
        setError("Numéro de compte invalide");
        return false;
      }
      if (!sanitizedAgency || !/^\d+$/.test(sanitizedAgency)) {
        setError("Code agence invalide");
        return false;
      }
      const result: any = await getDerniereTransaction(
        {
          AG_CODEAGENCE: sanitizedAgency,
          CO_CODECOMPTE: sanitizedAccount,
          CODECRYPTAGE: "Y}@128eVIXfoi7",
        },
        headers
      );
      if (result?.error) {
        const err: any = result.error;
        const server = err?.response?.data;
        const msg =
          server?.message ||
          (Array.isArray(server?.errors)
            ? server.errors.join(", ")
            : undefined) ||
          err?.message ||
          "Erreur transaction";
        setError(msg);
        return false;
      }
      const payload = result?.data;
      setData(payload);
      await secureSetItem("derniere_transaction", JSON.stringify(payload));
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

export default useDerniereTransaction;
