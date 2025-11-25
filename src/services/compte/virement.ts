import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

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

export const virement = (
  body: VirementPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(httpClient.post(ENDPOINTS.VIREMENT, body, { headers }));
};

