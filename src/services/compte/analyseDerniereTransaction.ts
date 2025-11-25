import { ServiceDescriptor } from "../httpClient";
import { COMPTE_ENDPOINTS } from "../endpoints";

export type AnalyseDerniereTransactionPayload = {
  Nombretransactions: number;
};

export const analyseDerniereTransactionService: ServiceDescriptor<AnalyseDerniereTransactionPayload> = {
  method: "POST",
  endpoint: COMPTE_ENDPOINTS.analyseDerniereTransaction,
  requiresAuth: true,
};

