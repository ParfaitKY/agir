import { ServiceDescriptor } from "../httpClient";
import { COMPTE_ENDPOINTS } from "../endpoints";

export type DerniereTransactionPayload = {
  AG_CODEAGENCE: string;
  CO_CODECOMPTE: string;
  CODECRYPTAGE: string;
};

export const derniereTransactionService: ServiceDescriptor<DerniereTransactionPayload> = {
  method: "POST",
  endpoint: COMPTE_ENDPOINTS.derniereTransaction,
  requiresAuth: true,
};

