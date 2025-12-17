# Intégration du flux OTP dans InitialSetupScreen

Ce guide explique comment brancher le flux OTP décrit dans `docs/otp-flow-apis.md` dans l’écran `InitialSetupScreen.tsx` afin d’identifier le client par numéro de compte, déclencher l’envoi d’un OTP, récupérer silencieusement le code et valider l’accès, sans Bearer token.

## Prérequis
- Base URL: `"https://zenithmobilereact-serveur-peyrie-test.app.mgdigitalplus.com/api"`
- Aucun en-tête `Authorization: Bearer ...`.
- Les champs requis dans les requêtes API: `numero_compte`, `device_id`, `code_cryptage` (+ métadonnées device côté `client-by-compte`).
- `device_id` doit être un UUID stable du téléphone.

## Points d’intégration dans l’app
- `InitialSetupScreen.tsx`:
  - Vérification du numéro de compte (Étape 1) dans `handleVerifyAccountNumber` dès que le compte est suffisamment saisi.
  - Navigation vers OTP et appel silencieux (Étape 2) après le succès de l’étape 1.
  - Validation finale (Étape 3) à la soumission du code.
- `OtpVerifyScreen.tsx`:
  - Afficher un patientateur pendant `silent-otp` et, en cas de succès, préremplir les champs OTP automatiquement.

## Références de code
- Déclenchement navigation OTP: `src/modules/auth/screens/InitialSetupScreen.tsx:146-156`
- Auto‑vérification compte (actuelle): `src/modules/auth/screens/InitialSetupScreen.tsx:243-266`
- Saisie et validation OTP: `src/modules/auth/screens/OtpVerifyScreen.tsx:139-225`

## Étape 1 – Appeler `client-by-compte` lors de la vérification
Branchez l’API dans `handleVerifyAccountNumber` pour:
- Reconnaitre le client
- Récupérer ses informations (dont devise)
- Déclencher l’envoi d’un OTP par SMS + email

Exemple (service minimal basé sur `fetch`):
```ts
async function clientByCompteApi(baseUrl: string, payload: {
  numero_compte: string
  device_id: string
  brand?: string
  model?: string
  os?: string
  code_cryptage: string
}) {
  const res = await fetch(`${baseUrl}/auth/client-by-compte`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
```

Injection dans `InitialSetupScreen`:
```ts
// Dans handleVerifyAccountNumber()
const baseUrl = 'https://zenithmobilereact-serveur-peyrie-test.app.mgdigitalplus.com/api'

setLoadingVerify(true)
try {
  const payload = {
    numero_compte: accountNumber,
    device_id: 'DEVICE-UUID-STABLE',
    brand: 'Samsung',
    model: 'Galaxy S23',
    os: 'Android 14',
    code_cryptage: 'Y}@128eVIXfoi7',
  }
  const r = await clientByCompteApi(baseUrl, payload)
  // r.success attendu, r.client contient infos + notification "OTP envoyé"
  // Persistez les infos minimales en mémoire/secure store si besoin
  // Naviguez vers OtpVerify (voir Étape 2)
} catch (e) {
  setVerifyError('Erreur lors de la vérification. Réessayez.')
} finally {
  setLoadingVerify(false)
}
```

## Étape 2 – `silent-otp`: patientateur et autoremplissage
Juste après succès de l’étape 1, au montage de l’écran OTP:
- Appel silencieux à `silent-otp` avec `numero_compte`, `device_id`, `code_cryptage`.
- Afficher un patientateur.
- Si `success === true` et `otp_code` présent, préremplir automatiquement les champs OTP.

Service:
```ts
async function silentOtpApi(baseUrl: string, payload: {
  numero_compte: string
  device_id: string
  code_cryptage: string
}) {
  const res = await fetch(`${baseUrl}/auth/silent-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
```

Côté `OtpVerifyScreen`, au montage:
```ts
// Pseudo‑code
setIsLoading(true)
try {
  const r = await silentOtpApi(baseUrl, {
    numero_compte: '1000CCHQ00000009001',
    device_id: 'DEVICE-UUID-STABLE',
    code_cryptage: 'Y}@128eVIXfoi7',
  })
  if (r.success && r.otp_code) {
    const digits = String(r.otp_code).replace(/\D/g, '').slice(0, 6).split('')
    // Injectez digits dans values (format 3–tiret–3), activez "Valider"
  }
} catch (e) {
  // Masquer le patientateur et laisser la saisie manuelle
} finally {
  setIsLoading(false)
}
```

## Étape 3 – `verify-otp`: validation finale
À la soumission:
- Appeler `verify-otp` avec `numero_compte`, `device_id`, `otp_code`, `code_cryptage`.
- Si succès: enregistrer le token de session de manière sécurisée et poursuivre.

Service:
```ts
async function verifyOtpApi(baseUrl: string, payload: {
  numero_compte: string
  device_id: string
  otp_code: string
  code_cryptage: string
}) {
  const res = await fetch(`${baseUrl}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
```

Soumission:
```ts
const r = await verifyOtpApi(baseUrl, {
  numero_compte: accountNumber,
  device_id: 'DEVICE-UUID-STABLE',
  otp_code: code, // concat des 6 digits
  code_cryptage: 'Y}@128eVIXfoi7',
})
if (r.success) {
  // r.session.token à stocker (SecureStore), puis poursuivre le flux
} else {
  // Afficher "Code incorrect"
}
```

## Gestion des états UI
- Patientateur:
  - Étape 1: pendant `client-by-compte`
  - Étape 2: pendant `silent-otp`
  - Étape 3: pendant `verify-otp` (optionnel)
- Annulation:
  - Utiliser le callback `onCancel` (déjà branché) pour réinitialiser `verifiedAccount`, vider `accountNumber` et revenir à l’étape 1.
- Erreurs:
  - Message générique côté UI; ne pas exposer les détails techniques à l’utilisateur.

## Sécurité / bonnes pratiques
- Ne pas stocker l’OTP en durable (uniquement en mémoire pour autoremplissage).
- Protéger le token de session (SecureStore).
- Respecter le TTL et prévoir le renvoi OTP en cas d’expiration.
- `device_id` doit être stable et non deviné; ne pas journaliser l’OTP.

## Résumé des modifications à faire
1. Créer les 3 fonctions services (`client-by-compte`, `silent-otp`, `verify-otp`) dans `src/services/auth/…`.
2. Brancher Étape 1 dans `handleVerifyAccountNumber` (`InitialSetupScreen.tsx:243-266`) avant la navigation OTP.
3. Dans `OtpVerifyScreen`, lancer Étape 2 au montage, préremplir si succès et activer le bouton.
4. À la soumission, appeler Étape 3, sauvegarder le token et poursuivre le flux.

Implémente le flux OTP (client-by-compte → silent-otp → verify-otp) dans InitialSetupScreen et OtpVerifyScreen, selon docs/otp-initialsetup-integration.md, sans Bearer, avec loader et autoremplissage. Base URL=https://zenithmobilereact-serveur-peyrie-test.app.mgdigitalplus.com/api, code_cryptage=Y}@128eVIXfoi7.