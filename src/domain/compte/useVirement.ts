import { useState, useCallback } from "react";
import { virement } from "../../services/compte/virement";
import { secureGetItem } from "../../shared/utils/secureStorage";

export const useVirement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  const submit = useCallback(async (payload: {
    emitter: string;
    beneficiary: string;
    amount: string | number;
  }) => {
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
        "X-CLIENT-ID": clientId,
        ...(login ? { "X-LOGIN": login } : {}),
      } as any;
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = String(d.getFullYear());
      const emitter = String(payload.emitter || "").replace(/\D/g, "");
      const dest = String(payload.beneficiary || "").replace(/\D/g, "");
      const amount = String(payload.amount || "0");
      if (!emitter || !dest || Number(amount) <= 0) {
        setError("Données invalides");
        return false;
      }
      const body: any = {
        MC_DATEJOURNEE: `${dd}/${mm}/${yyyy}`,
        CO_CODECOMPTEEMETTEUR: emitter,
        CO_CODECOMPTEDESTINATAIRE: dest,
        MC_MONTANT: amount,
        LG_CODELANGUE: "fr",
        TYPEOPERATION: "02",
        CODECRYPTAGE: "Y}@128eVIXfoi7",
        MC_TERMINAL: "",
        MC_AUTRE1: "",
        MC_AUTRE2: "",
        MC_AUTRE3: "",
      };
      const result: any = await virement(body, headers);
      if (result?.error) {
        const err: any = result.error;
        const server = err?.response?.data;
        const msg = server?.message || err?.message || "Échec virement";
        setError(msg);
        return false;
      }
      setData(result?.data ?? null);
      return true;
    } catch (e: any) {
      setError(e?.message || "Erreur réseau");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { submit, isLoading, error, data };
};

export default useVirement;

