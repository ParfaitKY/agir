import { handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";
import { httpClientOtp } from "../otpClient";

export type VerifyOtpSimplePayload = {
  user_id: string;
  otp_code: string;
};

export type VerifyOtpSimpleResponse = {
  success: boolean;
  message: string;
};

export const verifyOtpSimple = (
  body: VerifyOtpSimplePayload,
  headers: AuthHeaders = {},
) => {
  return handleRequest<VerifyOtpSimpleResponse>(
    httpClientOtp.post(ENDPOINTS.VERIFY_OTP_SIMPLE, body, { headers }),
  );
};
