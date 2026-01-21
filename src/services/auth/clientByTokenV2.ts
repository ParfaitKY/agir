import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type ClientByTokenV2Payload = {
  authtoken: string;
  device_id: string;
  brand: string;
  model: string;
  os: string;
  code_cryptage: string;
};

export const clientByTokenV2 = async (
  body: ClientByTokenV2Payload,
  headers: AuthHeaders = {}
) => {
  console.log(
    "=== [DEBUG] clientByTokenV2 Payload ===",
    JSON.stringify(body, null, 2)
  );
  const response = await handleRequest(
    httpClient.post(ENDPOINTS.CLIENT_BY_TOKEN_V2, body, { headers })
  );

  console.log(
    "=== [DEBUG] clientByTokenV2 Response ===",
    JSON.stringify(response.data, null, 2)
  );

  return response;
};
