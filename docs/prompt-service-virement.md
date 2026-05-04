# Prompt — Intégration du Service de Virement

> Ce document décrit exactement comment le service de virement est implémenté dans l'application React Native (Expo).  
> Utilise-le comme référence pour reproduire la même intégration dans une autre application connectée au même backend.

---

## 1. Contexte & Architecture

L'application utilise :

- **Axios** comme client HTTP (`httpClient` — instance partagée)
- **Expo SecureStore** pour la persistance sécurisée des tokens et données de session
- Un pattern **service → domain hook → screen** en 3 couches

```
src/
├── services/
│   ├── httpClient.ts              ← Instance Axios + intercepteurs globaux
│   ├── endpoints.ts               ← Constantes d'URL
│   └── compte/
│       ├── virement.ts            ← Appel API brut
│       └── verifyBeneficiaryAccount.ts  ← Vérification du compte destinataire
├── domain/
│   └── compte/
│       ├── useVirement.ts         ← Hook métier du virement
│       └── useVerifyBeneficiary.ts ← Hook de vérification bénéficiaire
└── modules/
    └── transactions/
        └── screens/
            └── TransferScreen.tsx ← Écran UI
```

---

## 2. Configuration de base

### `src/services/endpoints.ts`

```typescript
export const BASE_URL =
  "https://zenithmobile-serveurreact-cedaicitest.app.mgdigitalplus.com/api";

export const CODECRYPTAGE = "Y}@128eVIXfoi7";

export const ENDPOINTS = {
  LOGIN: "/auth/login",
  CLIENT_BY_COMPTE: "/auth/client-by-compte",
  VIREMENT: "/compte/virementcompteacompte",
  // ... autres endpoints
};
```

### `src/services/httpClient.ts` — Points clés

- Instance Axios avec `baseURL`, `timeout: 20000`, headers JSON
- **Intercepteur request** : lit `auth_token` depuis SecureStore et injecte `Authorization: Bearer <token>` automatiquement sur toutes les requêtes (sauf celles marquées `X-NO-AUTH: true`)
- **Intercepteur response** : sur 401/403, émet un événement global `auth:expired` qui déclenche le logout automatique
- Fonction utilitaire `handleRequest<T>()` qui wrappe les appels Axios en `{ data?, error? }` (jamais de throw)
- Fonction `extractErrorMessage()` pour normaliser les messages d'erreur (réseau, timeout, serveur)

```typescript
// Pattern de retour de tous les services
export type RequestResult<T = any> = {
  data?: T;
  error?: unknown;
};
```

---

## 3. Service API — Virement

### `src/services/compte/virement.ts`

```typescript
import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export type VirementPayload = {
  MC_DATEJOURNEE: string; // "dd/MM/yyyy"
  CO_CODECOMPTEEMETTEUR: string; // Numéro de compte source (chiffres uniquement)
  CO_CODECOMPTEDESTINATAIRE: string; // Numéro de compte destinataire (chiffres uniquement)
  MC_MONTANT: string | number; // Montant en string ou number
  LG_CODELANGUE: string; // "fr"
  TYPEOPERATION: string; // "02" pour virement
  CODECRYPTAGE: string; // "Y}@128eVIXfoi7"
  MC_TERMINAL?: string; // "" (vide)
  MC_AUTRE1?: string; // "" (vide)
  MC_AUTRE2?: string; // "" (vide)
  MC_AUTRE3?: string; // "" (vide)
  OP_CODEOPERATEUR?: string; // Code opérateur (récupéré depuis SecureStore "code_operateur")
};

export const virement = (body: VirementPayload, headers: AuthHeaders = {}) => {
  return handleRequest(httpClient.post(ENDPOINTS.VIREMENT, body, { headers }));
};
```

**Endpoint :** `POST /compte/virementcompteacompte`  
**Auth :** Bearer token injecté automatiquement par l'intercepteur (pas besoin de le passer manuellement)

---

## 4. Service API — Vérification du compte bénéficiaire

### `src/services/compte/verifyBeneficiaryAccount.ts`

