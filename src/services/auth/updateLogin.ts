import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type UpdateLoginPayload = {
  nouveau_login: string;
  nouveau_motpasse: string;
  cle_secrete: string;
  code_cryptage: string;
};

export const updateLogin = (
  body: UpdateLoginPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(httpClient.put(ENDPOINTS.UPDATE_LOGIN, body, { headers }));
};

