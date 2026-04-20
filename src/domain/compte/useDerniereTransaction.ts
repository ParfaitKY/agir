import { useState, useCallback } from "react";
import { getDerniereTransaction } from "../../services/compte/derniereTransaction";
import { secureGetItem, secureSetItem } from "../../shared/utils/secureStorage";
import { extractErrorMessage } from "../../services/httpClient";

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
        setError("Session expirée. Reconnectez-vous.");
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
      } as any;
      if (!sanitizedAccount || !/^\d+$/.test(sanitizedAccount)) {
        setError("Numéro de compte invalide");
        return false;
      }
      if (!sanitizedAgency || !/^\d+$/.test(sanitizedAgency)) {
        setError("Code agence invalide");
        return false;
      }
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      const dateFin = `${dd}/${mm}/${yyyy}`;

      const result: any = await getDerniereTransaction(
        {
          AG_CODEAGENCE: sanitizedAgency,
          CO_CODECOMPTE: sanitizedAccount,
          CODECRYPTAGE: "Y}@128eVIXfoi7",
          DateDebut: "01/01/2000",
          DateFin: dateFin,
          Nombretransactions: "1"
        },
        headers
      );
      if (result?.error) {
        setError(extractErrorMessage(result.error, "Impossible de charger la transaction"));
        return false;
      }
      const payload = result?.data;
      const txRaw = Array.isArray(payload?.data) ? payload.data[0] : null;
      const debit = txRaw?.MC_MONTANTDEBIT
        ? Number(String(txRaw.MC_MONTANTDEBIT).replace(/[,\s]/g, ""))
        : 0;
      const credit = txRaw?.MC_MONTANTCREDIT
        ? Number(String(txRaw.MC_MONTANTCREDIT).replace(/[,\s]/g, ""))
        : 0;
      const normalized = txRaw
        ? {
            label: txRaw.MC_LIBELLEOPERATION,
            date: txRaw.MC_DATEPIECE,
            montant: String(
              debit > 0 ? txRaw.MC_MONTANTDEBIT : txRaw.MC_MONTANTCREDIT
            ),
            type: debit > 0 ? "Débit" : credit > 0 ? "Crédit" : "N/A",
            raw: txRaw,
          }
        : null;
      setData(normalized);
      await secureSetItem(
        "derniere_transaction",
        JSON.stringify(normalized ?? payload)
      );
      return true;
    } catch (e: any) {
      setError(extractErrorMessage(e, "Impossible de charger la transaction"));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, fetchData };
};

export default useDerniereTransaction;