```typescript
import { httpClient, handleRequest, AuthHeaders } from "../httpClient";
import { ENDPOINTS, CODECRYPTAGE } from "../endpoints";

export type VerifyBeneficiaryAccountPayload = {
  numero_compte: string; // Numéro de compte à vérifier (uppercase)
  device_id?: string; // Identifiant unique de l'appareil
  brand?: string; // Marque de l'appareil
  model?: string; // Modèle de l'appareil
  os?: string; // OS de l'appareil
  code_cryptage?: string; // "Y}@128eVIXfoi7"
};

export type BeneficiaryAccountInfo = {
  NUMEROCOMPTE: string;
  CO_INTITULECOMPTE: string;
  NOM_TITULAIRE?: string;
  PRENOM_TITULAIRE?: string;
  SOLDE?: number;
  STATUT?: string;
  IDCLIENT?: string;
};

export const verifyBeneficiaryAccount = (
  body: VerifyBeneficiaryAccountPayload,
  headers: AuthHeaders = {},
) => {
  return handleRequest(
    httpClient.post(ENDPOINTS.CLIENT_BY_COMPTE, body, { headers }),
  );
};
```

**Endpoint :** `POST /auth/client-by-compte`  
**Auth :** Pas de token requis — passer `{ "X-NO-AUTH": "true" }` dans les headers pour bypasser l'intercepteur

> ⚠️ Sur Web, le header `X-NO-AUTH` est supprimé avant envoi (CORS preflight). L'URL `/auth/client-by-compte` est aussi whitelistée dans l'intercepteur pour ne pas injecter de token.

---

## 5. Hook métier — `useVirement`

### `src/domain/compte/useVirement.ts`

```typescript
import { useState, useCallback } from "react";
import { virement } from "../../services/compte/virement";
import { secureGetItem } from "../../shared/utils/secureStorage";
import { extractErrorMessage } from "../../services/httpClient";

export const useVirement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  const submit = useCallback(
    async (payload: {
      emitter: string; // Numéro de compte source
      beneficiary: string; // Numéro de compte destinataire
      amount: string | number;
    }) => {
      setError(null);
      setIsLoading(true);
      try {
        // Récupération des données de session
        const clientId = await secureGetItem("client_id");
        const token = await secureGetItem("auth_token");
        const codeOperateur = await secureGetItem("code_operateur");
        const operateur = codeOperateur || clientId || "100000006"; // fallback

        if (!clientId || !token) {
          setError("Session expirée. Reconnectez-vous.");
          return false;
        }

        // Nettoyage des numéros de compte (chiffres uniquement)
        const emitter = String(payload.emitter || "").replace(/\D/g, "");
        const dest = String(payload.beneficiary || "").replace(/\D/g, "");
        const amount = String(payload.amount || "0");

        if (!emitter || !dest || Number(amount) <= 0) {
          setError("Données invalides");
          return false;
        }

        // Construction de la date du jour
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = String(d.getFullYear());

        const body = {
          MC_DATEJOURNEE: `${dd}/${mm}/${yyyy}`,
          CO_CODECOMPTEEMETTEUR: emitter,
          CO_CODECOMPTEDESTINATAIRE: dest,
          MC_MONTANT: amount,
          LG_CODELANGUE: "fr",
          TYPEOPERATION: "02",
          CODECRYPTAGE: "Y}@128eVIXfoi7",
          MC_TERMINAL: "",
          MC_AUTRE1: "",
          MC_AUTRE2: "",
          MC_AUTRE3: "",
          OP_CODEOPERATEUR: operateur,
        };

        const headers = { Authorization: `Bearer ${token}` };
        const result: any = await virement(body, headers);

        if (result?.error) {
          setError(extractErrorMessage(result.error, "Échec du virement"));
          return false;
        }

        setData(result?.data ?? null);
        return true; // succès
      } catch (e: any) {
        setError(extractErrorMessage(e, "Échec du virement"));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { submit, isLoading, error, data };
};
```

**Données lues depuis SecureStore :**

| Clé              | Description                                          |
| ---------------- | ---------------------------------------------------- |
| `auth_token`     | JWT de session (obligatoire)                         |
| `client_id`      | Code client (obligatoire)                            |
| `code_operateur` | Code opérateur (optionnel, fallback sur `client_id`) |

---

## 6. Hook métier — `useVerifyBeneficiary`

### `src/domain/compte/useVerifyBeneficiary.ts`

