# Flux OTP – Spécification APIs (sans Bearer)

## Vue d’ensemble
- Étape 1 – `client-by-compte`: identifier le client et son compte, récupérer ses informations (dont devises) et déclencher l’envoi d’un OTP par SMS et email.
- Étape 2 – `silent-otp`: appel silencieux pour récupérer le code OTP lié au device et au compte, afficher un patientateur pendant le chargement, puis préremplir automatiquement les champs OTP si succès.
- Étape 3 – `verify-otp`: vérification finale du code OTP pour valider la connexion.
- Aucun en-tête d’autorisation de type Bearer n’est utilisé.

Base URL (exemple):
`"https://zenithmobilereact-serveur-peyrie-test.app.mgdigitalplus.com/api"`

## Étape 1 – API: client-by-compte
- Endpoint: `POST /api/auth/client-by-compte`
- Objectif: reconnaître le client et son compte, récupérer ses informations (dont devises), et envoyer un OTP via SMS + email.

Requête (exemple):
```json
{
  "numero_compte": "1000CCHQ00000009001",
  "device_id": "8A2F3C9B-6A8E-4D11-BE45-9A1F5C2D3B4E",
  "brand": "Samsung",
  "model": "Galaxy S23",
  "os": "Android 14",
  "code_cryptage": "Y}@128eVIXfoi7"
}
```

Réponse (exemple):
```json
{
  "success": true,
  "client": {
    "id": "123456",
    "login": "DERLY",
    "nom": "MOUPEPIDI",
    "prenom": "DERLY",
    "numero_compte": "1000CCHQ00000009001",
    "devise": "XAF",
    "email": "client@example.com",
    "telephone": "+2250700000012"
  },
  "message": "OTP envoyé par SMS et email"
}
```

Notes d’implémentation côté app:
- Afficher un état de succès, puis passer à l’écran de vérification OTP.
- Stocker en mémoire le `numero_compte` et le `device_id` pour la suite du flux.
- Ne pas exiger de Bearer token.

## Étape 2 – API: silent-otp
- Endpoint: `POST /api/auth/silent-otp`
- Objectif: immédiatement après la réussite de l’étape 1, récupérer de façon silencieuse le code OTP lié au device et au compte.
- UI: afficher un patientateur pendant la requête; si succès, préremplir les champs OTP.

Requête (exemple):
```json
{
  "numero_compte": "1000CCHQ00000009001",
  "device_id": "8A2F3C9B-6A8E-4D11-BE45-9A1F5C2D3B4E",
  "code_cryptage": "Y}@128eVIXfoi7"
}
```

Réponse (exemple):
```json
{
  "success": true,
  "otp_code": "767835",
  "ttl": 120,
  "message": "OTP récupéré pour autoremplissage"
}
```

Comportement côté app:
- Si `success` et `otp_code` présents:
  - Couper `otp_code` en 6 chiffres et les injecter automatiquement (format 3–tiret–3).
  - Activer le bouton “Valider”.
- Si échec ou pas d’OTP:
  - Masquer le patientateur.
  - Laisser la saisie manuelle, afficher une info “Saisissez le code reçu”.

## Étape 3 – API: verify-otp
- Endpoint: `POST /api/auth/verify-otp`
- Objectif: valider le code OTP pour confirmer l’accès.

Requête (exemple):
```json
{
  "numero_compte": "1000CCHQ00000009001",
  "device_id": "8A2F3C9B-6A8E-4D11-BE45-9A1F5C2D3B4E",
  "otp_code": "767835",
  "code_cryptage": "Y}@128eVIXfoi7"
}
```

Réponse (exemple):
```json
{
  "success": true,
  "message": "OTP validé",
  "session": {
    "token": "session-token-opaque-ou-jwt",
    "expiresIn": 3600
  }
}
```

Comportement côté app:
- Si succès:
  - Sauvegarder `session.token` en stockage sécurisé.
  - Poursuivre le flux (ouverture de session).
- Si échec:
  - Afficher “Code incorrect” et permettre une nouvelle tentative.

## Règles et contraintes
- Aucun en-tête `Authorization: Bearer ...` n’est requis pour ces 3 endpoints.
- `code_cryptage` doit correspondre au code attendu par le serveur.
- `device_id` doit être stable pour le device (UUID).
- Ne jamais persister l’OTP en stockage durable (uniquement en mémoire pour l’autoremplissage).
- Respecter le TTL; en cas d’expiration, recommencer à partir de l’étape 1 ou exposer un renvoi OTP.

## Intégration UI (résumé)
- Étape 1: appel depuis `InitialSetup` après saisie du compte; si succès, naviguer vers `OtpVerify`.
- Étape 2: au montage de `OtpVerify`, lancer `silent-otp` en tâche silencieuse; si OTP trouvé, préremplir automatiquement les champs.
- Étape 3: à la validation, appeler `verify-otp`; si succès, finir la configuration et ouvrir la session.

