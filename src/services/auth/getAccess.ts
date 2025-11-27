import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type GetAccessPayload = {
  LG_CODELANGUE?: string;
  CLIENT_ID?: string;
  CLE_SECRETE: string;
  CODECRYPTAGE: string;
};

export const getAccess = (
  body: GetAccessPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(httpClient.post(ENDPOINTS.GET_ACCESS, body, { headers }));
};

