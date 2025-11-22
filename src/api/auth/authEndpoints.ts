export const AUTH_ENDPOINTS = {
  login: "/api/auth/login",
  getAccess: "/api/auth/get-access",
  updateLogin: "/api/auth/update-login",
  clientByCompte: "/api/auth/client-by-compte",
} as const;

export type AuthEndpointKey = keyof typeof AUTH_ENDPOINTS;

