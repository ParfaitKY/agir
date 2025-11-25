import { ServiceDescriptor } from "../httpClient";
import { AUTH_ENDPOINTS } from "../endpoints";

export type GetAccessPayload = {
  cle_secrete: string;
  code_cryptage: string;
};

export const getAccessService: ServiceDescriptor<GetAccessPayload> = {
  method: "POST",
  endpoint: AUTH_ENDPOINTS.getAccess,
  requiresAuth: false,
};

