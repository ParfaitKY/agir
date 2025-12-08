import { httpClient, handleRequest } from "../httpClient";

export type PaysPayload = {
  DATEJOURNEE: string;
  SL_LOGIN: string;
  SL_MOTDEPASSE: string;
  SL_CLESESSION: string;
  SL_VERSIONAPK: string;
  LG_CODELANGUE: string;
  OS_MACADRESSE: string;
};

export type ComptesPayload = {
  DATEJOURNEE: string;
  CL_IDCLIENT: string;
  MB_IDTIERS: string;
  SL_LOGIN: string;
  SL_MOTDEPASSE: string;
  TYPEOPERATION: string;
  SL_CLESESSION: string;
  LG_CODELANGUE: string;
  OS_MACADRESSE: string;
  TYPEOPERATEUR: string;
  SL_VERSIONAPK: string;
};

export type DemandeTokenPayload = {
  LG_CODELANGUE: string;
  AG_CODEAGENCE: string;
  TK_TOKEN: string;
  TYPEOPERATION: string;
  SL_LOGIN: string;
  SL_MOTDEPASSE: string;
  SL_CLESESSION: string;
  SL_VERSIONAPK: string;
  OS_MACADRESSE: string;
};

export type SouscriptionPayload = {
  LG_CODELANGUE: string;
  AG_CODEAGENCE: string;
  CO_CODECOMPTE?: string;
  SO_CODESOUSCRIPTION: string;
  PY_CODEPAYS?: string;
  SO_TELEPHONE?: string;
  DATEJOURNEE: string;
  SO_EMAIL?: string;
  SO_LIEURESIDENCE?: string;
  TYPEOPERATION: string;
  TK_TOKEN: string;
  SL_LOGIN: string;
  SL_MOTDEPASSE: string;
  SL_CLESESSION: string;
  SL_VERSIONAPK: string;
  OS_MACADRESSE: string;
  TYPE_APP: string;
};

export const chargerPays = (body: PaysPayload) =>
  handleRequest(httpClient.post("/ZenithwebClasse.svc/pvgChargerDansDataSetPourComboPays", body));

export const listerComptes = (body: ComptesPayload) =>
  handleRequest(httpClient.post("/ZenithwebClasse.svc/pvgUserAcompteList", body));

export const demanderToken = (body: DemandeTokenPayload) =>
  handleRequest(httpClient.post("/ZenithwebClasse.svc/pvgDemandeToken", body));

export const souscrireMobileBanking = (body: SouscriptionPayload) =>
  handleRequest(httpClient.post("/ZenithwebClasse.svc/pvgSouscriptionMobileBanking", body));

