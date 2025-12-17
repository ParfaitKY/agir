# Guide de récupération automatique du code OTP

## Objectif

- Permettre à l’application de préremplir le code OTP dès sa réception, sans saisie manuelle.
- Réduire la friction d’authentification et améliorer le taux de conversion.

## Vue d’ensemble

- Android propose deux approches natives pour lire les SMS OTP:
  - SMS Retriever API (lecture automatique, sans permission SMS)
  - SMS User Consent API (lecture assistée par l’utilisateur)
- iOS ne permet pas la lecture des SMS, mais fournit l’autocomplétion clavier via `oneTimeCode` si le message est bien formaté.
- L’écran `OtpVerifyScreen` peut écouter un événement applicatif et injecter le code dans les champs.

## Parcours API: device → jeton → OTP → autoremplissage

- Étapes serveur/cliente:
  1. Enregistrer le device et obtenir un jeton temporaire
  2. Demander l’envoi de l’OTP (SMS/push)
  3. Lire/recevoir l’OTP côté app et remplir automatiquement
  4. Vérifier l’OTP côté serveur et ouvrir la session

### 1) Enregistrement du device et jeton

- Collecte côté app:
  - `terminalUUID` (ex: `expo-device`), `platform` (`android`|`ios`), `appVersion`
  - `login` et `clientId` si disponibles
- API `POST /api/devices/register`
  - Payload:
    {
    "terminalUUID": "abcd-1234-efgh-5678",
    "platform": "android",
    "appVersion": "1.0.0",
    "login": "DERLY",
    "clientId": "123456"
    }
  - Réponse:
    {
    "deviceToken": "eyJhbGciOi...",
    "expiresIn": 900
    }
  - Conserver `deviceToken` en mémoire (volatile)

### 2) Demande d’OTP

- API `POST /api/otp/request` (Header: `Authorization: Bearer {deviceToken}`)
  - Payload:
    {
    "channel": "sms",
    "login": "DERLY",
    "clientId": "123456",
    "purpose": "login"
    }
  - Réponse:
    {
    "requestId": "req_otp_987654",
    "ttl": 120,
    "appHash": "7hQm1AbCdEf"
    }

### 3) Autoremplissage côté app

- Android: démarrer SMS Retriever avec `appHash`, à la réception émettre `otp:received` avec le code.
- iOS: `textContentType=oneTimeCode` sur le champ, le clavier propose l’OTP.
- UI: `OtpVerifyScreen` écoute `otp:received`, remplit les 6 digits, active “Valider”.

### 4) Vérification OTP côté serveur

- API `POST /api/otp/verify` (Header: `Authorization: Bearer {deviceToken}`)
  - Payload:
    {
    "requestId": "req_otp_987654",
    "otp": "123456"
    }
  - Réponse:
    {
    "success": true,
    "sessionToken": "eyJhbGciOi...",
    "user": { "id": "123", "login": "DERLY" }
    }
  - Stocker `sessionToken` en stockage sécurisé (SecureStore)

## Pré‑requis généraux

- Format de message OTP clair et standardisé
  - Inclure le code sur une ligne dédiée et éviter les caractères ambigus
  - Exemple: `Code Zenith: 123456`
- Code à 6 chiffres et validité courte (ex: 120 s)
- Ne jamais persister l’OTP en stockage durable

## Android: SMS Retriever API (auto)

- Principe: Android extrait automatiquement le SMS OTP envoyé à l’app, sans permission SMS et sans action de l’utilisateur.
- Exigences:
  - Le SMS doit contenir la signature de l’app (hash) en fin de message
  - Format recommandé: `\<#\> Code Zenith: 123456\nAppHash`
    - `\<#\>` est un indicateur spécial pour les OTP
    - `AppHash` est le hash 11 caractères spécifique à l’application
- Intégration côté app:
  1. Démarrer l’écoute du SMS retriever au montage de l’écran OTP
  2. Recevoir le SMS, extraire `123456`
  3. Émettre un événement interne `otp:received` avec le code
- Côté serveur:
  - Générer le SMS avec le `AppHash` correspondant au package de l’app
  - Ne jamais inclure de données sensibles dans le SMS

