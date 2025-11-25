import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type LoginPayload = {
  LG_CODELANGUE: string;
  SL_LOGIN: string;
  SL_MOTPASSE: string;
  TYPEOPERATEUR: string;
  TYPEOPERATION: string;
  CODECRYPTAGE: string;
  TERMINALUUID: string;
};

export const login = (body: LoginPayload, headers: AuthHeaders = {}) => {
  return handleRequest(httpClient.post(ENDPOINTS.LOGIN, body, { headers }));
};