Vérifie qu'un numéro de compte existe avant d'effectuer le virement.

```typescript
const { verify, reset, isLoading, error, beneficiaryInfo } =
  useVerifyBeneficiary();

// Appel
const result = await verify("123456789012");
// result = { success: true, data: BeneficiaryAccountInfo }
// ou      = { success: false, error: "message" }
```

**Logique interne :**

1. Valide que le numéro fait au moins 8 caractères
2. Récupère `device_id` depuis SecureStore (ou en génère un)
3. Détecte l'OS/brand/model via `expo-device` (avec fallback Web via `navigator.userAgent`)
4. Appelle `POST /auth/client-by-compte` avec `X-NO-AUTH: true`
5. Normalise la réponse (gère les structures `data`, `result`, `payload`, tableau, etc.)
6. Extrait : `NOM_TITULAIRE`, `PRENOM_TITULAIRE`, `NUMEROCOMPTE`, `CO_INTITULECOMPTE`, `IDCLIENT`

**Champs de réponse normalisés (noms alternatifs gérés) :**

| Champ final         | Noms API possibles                                               |
| ------------------- | ---------------------------------------------------------------- |
| `NOM_TITULAIRE`     | `NOMCLIENT`, `NOM`, `nom`, `lastName`, `NOM_CLIENT`              |
| `PRENOM_TITULAIRE`  | `PRENOMCLIENT`, `PRENOM`, `prenom`, `firstName`, `PRENOM_CLIENT` |
| `NUMEROCOMPTE`      | `NUMCOMPTE`, `compte`, `ACCOUNT_NUMBER`, `CO_CODECOMPTE`         |
| `CO_INTITULECOMPTE` | `TYPE_COMPTE`, `INTITULE`                                        |
| `IDCLIENT`          | `CLIENT_ID`, `CODECLIENT`                                        |

---

## 7. Gestion des bénéficiaires — `useBeneficiaires`

