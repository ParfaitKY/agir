import { httpClient, handleRequest, AuthHeaders } from "../httpClient";

export interface WalletOperationsPayload {
  LG_CODELANGUE: string;
  CL_IDCLIENT: string;
  MB_IDTIERS: string;
  CL_CODECLIENTDESTINATAIRE: string;
  CO_CODECOMPTE: string;
  SC_NUMEROCARTE: string;
  TW_DATEDEBUT: string;
  TW_DATEFIN: string;
  NOMBRELIGNE: string;
  SL_LOGIN: string;
  SL_MOTDEPASSE: string;
  SL_CLESESSION: string;
  SL_VERSIONAPK: string;
  TYPEOPERATION: string;
  TO_CODETYPETRANSFERT: string;
  OS_MACADRESSE: string;
}

export const getWalletOperations = (
  body: WalletOperationsPayload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post("/ZenithwebClasse.svc/pvgUserTransFertList", body, {
      headers,
    })
  );
};
