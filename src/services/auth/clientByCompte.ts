import { ServiceDescriptor } from "../httpClient";
import { AUTH_ENDPOINTS } from "../endpoints";

export type ClientByComptePayload = {
  numero_compte: string;
};

export const clientByCompteService: ServiceDescriptor<ClientByComptePayload> = {
  method: "POST",
  endpoint: AUTH_ENDPOINTS.clientByCompte,
  requiresAuth: false,
};

