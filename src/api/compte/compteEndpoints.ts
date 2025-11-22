export const COMPTE_ENDPOINTS = {
  comptes: "/api/compte/comptes",
  derniereTransaction: "/api/compte/derniere-transaction",
  solde: "/api/compte/solde",
} as const;

export type CompteEndpointKey = keyof typeof COMPTE_ENDPOINTS;

