import { useState, useCallback } from "react";
import { login as loginApi, LoginPayload } from "../../services/auth/login";
import { secureSetItem, secureGetItem } from "../../shared/utils/secureStorage";

export type LoginResult = {
  token?: string;
  user?: {
    id: string;
    username: string;
    name: string;
    email?: string;
  };
};

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<LoginResult | null>(null);

  const loginUser = useCallback(async (payload: LoginPayload) => {
    setError(null);
    setIsLoading(true);

    try {
      const result: any = await loginApi(payload);

      if (result?.error) {
        const err: any = result.error;
        const msg = err?.response?.data?.message || err?.message || "Échec de connexion";
        setError(msg);
        return false;
      }

      const data: any = result?.data;
      const token = data?.token || data?.jwt || data?.access_token;

      if (!token) {
        setError("Token absent dans la réponse");
        return false;
      }

      // Stockage sécurisé du token
      await secureSetItem("auth_token", String(token));

      // Stockage user_data si présent
      const userData = {
        id: data?.id,
        username: data?.username,
        name: data?.name,
        email: data?.email || "",
      };
      await secureSetItem("user_data", JSON.stringify(userData));

      setUserInfo({ token, user: userData });
      return true;
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Erreur réseau");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { loginUser, isLoading, error, userInfo };
};

export default useLogin;
