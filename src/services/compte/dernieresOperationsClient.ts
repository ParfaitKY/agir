import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type DernieresOperationsClientBody = {
  Nombretransactions: string;
  DateDebut: string;
  DateFin: string;
  CodeCryptage: string;
};

export type OperationItem = {
  MC_LIBELLEOPERATION?: string;
  MC_MONTANTDEBIT?: number | string;
  MC_MONTANTCREDIT?: number | string;
  TypeOperation?: "DEBIT" | "CREDIT" | string;
  TS_CODETYPESCHEMACOMPTABLE?: string;
  MC_DATESAISIE?: string;
};

export type DernieresOperationsResponse = {
  operations?: OperationItem[];
  statistiques?: {
    moyenne_credit?: number;
    moyenne_debit?: number;
    solde?: number;
    total_credit?: number;
    total_debit?: number;
  };
};

export const dernieresOperationsClient = (
  body: DernieresOperationsClientBody,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post<DernieresOperationsResponse>(
      ENDPOINTS.DERNIERES_OPERATIONS_CLIENT,
      body,
      { headers }
    )
  );
};

