import type { BaseRequest } from "../types/common";

export interface LoginRequest extends BaseRequest {
  LG_CODELANGUE: string;
  SL_LOGIN: string;
  SL_MOTPASSE: string;
  TYPEOPERATEUR: string;
  TYPEOPERATION: string;
  CODECRYPTAGE: string;
  TERMINALUUID: string;
}

export type LoginResponse = Record<string, unknown>;

export interface GetAccessRequest extends BaseRequest {
  cle_secrete: string;
  code_cryptage: string;
}

export type GetAccessResponse = Record<string, unknown>;

export interface UpdateLoginRequest extends BaseRequest {
  nouveau_login: string;
  nouveau_motpasse: string;
  cle_secrete: string;
  code_cryptage: string;
}

export type UpdateLoginResponse = Record<string, unknown>;

export interface ClientByCompteRequest {
  numero_compte: string;
}

export type ClientByCompteResponse = Record<string, unknown>;

