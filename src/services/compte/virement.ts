import { ServiceDescriptor } from "../httpClient";
import { COMPTE_ENDPOINTS } from "../endpoints";

export type VirementPayload = {
  MC_DATEJOURNEE: string;
  CO_CODECOMPTEEMETTEUR: string;
  CO_CODECOMPTEDESTINATAIRE: string;
  MC_MONTANT: string | number;
  LG_CODELANGUE: string;
  TYPEOPERATION: string;
  CODECRYPTAGE: string;
  MC_TERMINAL?: string;
  MC_AUTRE1?: string;
  MC_AUTRE2?: string;
  MC_AUTRE3?: string;
};

export const virementService: ServiceDescriptor<VirementPayload> = {
  method: "POST",
  endpoint: COMPTE_ENDPOINTS.virement,
  requiresAuth: true,
};

