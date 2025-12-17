import { handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";
import { httpClientOtp } from "../otpClient";

export type VerifyOtpPayload = {
  numero_compte: string;
  device_id: string;
  otp_code: string;
  code_cryptage: string;
};

export const verifyOtp = (body: VerifyOtpPayload, headers: AuthHeaders = {}) => {
  return handleRequest(httpClientOtp.post(ENDPOINTS.VERIFY_OTP, body, { headers }));
};
