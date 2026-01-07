import { useState, useCallback } from "react";
import { clientByTokenV2 } from "../../services/auth/clientByTokenV2";
import { secureSetItem, secureGetItem } from "../../shared/utils/secureStorage";
import { Platform } from "react-native";
import { useI18n } from "../../app/providers/I18nProvider";

export type TokenInfo = {
  autoplay: boolean;
  token_id: string;
  client_id: string;
  token_type: string;
  validation_status: string;
};

export type ClientInfoV2 = {
  token_info?: TokenInfo;
  [key: string]: any;
};

type FetchPayload = { authtoken: string };

export const useClientByTokenV2 = () => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientData, setClientData] = useState<ClientInfoV2 | null>(null);

  const fetchClientInfo = useCallback(async (payload: FetchPayload) => {
    setError(null);
    setIsLoading(true);
    try {
      const authtoken = payload?.authtoken?.trim();
      if (!authtoken) {
        setError("Token invalide");
        return false;
      }

      let device_id = await secureGetItem("device_id");
      if (!device_id) {
        const rand = Math.random().toString(36).slice(2);
        const t = Date.now().toString(36);
        device_id = `${Platform.OS}-${t}-${rand}`.toUpperCase();
        await secureSetItem("device_id", device_id);
      }
      let os = `${Platform.OS} ${Platform.Version}`;
      let brand = "Unknown";
      let model = "Unknown";

      try {
        const Device: any = await import("expo-device");
        const osName = Device?.osName;
        const osVersion = Device?.osVersion;
        const devBrand = Device?.brand;
        const devModel =
          Device?.modelName ?? Device?.modelId ?? Device?.deviceName;

        if (osName || osVersion) {
          os = `${osName ?? Platform.OS} ${osVersion ?? Platform.Version}`;
        }
        if (devBrand) brand = String(devBrand);
        if (devModel) model = String(devModel);
      } catch (err) {
        console.warn("[Device Info] Error capturing device info:", err);
      }

      // Web Fallback
      if (Platform.OS === "web") {
        const ua = (globalThis as any)?.navigator?.userAgent || "";
        if (ua.includes("Windows")) {
          os = "Windows";
          brand = "PC";
          model = "Windows PC";
        } else if (ua.includes("Macintosh")) {
          os = "macOS";
          brand = "Apple";
          model = "Mac";
        } else if (ua.includes("Linux")) {
          os = "Linux";
          brand = "PC";
          model = "Linux PC";
        } else if (ua.includes("Android")) {
          os = "Android (Web)";
          brand = "Mobile";
          model = "Android Browser";
        } else if (ua.includes("iPhone")) {
          os = "iOS (Web)";
          brand = "Apple";
          model = "iPhone/iPad Browser";
        } else {
          brand = "Web Browser";
          model = ua;
        }
      }

      const headers: any = { "X-NO-AUTH": "true" };
      const result = await clientByTokenV2(
        {
          authtoken,
          device_id,
          brand,
          model,
          os,
          code_cryptage: "Y}@128eVIXfoi7",
        },
        headers
      );

      if (result.error) {
        const err: any = result.error;
        const serverMsg = err?.response?.data?.message || err?.message;
        setError(serverMsg || t("api.error.fetchFailed"));
        return false;
      }

      const data = result.data as any;
      if (!data) {
        setError(t("api.error.emptyResponse"));
        return false;
      }

      // Extract token_info if present
      const token_info =
        data.token_info || data.data?.token_info || data.result?.token_info;

      console.log(
        "=== [DEBUG] Server Response Data ===",
        JSON.stringify(data, null, 2)
      );
      console.log(
        "=== [DEBUG] Extracted token_info ===",
        JSON.stringify(token_info, null, 2)
      );

      // Save the input authtoken permanently as requested
      await secureSetItem("auth_token_init", authtoken);

      // We should probably normalize client data similar to V1 if the structure is similar
      // But for now, let's return the raw data + token_info
      const finalData = { ...data, token_info };
      setClientData(finalData);

      // If we need to extract standard client info (name, etc) to save to storage like V1:
      // We can reuse logic from useClientByCompte if needed, but the user instructions focused on token handling.
      // I'll leave the data parsing to the UI or add it if I see the structure is compatible.
      // Assuming V2 returns similar client details mixed in.

      return finalData;
    } catch (e) {
      const msg = (e as any)?.message ?? "Erreur réseau";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchClientInfo, isLoading, error, clientData };
};

export default useClientByTokenV2;
