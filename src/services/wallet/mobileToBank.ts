import { httpClient, handleRequest } from "../httpClient";

export type MobileToBankFeesPayload = {
  MONTANT: string;
  MONTANTMF: string;
  CODESERVICE: string;
  TYPEOPERATION: string;
  SL_LOGIN: string;
  SL_MOTDEPASSE: string;
  SL_CLESESSION: string;
  LG_CODELANGUE: string;
  OS_MACADRESSE: string;
  SL_VERSIONAPK: string;
};

export type MobileToBankTransactionPayload = {
  NO_CODENATUREVIREMENT: string;
  TO_CODETYPETRANSFERT: string;
  TW_CODEVALIDATION: string;
  IN_CODESERVICE: string;
  SL_UTILISATEUR: string;
  MC_TERMINAL: string;
  MONTANT: string;
  CO_CODECOMPTE: string;
  SO_CODESOUSCRIPTION: string; // Phone ID
  SO_TELEPHONE: string;
  TYPEOPERATION: string;
  SL_LOGIN: string;
  SL_MOTDEPASSE: string;
  SL_CLESESSION: string;
  LG_CODELANGUE: string;
  AG_CODEAGENCE: string;
  CL_IDCLIENT: string;
  DATEJOURNEE: string;
  OS_MACADRESSE: string;
  SL_VERSIONAPK: string;
  TYPE_APP: string;
};

export type NetworkPayload = {
  SL_LOGIN: string;
  SL_MOTDEPASSE: string;
  SL_CLESESSION: string;
  LG_CODELANGUE: string;
  OS_MACADRESSE: string;
  SL_VERSIONAPK: string;
};

export type PhonesPayload = {
  AG_CODEAGENCE: string;
  CL_IDCLIENT: string;
  CO_CODECOMPTE?: string;
  SL_LOGIN: string;
  SL_MOTDEPASSE: string;
  TYPEOPERATION: string;
  SL_CLESESSION: string;
  LG_CODELANGUE: string;
  OS_MACADRESSE: string;
  TYPEOPERATEUR: string;
  SL_VERSIONAPK: string;
};

export const getMobileNetworks = (body: NetworkPayload) =>
  handleRequest(
    httpClient.post(
      "/ZenithwebClasse.svc/pvgChargerDansDataSetPourComboMobileIntouchService",
      body
    )
  );

export const getMobileToBankFees = (body: MobileToBankFeesPayload) =>
  handleRequest(
    httpClient.post("/ZenithwebClasse.svc/pvgCommissioncinetpay", body)
  );

export const initiateMobileToBank = (body: MobileToBankTransactionPayload) =>
  handleRequest(
    httpClient.post(
      "/ZenithwebClasse.svc/pvgMobileTransactionMobileBanking",
      body
    )
  );

export const fetchLinkedPhones = (body: PhonesPayload) =>
  handleRequest(
    httpClient.post("/ZenithwebClasse.svc/pvgCompteMobileMappe", body)
  );
