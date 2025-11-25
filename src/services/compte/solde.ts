import { ServiceDescriptor } from "../httpClient";
import { COMPTE_ENDPOINTS } from "../endpoints";

export type SoldePayload = {
  AG_CODEAGENCE: string;
  CO_CODECOMPTE: string;
  DATEJOURNEE: string;
};

export const soldeService: ServiceDescriptor<SoldePayload> = {
  method: "POST",
  endpoint: COMPTE_ENDPOINTS.solde,
  requiresAuth: true,
};

