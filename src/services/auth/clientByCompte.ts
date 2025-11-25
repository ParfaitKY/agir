import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type ClientByComptePayload = {
  numero_compte: string;
};

export const clientByCompte = (
  body: ClientByComptePayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.CLIENT_BY_COMPTE, body, { headers })
  );
};

