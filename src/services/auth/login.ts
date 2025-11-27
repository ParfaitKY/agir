import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type LoginPayload = {
  LG_CODELANGUE: string;
  SL_LOGIN: string;
  SL_MOTPASSE: string;
  TYPEOPERATEUR: string;
  TYPEOPERATION: string;
  CODECRYPTAGE: string;
  TERMINALUUID: string;
};

export type LoginResult = { data?: any; error?: string; status?: number };

const login = async (body: LoginPayload): Promise<LoginResult> => {
  try {
    const res = await httpClient.post(ENDPOINTS.LOGIN, body, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return { data: res.data, status: res.status };
  } catch (err: any) {
    const status = err?.response?.status;
    const error =
      status === 401
        ? "Login ou mot de passe incorrect"
        : err?.response?.data?.message || "Erreur de connexion";
    return { error, status };
  }
};

export default login;
export { login };
