import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type ClientByComptePayload = {
  numero_compte: string;
  device_id?: string;
  brand?: string;
  model?: string;
  os?: string;
  code_cryptage?: string;
};

export const clientByCompte = (
  body: ClientByComptePayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.CLIENT_BY_COMPTE, body, { headers })
  );
};

