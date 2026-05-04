import { httpClient, handleRequest } from "../httpClient";
import { ENDPOINTS } from "../endpoints";
import { CODECRYPTAGE } from "../endpoints";

export type CreditProduitsPayload = {
  LG_CODELANGUE: string;
  CLIENT_ID?: string;
  CODECRYPTAGE: string;
};

export type CreditProduitItem = {
  PS_CODESOUSPRODUIT?: string;
  PS_LIBELLE?: string;
  PT_CODEPRODUIT?: string;
  PT_LIBELLE?: string;
  OF_CODEOBJETFINANCEMENT?: string;
  OF_LIBELLE?: string;
  TA_CODETYPEACTIVITE?: string;
  TA_LIBELLE?: string;
  AC_CODEACTIVITE?: string;
  AC_LIBELLE?: string;
  CR_TAUX?: string;
  CR_DUREE_MAX?: string;
  CR_MONTANT_MAX?: string;
};

export const getCreditProduits = (
  body: CreditProduitsPayload,
  headers: Record<string, string> = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.CREDIT_PRODUITS, body, { headers })
  );
};

export const getCreditHistorique = (
  body: { CLIENT_ID: string; LG_CODELANGUE: string; CODECRYPTAGE: string },
  headers: Record<string, string> = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.CREDIT_HISTORIQUE, body, { headers })
  );
};
