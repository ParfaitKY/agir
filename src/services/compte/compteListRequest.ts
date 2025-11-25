import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type CompteListRequestPayload = {
  CL_IDCLIENT: string;
  MB_IDTIERS: string;
  LG_CODELANGUE: string;
  TYPEOPERATION: string;
  CODECRYPTAGE: string;
};

export const compteListRequest = (
  body: CompteListRequestPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(httpClient.post(ENDPOINTS.COMPTE_LIST, body, { headers }));
};

