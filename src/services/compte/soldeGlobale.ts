import { ServiceDescriptor } from "../httpClient";
import { COMPTE_ENDPOINTS } from "../endpoints";

export type SoldeGlobalePayload = Record<string, never>;

export const soldeGlobaleService: ServiceDescriptor<SoldeGlobalePayload> = {
  method: "POST",
  endpoint: COMPTE_ENDPOINTS.soldeGlobale,
  requiresAuth: true,
};

