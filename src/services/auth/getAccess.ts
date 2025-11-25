import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type GetAccessPayload = {
  cle_secrete: string;
  code_cryptage: string;
};

export const getAccess = (
  body: GetAccessPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(httpClient.post(ENDPOINTS.GET_ACCESS, body, { headers }));
};

