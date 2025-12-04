import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type BlocagesCompteBody = {
  CO_CODECOMPTE: string;
  BL_DATEJOURNEE: string;
  MB_IDTIERS: string;
};

export type BlocageItem = Record<string, any> & {
  montant?: number | string;
  date?: string;
  type?: string;
  description?: string;
};

export type BlocagesCompteResponse = {
  count?: number;
  data?: BlocageItem[];
  success?: boolean;
};

export const blocagesCompte = (
  body: BlocagesCompteBody,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post<BlocagesCompteResponse>(
      ENDPOINTS.BLOQUE_COMPTE,
      body,
      { headers }
    )
  );
};
