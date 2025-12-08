import { httpClient, handleRequest } from "../httpClient";

export type ResiliationPayload = {
  LG_CODELANGUE: string;
  AG_CODEAGENCE: string;
  CO_CODECOMPTE: string;
  SO_TELEPHONE: string;
  DATEJOURNEE: string;
  TYPEOPERATION: string;
  TK_TOKEN: string;
  SL_LOGIN: string;
  SL_MOTDEPASSE: string;
  SL_CLESESSION: string;
  SL_VERSIONAPK: string;
  OS_MACADRESSE: string;
  TYPE_APP: string;
};

export const resilierMobileBanking = (body: ResiliationPayload) =>
  handleRequest(httpClient.post("/ZenithwebClasse.svc/pvgResiliationMobileBanking", body));
