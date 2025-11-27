import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type SoldeGlobalePayload = {
  CLIENT_ID: string;
  LG_CODELANGUE?: string;
  CODECRYPTAGE?: string;
};

export const soldeGlobale = (
  body: SoldeGlobalePayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.SOLDE_GLOBALE, body, { headers })
  );
};
