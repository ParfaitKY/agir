import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type DerniereTransactionExactPayload = {
  AG_CODEAGENCE: string;
  CO_CODECOMPTE: string;
  CODECRYPTAGE: string;
  DateDebut?: string;
  DateFin?: string;
  Nombretransactions?: string;
};

export const getDerniereTransaction = (
  payload: DerniereTransactionExactPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.DERNIERE_TRANSACTION, payload, { headers })
  );
};