Les bénéficiaires sont stockés **localement** dans SecureStore (pas d'API dédiée).

```typescript
export interface Beneficiaire {
  id: string; // timestamp string
  name: string;
  accountNumber: string;
  bank: string;
  email?: string;
  favorite: boolean;
  color: string; // couleur aléatoire parmi 8 couleurs prédéfinies
  createdAt: string; // ISO string
  lastTransferAmount?: number;
  lastTransferDate?: string; // ISO string
}
```

**Clé de stockage :** `beneficiaires_${userId || "default"}`

**Méthodes exposées :**

| Méthode                                 | Description                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `addBeneficiaire(data)`                 | Ajoute un bénéficiaire                                                         |
| `deleteBeneficiaire(id)`                | Supprime par ID                                                                |
| `toggleFavorite(id)`                    | Bascule le favori                                                              |
| `updateBeneficiaire(id, data)`          | Mise à jour partielle                                                          |
| `recordTransfer(accountNumber, amount)` | Met à jour `lastTransferAmount` et `lastTransferDate` après un virement réussi |
| `reload()`                              | Recharge depuis le storage                                                     |
| `getInitials(name)`                     | Retourne les initiales (2 lettres)                                             |

---

## 8. Écran UI — `TransferScreen`

### Flux utilisateur

```
1. Chargement du compte source (depuis compteStats ou SecureStore "user_account_number")
2. Saisie du compte destinataire (chiffres uniquement, min 8 chiffres)
3. Saisie du montant (> 0)
4. Bouton "Valider" → ouvre une Modal de confirmation
5. Confirmation → appel submit() de useVirement
6. Si succès → recordTransfer() pour mettre à jour le bénéficiaire
```

### Pré-remplissage depuis la navigation

```typescript
// Depuis un autre écran, passer un bénéficiaire en paramètre :
navigation.navigate("Transfer", {
  beneficiary: { accountNumber: "123456789012" },
  account: { number: "987654321", type: "Compte Courant", balance: "150000" },
});
```

### Validation du formulaire

```typescript
const canSubmit =
  sanitize(sourceAccount).length > 0 &&
  sanitize(destinationAccount).length > 8 && // Au moins 8 chiffres
  Number(String(amount).replace(/[,\s]/g, "")) > 0;
```

### Nettoyage des numéros de compte

```typescript
const sanitize = (s: string) => s.replace(/\D/g, ""); // Chiffres uniquement
```

---

## 9. Payload complet du virement (référence)

```json
{
  "MC_DATEJOURNEE": "30/04/2026",
  "CO_CODECOMPTEEMETTEUR": "123456789012",
  "CO_CODECOMPTEDESTINATAIRE": "987654321098",
  "MC_MONTANT": "50000",
  "LG_CODELANGUE": "fr",
  "TYPEOPERATION": "02",
  "CODECRYPTAGE": "Y}@128eVIXfoi7",
  "MC_TERMINAL": "",
  "MC_AUTRE1": "",
  "MC_AUTRE2": "",
  "MC_AUTRE3": "",
  "OP_CODEOPERATEUR": "100000006"
}
```

**Headers HTTP :**

```
Authorization: Bearer <auth_token>
Content-Type: application/json
Accept: application/json
```

---

## 10. Payload complet de vérification bénéficiaire (référence)

```json
{
  "numero_compte": "987654321098",
  "device_id": "WEB-ABC123-XYZ",
  "brand": "PC",
  "model": "Windows PC",
  "os": "Windows",
  "code_cryptage": "Y}@128eVIXfoi7"
}
```

**Headers HTTP :**

```
Content-Type: application/json
Accept: application/json
(Pas de Authorization — endpoint public)
```

---

## 11. Données SecureStore requises

Pour que le service de virement fonctionne, ces clés doivent être présentes dans SecureStore au moment de l'appel :

| Clé                   | Obligatoire  | Source      | Description                               |
| --------------------- | ------------ | ----------- | ----------------------------------------- |
| `auth_token`          | ✅           | Login       | JWT Bearer token                          |
| `client_id`           | ✅           | Login       | Code client bancaire                      |
| `code_operateur`      | ⚠️ optionnel | Login PIN   | Code opérateur (fallback sur `client_id`) |
| `user_account_number` | ⚠️ optionnel | Setup       | Numéro de compte par défaut               |
| `device_id`           | ⚠️ optionnel | Auto-généré | ID unique de l'appareil                   |

---

## 12. Gestion des erreurs

Tous les appels retournent `{ data?, error? }` — jamais de throw.

```typescript
const result = await virement(body, headers);

if (result?.error) {
  // Utiliser extractErrorMessage() pour un message lisible
  const msg = extractErrorMessage(result.error, "Échec du virement");
  // Cas gérés :
  // - "Network Error" → "Impossible de contacter le serveur. Vérifiez votre connexion."
  // - timeout        → "La requête a pris trop de temps. Réessayez."
  // - 401/403        → "Session expirée. Reconnectez-vous."
  // - 404            → "Ressource introuvable."
  // - 5xx            → "Erreur serveur. Réessayez plus tard."
  // - message serveur explicite → retourné tel quel
}
```

**Logout automatique sur 401/403 :** L'intercepteur Axios émet `auth:expired` → `AuthProvider` appelle `logout()` automatiquement.

---

## 13. Checklist d'intégration

Pour reproduire ce service dans une autre application :

- [ ] Créer `httpClient.ts` avec instance Axios + intercepteurs (auth token + logout sur 401)
- [ ] Créer `endpoints.ts` avec `BASE_URL`, `CODECRYPTAGE`, et `ENDPOINTS.VIREMENT`
- [ ] Créer `services/compte/virement.ts` avec le type `VirementPayload`
- [ ] Créer `services/compte/verifyBeneficiaryAccount.ts` avec `X-NO-AUTH` header
- [ ] Créer `domain/compte/useVirement.ts` — lire `auth_token`, `client_id`, `code_operateur` depuis le storage sécurisé
- [ ] Créer `domain/compte/useVerifyBeneficiary.ts` — normaliser la réponse multi-format
- [ ] S'assurer que `code_operateur` est sauvegardé lors du login PIN (champ `OP_CODEOPERATEURGESTIONNAIRECOMPTEMOBILE`)
- [ ] Appeler `recordTransfer()` après chaque virement réussi pour mettre à jour l'historique bénéficiaire
- [ ] Valider le compte destinataire (min 8 chiffres) avant d'activer le bouton de soumission
