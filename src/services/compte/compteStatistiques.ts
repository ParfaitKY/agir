import { ServiceDescriptor } from "../httpClient";
import { COMPTE_ENDPOINTS } from "../endpoints";

export type CompteStatistiquesPayload = {
  DateReference: string;
};

export const compteStatistiquesService: ServiceDescriptor<CompteStatistiquesPayload> = {
  method: "POST",
  endpoint: COMPTE_ENDPOINTS.comptesStatistiques,
  requiresAuth: true,
};

