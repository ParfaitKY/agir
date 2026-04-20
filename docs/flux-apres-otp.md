# Flux après validation OTP

## Endpoint appelé

`POST /auth/verify-otp-simple`

**Payload envoyé :**

```json
{
  "user_id": "100000002495",
  "otp_code": "1234"
}
```

---

## Cas 1 — OTP valide (`success: true`)

```
OtpSimpleScreen
    └── verifyOtpSimple() → success
            └── navigation.reset → "Main" (Dashboard)
```

L'utilisateur est redirigé directement vers le **Dashboard** (écran principal avec la barre de navigation).

---

## Cas 2 — OTP invalide (`success: false`)

```
OtpSimpleScreen
    └── verifyOtpSimple() → erreur
            └── Affiche le message d'erreur + réinitialise les cases
```

L'utilisateur reste sur l'écran OTP avec le message reçu du serveur (ex: "Code OTP invalide ou expiré").

---

## Ce qui se passe dans "Main"

Une fois sur `Main`, l'utilisateur accède aux 4 onglets :

| Onglet       | Écran                                  |
| ------------ | -------------------------------------- |
| Dashboard    | Solde, dernières opérations, virements |
| Transactions | Historique des transactions            |
| Products     | Produits bancaires                     |
| Settings     | Profil, langue, wallet, support...     |

---

## Problème actuel à corriger

`useLogin` exige un token pour retourner `success: true`. Or après OTP, la session est déjà établie via le `access_token` reçu au login. Il faut s'assurer que ce token est bien sauvegardé **avant** la navigation vers `OtpSimple`, ce qui est déjà fait dans `useLogin` via `secureSetItem("auth_token", token)`.

Le `verifyOtpSimple` utilise `httpClientOtp` (client séparé) avec le header `X-NO-AUTH: true` — pas besoin de token pour cette étape.
