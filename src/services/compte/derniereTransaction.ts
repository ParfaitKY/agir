import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type DerniereTransactionPayload = {
  client_id: string;
};

export const derniereTransaction = (
  body: DerniereTransactionPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.DERNIERE_TRANSACTION, body, { headers })
  );
};
