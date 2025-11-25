import { ServiceDescriptor } from "../httpClient";
import { COMPTE_ENDPOINTS } from "../endpoints";

export type CompteListRequestPayload = {
  CL_IDCLIENT: string;
  MB_IDTIERS: string;
  LG_CODELANGUE: string;
  TYPEOPERATION: string;
  CODECRYPTAGE: string;
};

export const compteListRequestService: ServiceDescriptor<CompteListRequestPayload> = {
  method: "POST",
  endpoint: COMPTE_ENDPOINTS.comptes,
  requiresAuth: true,
};

