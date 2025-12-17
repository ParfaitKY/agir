import { handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";
import { httpClientOtp } from "../otpClient";

export type SilentOtpPayload = {
  numero_compte: string;
  device_id: string;
  code_cryptage: string;
};

export const silentOtp = (body: SilentOtpPayload, headers: AuthHeaders = {}) => {
  return handleRequest(httpClientOtp.post(ENDPOINTS.SILENT_OTP, body, { headers }));
};
