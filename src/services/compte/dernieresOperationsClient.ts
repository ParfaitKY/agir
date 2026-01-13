import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type DernieresOperationsClientBody = {
  Nombretransactions: string;
  DateDebut: string;
  DateFin: string;
  CodeCryptage: string;
  AG_CODEAGENCE?: string;
  CO_CODECOMPTE?: string;
};

export type OperationItem = {
  MC_LIBELLEOPERATION?: string;
  MC_MONTANTDEBIT?: number | string;
  MC_MONTANTCREDIT?: number | string;
  TypeOperation?: "DEBIT" | "CREDIT" | string;
  TS_CODETYPESCHEMACOMPTABLE?: string;
  MC_DATESAISIE?: string;
  MC_NUMPIECE?: string | number;
  MC_NUMSEQUENCE?: string | number;
  AG_CODEAGENCE?: string | number;
  CO_CODECOMPTE?: string;
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