## Android: SMS User Consent API (assisté)

- Principe: Android affiche une fenêtre demandant à l’utilisateur d’autoriser la lecture du SMS OTP reçu.
- Utilisation:
  - Démarrer `UserConsent` ciblé sur un expéditeur connu (ou global)
  - À la validation, récupérer le SMS et extraire `123456`
  - Émettre `otp:received`
- Avantage: marche même sans hash, utile si la signature n’est pas disponible

## iOS: Autocomplétion via `oneTimeCode`

- iOS n’autorise pas la lecture de SMS par les apps tierces.
- L’autocomplétion se fait via le clavier si:
  - Le champ de saisie a `textContentType=oneTimeCode` et `keyboardType=number-pad`
  - Le SMS contient clairement le code, par exemple: `Votre code: 123456`
- Conseils de format SMS iOS:
  - Ne pas encapsuler le code dans des liens
  - Placer le code en fin de message ou sur une ligne dédiée

## Intégration dans l’app

- Point d’intégration: `src/modules/auth/screens/OtpVerifyScreen.tsx`
- Stratégie d’injection côté UI:
  - Écouter un événement applicatif `otp:received`
  - À la réception, découper `123456` en `['1','2','3','4','5','6']`
  - Mettre à jour l’état `values` et déplacer le curseur
  - Activer le bouton “Valider” automatiquement si la longueur est 6

### Exemple d’interface de service (pseudo‑code)

```
// OtpService
type OtpListener = (code: string) => void

export const OtpService = {
  startAndroidRetriever(): void {},
  startAndroidUserConsent(sender?: string): void {},
  stop(): void {},
  onReceived(listener: OtpListener): () => void,
  requestDeviceToken(meta): Promise<string> {},
  requestOtp(deviceToken, payload): Promise<{ requestId: string, ttl: number, appHash?: string }> {},
  verifyOtp(deviceToken, requestId, otp): Promise<{ success: boolean, sessionToken?: string }>{},
}

// Dans OtpVerifyScreen
useEffect(() => {
  const unsubscribe = OtpService.onReceived((code) => {
    const digits = code.replace(/\D/g, '').slice(0, 6).split('')
    setValues((prev) => {
      const next = [...prev]
      for (let i = 0; i < digits.length; i++) next[i] = digits[i]
      return next
    })
    setActive(5)
  })
  OtpService.startAndroidRetriever()
  return () => {
    unsubscribe()
    OtpService.stop()
  }
}, [])
```

## Format de SMS recommandé

- Android (SMS Retriever):
  - `\<#\> Code Zenith: 123456\nAppHash`
  - Le hash doit correspondre au package signé de l’app
- iOS (autofill):
  - `Votre code Zenith est 123456`
  - Éviter les symboles parasites autour du code

## Sécurité et conformité

- Ne jamais exposer l’OTP dans les logs applicatifs
- Limiter la durée de validité (ex: 120 s) et les tentatives
- Vérifier côté serveur que le code n’a pas été utilisé
- Éviter de stocker l’OTP, même temporairement, en clair

## Gestion des cas limites

- Aucun SMS reçu:
  - Laisser l’utilisateur saisir manuellement
  - Afficher un lien “Renvoyer le code” côté serveur
- SMS reçu trop tard:
  - Indiquer l’expiration et demander un nouveau code
- Code incorrect:
  - Afficher une erreur concise et ne pas divulguer d’indications

## Checklist de mise en prod

- Android
  - Calcul du `AppHash` et validation sur device réel
  - Format des SMS conforme
  - Tests avec différents expéditeurs
- iOS
  - `textContentType=oneTimeCode` sur le champ OTP
  - Messages test avec le code en clair
  - Vérification de l’autofill sur plusieurs versions d’iOS

## Points à brancher lorsque le service sera prêt

- Implémenter `OtpService` côté app pour abstraire la source d’OTP (SMS, push, email)
- Brancher l’émission `otp:received` dans la callback de lecture
- Ajouter un “renvoi de code” côté UI relié au backend

Cette approche garantit un comportement natif optimal sur Android et un autofill ergonomique sur iOS, tout en respectant les contraintes de sécurité.
