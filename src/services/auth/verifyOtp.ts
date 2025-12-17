import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type VerifyOtpPayload = {
  numero_compte: string;
  device_id: string;
  otp_code: string;
  code_cryptage: string;
};

export const verifyOtp = (body: VerifyOtpPayload, headers: AuthHeaders = {}) => {
  return handleRequest(httpClient.post(ENDPOINTS.VERIFY_OTP, body, { headers }));
};

