import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type BloqueComptePayload = {
  AG_CODEAGENCE: string;
  CO_CODECOMPTE: string;
  CODECRYPTAGE?: string;
};

export const bloqueCompte = (
  body: BloqueComptePayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.BLOQUE_COMPTE, body, { headers })
  );
};

