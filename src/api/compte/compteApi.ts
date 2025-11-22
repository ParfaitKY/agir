import type { AxiosInstance } from "axios";
import type { ApiResponse } from "../types/api";
import type { AuthHeaders } from "../types/common";
import type {
  CompteListRequest,
  CompteListResponse,
  DerniereTransactionRequest,
  DerniereTransactionResponse,
  SoldeRequest,
  SoldeResponse,
} from "./compteTypes";

export interface CompteApi {
  comptes(client: AxiosInstance, body: CompteListRequest, headers?: AuthHeaders): Promise<ApiResponse<CompteListResponse>>;
  derniereTransaction(client: AxiosInstance, body: DerniereTransactionRequest, headers?: AuthHeaders): Promise<ApiResponse<DerniereTransactionResponse>>;
  solde(client: AxiosInstance, body: SoldeRequest, headers?: AuthHeaders): Promise<ApiResponse<SoldeResponse>>;
}

