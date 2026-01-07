import { useState, useCallback } from "react";
import { verifyTokenV2 } from "../../services/auth/verifyTokenV2";
import { secureGetItem, secureSetItem } from "../../shared/utils/secureStorage";
import { Platform } from "react-native";

export const useVerifyTokenV2 = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authtoken = await secureGetItem("auth_token_init");
      if (!authtoken) {
        return false; // No token to verify
      }

      let device_id = await secureGetItem("device_id");
      // If no device_id, we probably shouldn't be verifying, but let's be safe
      if (!device_id) device_id = "UNKNOWN";

      let os = `${Platform.OS} ${Platform.Version}`;
      let brand = "Unknown";
      let model = "Unknown";

      try {
        const Device: any = await import("expo-device");
        const osName = Device?.osName;
        const osVersion = Device?.osVersion;
        const devBrand = Device?.brand;
        const devModel = Device?.modelName ?? Device?.modelId ?? Device?.deviceName;

        if (osName || osVersion) {
          os = `${osName ?? Platform.OS} ${osVersion ?? Platform.Version}`;
        }
        if (devBrand) brand = String(devBrand);
        if (devModel) model = String(devModel);
      } catch (err) {}

       // Web Fallback
       if (Platform.OS === "web") {
        const ua = (globalThis as any)?.navigator?.userAgent || "";
        if (ua.includes("Windows")) { os = "Windows"; brand = "PC"; model = "Windows PC"; }
        else if (ua.includes("Macintosh")) { os = "macOS"; brand = "Apple"; model = "Mac"; }
        else if (ua.includes("Linux")) { os = "Linux"; brand = "PC"; model = "Linux PC"; }
        else if (ua.includes("Android")) { os = "Android (Web)"; brand = "Mobile"; model = "Android Browser"; }
        else if (ua.includes("iPhone")) { os = "iOS (Web)"; brand = "Apple"; model = "iPhone/iPad Browser"; }
        else { brand = "Web Browser"; model = ua; }
      }

      const result = await verifyTokenV2({
        authtoken,
        device_id,
        brand,
        model,
        os,
        code_cryptage: "Y}@128eVIXfoi7",
      });

      if (result.error) {
        // Token invalid or server error
        return false;
      }

      return true; // Valid
    } catch (e) {
      console.error("Token verification failed", e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { verifyToken, isLoading, error };
};
