import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type DerniereOperationsClientPayload = {
  CL_IDCLIENT: string;
  Nombretransactions?: number;
  LG_CODELANGUE?: string;
  CODECRYPTAGE?: string;
};

export const derniereOperationsClient = (
  body: DerniereOperationsClientPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.DERNIERE_OPERATIONS_CLIENT, body, { headers })
  );
};

