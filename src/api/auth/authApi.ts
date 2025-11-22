import type { AxiosInstance } from "axios";
import type { ApiResponse } from "../types/api";
import type { AuthHeaders } from "../types/common";
import type {
  LoginRequest,
  LoginResponse,
  GetAccessRequest,
  GetAccessResponse,
  UpdateLoginRequest,
  UpdateLoginResponse,
  ClientByCompteRequest,
  ClientByCompteResponse,
} from "./authTypes";

export interface AuthApi {
  login(client: AxiosInstance, body: LoginRequest, headers?: AuthHeaders): Promise<ApiResponse<LoginResponse>>;
  getAccess(client: AxiosInstance, body: GetAccessRequest, headers?: AuthHeaders): Promise<ApiResponse<GetAccessResponse>>;
  updateLogin(client: AxiosInstance, body: UpdateLoginRequest, headers?: AuthHeaders): Promise<ApiResponse<UpdateLoginResponse>>;
  clientByCompte(client: AxiosInstance, body: ClientByCompteRequest, headers?: AuthHeaders): Promise<ApiResponse<ClientByCompteResponse>>;
}

