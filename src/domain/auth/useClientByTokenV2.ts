import { useState, useCallback } from "react";
import { clientByTokenV2 } from "../../services/auth/clientByTokenV2";
import { secureSetItem, secureGetItem } from "../../shared/utils/secureStorage";
import { Platform } from "react-native";
import { useI18n } from "../../app/providers/I18nProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";

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

      // RÉTABLISSEMENT ROBUSTE: Double check SecureStore + AsyncStorage
      let device_id = await secureGetItem("device_id");

      if (!device_id) {
        // Fallback sur AsyncStorage si SecureStore a échoué
        device_id = await AsyncStorage.getItem("device_id_backup");
      }

      // TENTATIVE D'EXTRACTION DU DEVICE_ID DEPUIS LE JWT (si c'est un JWT)
      if (authtoken.split(".").length === 3) {
        try {
          // Fonction de décodage simple (polyfill atob si nécessaire)
          const decodeBase64 = (input: string) => {
            const chars =
              "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            let str = input.replace(/=+$/, "");
            let output = "";
            if (str.length % 4 == 1) {
              throw new Error(
                "'atob' failed: The string to be decoded is not correctly encoded."
              );
            }
            for (
              let bc = 0, bs = 0, buffer, i = 0;
              (buffer = str.charAt(i++));
              ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
                ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
                : 0
            ) {
              buffer = chars.indexOf(buffer);
            }
            return output;
          };

          const base64Url = authtoken.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            decodeBase64(base64)
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join("")
          );
          const payloadObj = JSON.parse(jsonPayload);

          // CORRECTION: Utiliser device_id OU deviceId selon la convention du token
          const extractedDeviceId = payloadObj.device_id || payloadObj.deviceId;
          const extractedBrand = payloadObj.brand || payloadObj.device_brand;
          const extractedModel = payloadObj.model || payloadObj.device_model;
          const extractedOs = payloadObj.os || payloadObj.device_os;

          if (extractedDeviceId) {
            console.log(
              "[useClientByTokenV2] Found device_id in JWT:",
              extractedDeviceId
            );
            device_id = String(extractedDeviceId);
            await secureSetItem("device_id", device_id);
            await AsyncStorage.setItem("device_id_backup", device_id);
          }

          if (extractedBrand) {
            await secureSetItem("device_brand_token", String(extractedBrand));
            await AsyncStorage.setItem(
              "device_brand_backup",
              String(extractedBrand)
            );
          }
          if (extractedModel) {
            await secureSetItem("device_model_token", String(extractedModel));
            await AsyncStorage.setItem(
              "device_model_backup",
              String(extractedModel)
            );
          }
          if (extractedOs) {
            await secureSetItem("device_os_token", String(extractedOs));
            await AsyncStorage.setItem("device_os_backup", String(extractedOs));
          }
        } catch (e) {
          console.warn("[useClientByTokenV2] Failed to decode JWT:", e);
        }
      }

      // Si aucun device_id n'a été trouvé, on en génère un STABLE basé sur le matériel
      if (!device_id) {
        // Utilisation de l'ID Vendor qui est plus stable (survit souvent aux réinstallations)
        let stableId = null;
        try {
          if (Platform.OS === "android") {
            stableId = await Application.getAndroidId();
          } else if (Platform.OS === "ios") {
            stableId = await Application.getIosIdForVendorAsync();
          }
        } catch (err) {
          console.warn("[useClientByTokenV2] Failed to get stable ID:", err);
        }

        if (stableId) {
          // On ajoute un préfixe pour le distinguer mais on garde la partie stable
          device_id = `${Platform.OS}-${stableId}`.toUpperCase();
          console.log(
            "[useClientByTokenV2] Using STABLE device_id:",
            device_id
          );
        } else {
          // Fallback aléatoire si l'ID stable échoue
          const rand = Math.random().toString(36).slice(2);
          const t = Date.now().toString(36);
          device_id = `${Platform.OS}-${t}-${rand}`.toUpperCase();
          console.log(
            "[useClientByTokenV2] Generating RANDOM device_id:",
            device_id
          );
        }

        await secureSetItem("device_id", device_id);
        await AsyncStorage.setItem("device_id_backup", device_id);
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

      // Prioritize extracted info from token to match server expectations for autoplay
      const tokenBrand =
        (await secureGetItem("device_brand_token")) ||
        (await AsyncStorage.getItem("device_brand_backup"));
      const tokenModel =
        (await secureGetItem("device_model_token")) ||
        (await AsyncStorage.getItem("device_model_backup"));
      const tokenOs =
        (await secureGetItem("device_os_token")) ||
        (await AsyncStorage.getItem("device_os_backup"));

      if (tokenBrand) brand = tokenBrand;
      if (tokenModel) model = tokenModel;
      if (tokenOs) os = tokenOs;

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

      // Truncate strings to avoid SQL truncation errors (Error 8152)
      const safeTruncate = (str: string, length: number) => {
        if (!str) return "";
        return str.length > length ? str.substring(0, length) : str;
      };

      const finalBrand = safeTruncate(brand, 30);
      const finalModel = safeTruncate(model, 30);
      const finalOs = safeTruncate(os, 30);
      const finalDeviceId = safeTruncate(device_id, 80);

      const headers: any = { "X-NO-AUTH": "true" };
      const result = await clientByTokenV2(
        {
          authtoken,
          device_id: finalDeviceId,
          brand: finalBrand,
          model: finalModel,
          os: finalOs,
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

      // Si le serveur renvoie un device_id associé au token, on met à jour notre device_id local
      const serverDeviceId = token_info?.device_id || data?.device_id;
      if (serverDeviceId && typeof serverDeviceId === "string") {
        console.log(
          `[useClientByTokenV2] Updating local device_id from ${device_id} to ${serverDeviceId}`
        );
        await secureSetItem("device_id", serverDeviceId);
        await AsyncStorage.setItem("device_id_backup", serverDeviceId);

        // RETRY LOGIC: Si le device_id envoyé était différent de celui attendu par le serveur
        if (device_id !== serverDeviceId) {
          console.log(
            "[useClientByTokenV2] Mismatch detected. Retrying with correct device_id..."
          );
          const retryResult = await clientByTokenV2(
            {
              authtoken,
              device_id: safeTruncate(serverDeviceId, 80),
              brand: finalBrand,
              model: finalModel,
              os: finalOs,
              code_cryptage: "Y}@128eVIXfoi7",
            },
            headers
          );

          if (!retryResult.error && retryResult.data) {
            const retryData = retryResult.data as any;
            const retryTokenInfo =
              retryData.token_info ||
              retryData.data?.token_info ||
              retryData.result?.token_info;
            console.log(
              "=== [DEBUG] Retry Response Data ===",
              JSON.stringify(retryData, null, 2)
            );
            // On fusionne les nouvelles données
            const finalRetryData = { ...retryData, token_info: retryTokenInfo };
            setClientData(finalRetryData);
            return finalRetryData;
          }
        }
      }

      // We should probably normalize client data similar to V1 if the structure is similar
      const finalData = { ...data, token_info };
      setClientData(finalData);

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
