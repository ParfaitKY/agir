import { ServiceDescriptor } from "../httpClient";
import { AUTH_ENDPOINTS } from "../endpoints";

export type UpdateLoginPayload = {
  nouveau_login: string;
  nouveau_motpasse: string;
  cle_secrete: string;
  code_cryptage: string;
};

export const updateLoginService: ServiceDescriptor<UpdateLoginPayload> = {
  method: "PUT",
  endpoint: AUTH_ENDPOINTS.updateLogin,
  requiresAuth: true,
};

