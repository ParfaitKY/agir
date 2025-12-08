import { useState, useCallback } from "react";
import { secureGetItem } from "../../shared/utils/secureStorage";
import {
  getWalletOperations,
  WalletOperationsPayload,
} from "../../services/wallet/mobileOperations";

export interface WalletTransaction {
  id: string;
  label: string;
  amount: number;
  date: string;
  type: "DEBIT" | "CREDIT";
  reference: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
}

// Types API (Réponse)
interface ApiTransaction {
  TW_OPERATIONTRANSACTION: string;
  TW_LIBELLEOPERATION: string;
  TW_MONTANTOPERATION: string;
  TW_DATEOPERATION: string;
  TW_NUMEROTRANSFERT: string;
  CL_NOMCLIENTEMETTEUR?: string;
  COMPTEBENEFICIAIRE?: string;
  TS_CODETYPESCHEMACOMPTABLE?: string;
}

export const useWalletTransactions = () => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");

  // 1. Logique de Validation
  const validate = (
    startDate: string,
    endDate: string
  ): { isValid: boolean; message?: string } => {
    if (!startDate || !endDate) {
      return {
        isValid: false,
        message: "Veuillez sélectionner une date de début et de fin.",
      };
    }
    return { isValid: true };
  };

  // 2. Logique de Mapping (API -> UI)
  const mapTransaction = (
    op: ApiTransaction,
    index: number
  ): WalletTransaction => {
    let label = op.TW_LIBELLEOPERATION;
    const prefix = (op.TW_OPERATIONTRANSACTION || "").substring(0, 5);

    if (prefix === "BAVMI") {
      label = "COMPTE BANCAIRE VERS MOBILE";
    } else if (prefix === "MOVBI") {
      label = "MOBILE VERS COMPTE BANCAIRE";
    }

    const isCredit = false; // À adapter selon la logique métier

    const amount = parseFloat(
      String(op.TW_MONTANTOPERATION).replace(/\s/g, "").replace(",", ".")
    );

    return {
      id: op.TW_NUMEROTRANSFERT || `tx-${index}-${Date.now()}`,
      label: label || "Opération Mobile",
      amount: isNaN(amount) ? 0 : amount,
      date: op.TW_DATEOPERATION || "",
      type: isCredit ? "CREDIT" : "DEBIT",
      reference: op.TW_NUMEROTRANSFERT || "N/A",
      status: "SUCCESS",
    };
  };

  // 3. Logique de Recherche
  const search = useCallback(async (startDate: string, endDate: string) => {
    const validation = validate(startDate, endDate);

    if (!validation.isValid) {
      setError(validation.message || "Erreur de validation");
      return;
    }

    setLoading(true);
    setError(null);
    setTransactions([]);
    setFeedbackMessage("");

    try {
      // Récupération session
      const clientId =
        (await secureGetItem("user_id")) || (await secureGetItem("client_id"));
      const login = await secureGetItem("user_login");
      const password = await secureGetItem("pin_user");
      const cleSession = await secureGetItem("user_secret_key");

      if (!clientId || !login) {
        throw new Error("Session invalide. Veuillez vous reconnecter.");
      }

      const payload: WalletOperationsPayload = {
        LG_CODELANGUE: "fr",
        CL_IDCLIENT: clientId,
        MB_IDTIERS: "",
        CL_CODECLIENTDESTINATAIRE: "",
        CO_CODECOMPTE: "",
        SC_NUMEROCARTE: "",
        TW_DATEDEBUT: startDate,
        TW_DATEFIN: endDate,
        NOMBRELIGNE: "100",
        SL_LOGIN: login,
        SL_MOTDEPASSE: password || "",
        SL_CLESESSION: cleSession || "",
        SL_VERSIONAPK: "2",
        TYPEOPERATION: "09",
        TO_CODETYPETRANSFERT: "18",
        OS_MACADRESSE: "80",
      };

      // Appel via le nouveau service
      const response = await getWalletOperations(payload);

      if (response.error) {
        throw response.error;
      }

      const data: any = response.data;
      const result = data?.pvgUserTransFertListResult || data?.data || [];

      const firstItem = Array.isArray(result) ? result[0] : result;
      if (firstItem?.SL_RESULTAT === "FALSE") {
        throw new Error(
          firstItem.SL_MESSAGE ||
            "Erreur lors de la récupération des opérations."
        );
      }

      const list = Array.isArray(result) ? result : [];
      const mapped = list.map(mapTransaction);

      setTransactions(mapped);
      if (mapped.length === 0) {
        setFeedbackMessage("Aucune opération trouvée pour cette période.");
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        "Impossible de récupérer l'historique des transactions.";
      setError(msg);
      setFeedbackMessage(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    transactions,
    loading,
    error,
    feedbackMessage,
    search,
    validate,
  };
};
