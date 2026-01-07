import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";
import { ClientByTokenV2Payload } from "./clientByTokenV2";

export const verifyTokenV2 = (
  body: ClientByTokenV2Payload,
  headers: AuthHeaders = {}
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.VERIFY_TOKEN_V2, body, { headers })
  );
};
