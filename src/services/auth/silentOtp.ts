import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type SilentOtpPayload = {
  numero_compte: string;
  device_id: string;
  code_cryptage: string;
};

export const silentOtp = (body: SilentOtpPayload, headers: AuthHeaders = {}) => {
  return handleRequest(httpClient.post(ENDPOINTS.SILENT_OTP, body, { headers }));
};

