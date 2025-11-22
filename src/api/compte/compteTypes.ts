import type { BaseRequest } from "../types/common";

export interface CompteListRequest extends BaseRequest {
  CL_IDCLIENT: string;
  MB_IDTIERS: string;
  LG_CODELANGUE: string;
  TYPEOPERATION: string;
  CODECRYPTAGE: string;
}

export type CompteListResponse = Record<string, unknown>;

export interface DerniereTransactionRequest extends BaseRequest {
  AG_CODEAGENCE: string;
  CO_CODECOMPTE: string;
  CODECRYPTAGE: string;
}

export type DerniereTransactionResponse = Record<string, unknown>;

export interface SoldeRequest extends BaseRequest {
  AG_CODEAGENCE: string;
  CO_CODECOMPTE: string;
  DATEJOURNEE: string;
}

export type SoldeResponse = Record<string, unknown>;

