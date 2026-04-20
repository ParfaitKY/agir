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
  // Champs optionnels renvoyés après validation OTP
  access_token?: string;
  token?: string;
  jwt?: string;
  data?: {
    access_token?: string;
    token?: string;
    OP_CODEOPERATEURGESTIONNAIRECOMPTEMOBILE?: string;
    CL_IDCLIENT?: string | number;
    SL_LOGIN?: string;
    [key: string]: any;
  };
};

export const verifyOtpSimple = (
  body: VerifyOtpSimplePayload,
  headers: AuthHeaders = {},
) => {
  return handleRequest<VerifyOtpSimpleResponse>(
    httpClientOtp.post(ENDPOINTS.VERIFY_OTP_SIMPLE, body, { headers }),
  );
};
