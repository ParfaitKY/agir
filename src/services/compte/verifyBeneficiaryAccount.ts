import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS, CODECRYPTAGE } from "../endpoints";

export type VerifyBeneficiaryAccountPayload = {
  numero_compte: string;
  device_id?: string;
  brand?: string;
  model?: string;
  os?: string;
  code_cryptage?: string;
};

export type BeneficiaryAccountInfo = {
  NUMEROCOMPTE: string;
  CO_INTITULECOMPTE: string;
  NOM_TITULAIRE?: string;
  PRENOM_TITULAIRE?: string;
  SOLDE?: number;
  STATUT?: string;
  IDCLIENT?: string;
};

export const verifyBeneficiaryAccount = (
  body: VerifyBeneficiaryAccountPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.CLIENT_BY_COMPTE, body, { headers })
  );
};
