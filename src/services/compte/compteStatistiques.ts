import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type CompteStatistiquesPayload = {
  DateReference: string;
};

export const compteStatistiques = (
  body: CompteStatistiquesPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.COMPTE_STATS, body, { headers })
  );
};

