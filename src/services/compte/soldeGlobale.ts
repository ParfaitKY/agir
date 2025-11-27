import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type SoldeGlobalePayload = {
  client_id: string;
};

export const soldeGlobale = (body: SoldeGlobalePayload, headers: AuthHeaders = {}) => {
  return handleRequest(httpClient.post(ENDPOINTS.SOLDE_GLOBALE, body, { headers }));
};
