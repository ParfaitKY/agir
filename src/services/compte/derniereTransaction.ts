import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type DerniereTransactionPayload = {
  AG_CODEAGENCE: string;
  CO_CODECOMPTE: string;
  CODECRYPTAGE: string;
};

export const derniereTransaction = (
  body: DerniereTransactionPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.DERNIERE_TRANSACTION, body, { headers })
  );
};

