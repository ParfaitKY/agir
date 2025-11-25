import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type SoldePayload = {
  AG_CODEAGENCE: string;
  CO_CODECOMPTE: string;
  DATEJOURNEE: string;
};

export const solde = (body: SoldePayload, headers: AuthHeaders = {}) => {
  return handleRequest(httpClient.post(ENDPOINTS.SOLDE, body, { headers }));
};

