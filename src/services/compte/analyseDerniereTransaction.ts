import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type AnalyseDerniereTransactionPayload = {
  Nombretransactions: number;
};

export const analyseDerniereTransaction = (
  body: AnalyseDerniereTransactionPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.ANALYSE_DERNIERE_TRANSACTION, body, { headers })
  );
};

