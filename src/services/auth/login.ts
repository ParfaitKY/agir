import { ServiceDescriptor } from "../httpClient";
import { AUTH_ENDPOINTS } from "../endpoints";

export type LoginPayload = {
  LG_CODELANGUE: string;
  SL_LOGIN: string;
  SL_MOTPASSE: string;
  TYPEOPERATEUR: string;
  TYPEOPERATION: string;
  CODECRYPTAGE: string;
  TERMINALUUID: string;
};

export const loginService: ServiceDescriptor<LoginPayload> = {
  method: "POST",
  endpoint: AUTH_ENDPOINTS.login,
  requiresAuth: false,
};

