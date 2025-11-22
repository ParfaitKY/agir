export interface AuthHeaders {
  Authorization: string;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface BaseRequest {
  CODECRYPTAGE?: string;
  code_cryptage?: string;
}

