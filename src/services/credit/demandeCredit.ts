import { httpClient, handleRequest } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type DemandeCreditBody = {
  LG_CODELANGUE: string;
  AG_CODEAGENCE: string;
  OF_CODEOBJETFINANCEMENT: string;
  PS_CODESOUSPRODUIT: string;
  TA_CODETYPEACTIVITE: string;
  AC_CODEACTIVITE: string;
  AT_CODEACTIVITE: string;
  CL_IDCLIENT: string;
  CR_DESCRIPTIONACTIVITE: string;
  CO_CODECOMMUNE: string;
  CR_ADRESSEGEOGRAPHIQUEACTIVITE: string;
  CR_MONTANTCREDIT: string;
  CR_DATEREMBOURSEMENT: string;
  CR_TAUX: string;
  CR_DUREE: string;
  CR_DIFFERE: string;
  PE_CODEPERIODICITE: string;
  OP_CODEOPERATEUR: string;
  TYPEOPERATION: string;
  CR_DATEMISEENPLACE: string;
  CODECRYPTAGE: string;
};

export const demandeCredit = (
  body: DemandeCreditBody,
  headers: Record<string, string> = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.CREDIT_DEMANDE, body, { headers })
  );
};
