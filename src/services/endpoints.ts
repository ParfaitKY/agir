export const BASE_URL =
  //"https://zenithmobilereact-serveur-mgd.app.mgdigitalplus.com/api";
  "https://zenithmobilereact-serveur-peyrie-test.app.mgdigitalplus.com/api";
//"https://zenithmobile-serveurreact-cedaiciprod.app.mgdigitalplus.com/api";

export const ENDPOINTS = {
  LOGIN: "/auth/login",
  CLIENT_BY_COMPTE: "/auth/client-by-compte",
  CLIENT_BY_TOKEN_V2: "/auth/client-by-compte-avec-token-v2",
  VERIFY_TOKEN_V2: "/auth/verification-token-v2",
  SILENT_OTP: "/auth/silent-otp",
  VERIFY_OTP: "/auth/verify-otp",
  UPDATE_LOGIN: "/auth/update-login",
  GET_ACCESS: "/auth/get-access",
  COMPTE_LIST: "/compte/comptes",
  COMPTE_STATS: "/compte/comptesstatistique",
  DERNIERE_TRANSACTION: "/compte/derniere-transaction",
  ANALYSE_DERNIERE_TRANSACTION: "/compte/analyse-derniere-transaction",
  SOLDE: "/compte/solde",
  SOLDE_GLOBALE: "/compte/soldeglobale",
  VIREMENT: "/compte/virementcompteacompte",
  BLOQUE_COMPTE: "/compte/blocages-compte",
  DERNIERES_OPERATIONS_CLIENT: "/compte/dernieres-operations-client",
  CREDIT_DEMANDE: "/credit/demande",
};
