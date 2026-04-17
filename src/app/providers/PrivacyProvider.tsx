import React, { createContext, useContext, useEffect, useState } from "react";
import { secureGetItem, secureSetItem } from "../../shared/utils/secureStorage";

const PRIVACY_ACCEPTED_KEY = "privacy_policy_accepted";

interface PrivacyContextType {
  privacyAccepted: boolean;
  privacyChecked: boolean;
  markPrivacyAccepted: () => Promise<void>;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  useEffect(() => {
    const checkPrivacy = async () => {
      // Timeout de sécurité pour s'assurer que privacyChecked devient vrai
      const safetyTimeout = setTimeout(() => {
        if (!privacyChecked) {
          console.warn(
            "[PrivacyProvider] Safety timeout reached, forcing privacyChecked to true",
          );
          setPrivacyChecked(true);
        }
      }, 2000);

      try {
        const value = await secureGetItem(PRIVACY_ACCEPTED_KEY);
        console.log("[PrivacyProvider] Read privacy state:", value);
        setPrivacyAccepted(value === "true");
      } catch (error) {
        console.warn("[PrivacyProvider] Error reading privacy state:", error);
        setPrivacyAccepted(false);
      } finally {
        clearTimeout(safetyTimeout);
        setPrivacyChecked(true);
      }
    };
    checkPrivacy();
  }, []);

  const markPrivacyAccepted = async () => {
    try {
      await secureSetItem(PRIVACY_ACCEPTED_KEY, "true");
      setPrivacyAccepted(true);
    } catch (error) {
      console.warn(
        "[PrivacyProvider] Failed to save privacy accepted flag:",
        error,
      );
    }
  };

  return (
    <PrivacyContext.Provider
      value={{ privacyAccepted, privacyChecked, markPrivacyAccepted }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error("usePrivacy must be used within a PrivacyProvider");
  }
  return context;
};
