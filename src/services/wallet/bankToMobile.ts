import { httpClient, handleRequest } from "../httpClient";
import { MobileToBankTransactionPayload } from "./mobileToBank";

export type OtpPayload = {
  NO_CODENATUREVIREMENT: string;
  TYPEOPERATION: string;
  AG_CODEAGENCE: string;
  CL_IDCLIENT: string;
  SL_LOGIN: string;
  SL_MOTDEPASSE: string;
  SL_CLESESSION: string;
  LG_CODELANGUE: string;
  OS_MACADRESSE: string;
  SL_VERSIONAPK: string;
};

// Reuse types from mobileToBank where appropriate or define new ones if strictly needed
// For now, we'll reuse MobileToBankTransactionPayload as the structure is identical for the transaction
// but values differ.

export const requestBankToMobileOtp = (body: OtpPayload) =>
  handleRequest(httpClient.post("/ZenithwebClasse.svc/pvgMobileToken", body));

export const initiateBankToMobile = (body: MobileToBankTransactionPayload) =>
  handleRequest(httpClient.post("/ZenithwebClasse.svc/pvgMobileTransactionMobileBanking", body));
