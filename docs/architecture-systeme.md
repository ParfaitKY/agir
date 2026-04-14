# Architecture du Système — MyCedaici

## Vue d'ensemble

MyCedaici est une application mobile React Native (Expo) de microfinance. Elle est conçue pour être **multi-clients** : une seule base de code peut servir plusieurs institutions financières grâce à un mécanisme d'identification par token sécurisé.

---

## 1. Structure du projet

```
src/
├── app/
│   ├── hooks/          → Hooks d'accès aux contextes (useAuth, useAppState)
│   ├── navigation/     → Routeur principal (AppNavigator)
│   └── providers/      → Contextes globaux (Auth, I18n, Theme, Network, Inactivity)
├── domain/
│   ├── auth/           → Logique métier d'authentification (hooks)
│   ├── compte/         → Logique métier des comptes bancaires
│   └── wallet/         → Logique métier du wallet mobile
├── modules/
│   ├── auth/           → Écrans d'authentification
│   ├── dashboard/      → Tableau de bord
│   ├── accounts/       → Gestion des comptes
│   ├── transactions/   → Virements et historique
│   ├── settings/       → Paramètres, profil, wallet
│   └── ...             → Autres modules (cards, credits, products, analytics)
├── services/
│   ├── httpClient.ts   → Client HTTP Axios centralisé
│   ├── endpoints.ts    → Définition des URLs d'API
│   └── auth/           → Appels API d'authentification
└── shared/
    ├── components/     → Composants réutilisables
    ├── styles/         → ThemeProvider (dark/light)
    └── utils/          → secureStorage, eventBus, cacheManager, formatters
```

---

## 2. Flux d'authentification complet

### 2.1 Démarrage de l'application

```
App.tsx
  └── AppProviders
        ├── ThemeProvider       (dark/light/system)
        ├── I18nProvider        (fr/en/zh)
        ├── NetworkProvider     (détection hors-ligne)
        ├── AuthProvider        (état d'authentification global)
        ├── InactivityProvider  (déconnexion auto après 1 min)
        └── NavigationContainer
              └── AppNavigator
```

Au démarrage, `SplashScreen` lit l'état d'authentification et redirige vers :

- `Main` → si l'utilisateur est déjà connecté
- `PinLogin` → si l'app est configurée (PIN existant)
- `InitialSetup` → si l'app n'est jamais configurée (premier lancement)

### 2.2 Flux de premier lancement (InitialSetup)

```
InitialSetupScreen (Étape 1 — Vérification du token)
  │
  ├── Saisie du token d'activation (reçu par mail/SMS ou deep link)
  │
  ├── useClientByTokenV2.fetchClientInfo()
  │     └── POST /auth/client-by-compte-avec-token-v2
  │           Payload: { authtoken, device_id, brand, model, os, code_cryptage }
  │           Réponse: { token_info: { autoplay, client_id, ... }, SL_LOGIN, ... }
  │
  ├── Extraction des données client (nom, prénom, login, téléphone)
  │
  ├── Décision selon token_info.autoplay :
  │     ├── autoplay = true  → OtpVerifyScreen (OTP automatique) → Étape 2 (config PIN)
  │     └── autoplay = false → OtpVerifyScreen (OTP manuel par mail) → PinLoginScreen
  │
  └── Navigation vers OtpVerifyScreen

OtpVerifyScreen
  │
  ├── silentOtp() → POST /auth/silent-otp
  │     (génère et envoie l'OTP, peut le retourner si autoplay=true)
  │
  ├── Si autoplay=true : remplissage automatique + auto-submit
  ├── Si autoplay=false : saisie manuelle du code reçu par mail
  │
  └── verifyOtp() → POST /auth/verify-otp
        └── onSuccess() → retour vers InitialSetup ou PinLogin

InitialSetupScreen (Étape 2 — Configuration PIN)
  │
  ├── Saisie : Nom, Prénom, Login, PIN (×2), Clé secrète
  │
  ├── updateLogin() → POST /auth/update-login
  │     (enregistre le login et le PIN côté serveur)
  │
  ├── getAccess() → POST /auth/get-access
  │     (valide la clé secrète et récupère les données d'accès)
  │
  ├── loginUser() → POST /auth/login
  │     (connexion initiale pour obtenir le token JWT)
  │
  ├── Stockage sécurisé :
  │     - auth_token (JWT)
  │     - pin_user (SHA-256 du PIN)
  │     - user_login, user_data, is_configured = "true"
  │
  └── Navigation vers PinLoginScreen
```

### 2.3 Connexions suivantes (PinLogin)

```
PinLoginScreen
  │
  ├── Saisie du PIN
  │
  ├── Vérification locale (SHA-256) contre pin_user stocké
  │
  ├── Si PIN correct → loginApi() → POST /auth/login
  │     (renouvellement du token JWT)
  │
  └── Navigation vers Main (tableau de bord)
```

### 2.4 Deep Link (lien externe)

```
URL: myapp://...?token=<authtoken>
  │
  └── AppNavigator.handleDeepLink()
        │
        ├── fetchClientInfo({ authtoken })
        │
        ├── Si autoplay=false :
        │     ├── Déconnexion de la session précédente
        │     ├── Sauvegarde du user_login
        │     ├── markConfigured(true)
        │     └── navigation.reset → PinLogin
        │
        └── Si autoplay=true : (TODO: auto-login)
```

---

## 3. Mécanisme multi-clients (identification par token)

C'est le cœur du système. Voici comment il fonctionne :

### 3.1 Principe

```
Token d'activation
      │
      ▼
POST /auth/client-by-compte-avec-token-v2
      │
      ▼
Réponse serveur :
  {
    token_info: {
      autoplay: true/false,   ← comportement de l'app
      client_id: "...",       ← identifiant du client
      token_type: "...",
      device_id: "..."        ← device attendu (si déjà enregistré)
    },
    SL_LOGIN: "...",          ← login pré-rempli
    CL_NOMCLIENT: "...",      ← nom du client
    CL_PRENOMCLIENT: "...",   ← prénom
    ...
  }
```

### 3.2 Le flag `autoplay`

| Valeur  | Comportement                                                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `true`  | L'OTP est envoyé ET retourné dans la réponse → remplissage automatique → l'utilisateur configure son PIN directement                     |
| `false` | L'OTP est envoyé par mail uniquement → l'utilisateur le saisit manuellement → redirigé vers PinLogin (accès déjà configuré côté serveur) |

### 3.3 Identification du device

À chaque appel `clientByTokenV2`, l'app envoie :

- `device_id` : identifiant stable du terminal (Android ID, iOS Vendor ID, ou généré)
- `brand`, `model`, `os` : informations matérielles

Le serveur peut retourner un `device_id` corrigé → l'app le met à jour et relance la requête automatiquement (retry logic).

### 3.4 Adaptation dynamique

Après validation du token, l'app extrait et stocke :

| Clé SecureStore   | Contenu                                    |
| ----------------- | ------------------------------------------ |
| `auth_token`      | JWT de session                             |
| `auth_token_init` | Token d'activation initial (permanent)     |
| `user_login`      | Login du client                            |
| `user_data`       | Objet JSON (nom, prénom, email, téléphone) |
| `client_id`       | Identifiant client                         |
| `device_id`       | Identifiant du terminal                    |
| `user_agency`     | Code agence                                |
| `work_date`       | Date de journée de travail                 |
| `is_configured`   | `"true"` si l'app est configurée           |
| `pin_user`        | Hash SHA-256 du PIN                        |

Ces données permettent à l'app de s'adapter au client identifié sans aucune modification de code.

---

## 4. Couche HTTP

### 4.1 Client Axios (`httpClient.ts`)

```
httpClient (Axios)
  ├── baseURL = BASE_URL (défini dans endpoints.ts)
  ├── timeout = 20 secondes
  │
  ├── Intercepteur requête :
  │     ├── Lecture du auth_token depuis SecureStore
  │     ├── Ajout header Authorization: Bearer <token>
  │     └── Bypass si X-NO-AUTH: "true" (routes publiques)
  │
  └── Intercepteur réponse :
        ├── Succès → log + retour
        └── Erreur 401/403 ou message "token expir/invalid"
              └── emit("auth:expired") → déconnexion automatique
```

### 4.2 Routes publiques (sans token)

Ces endpoints sont appelés sans authentification (`X-NO-AUTH: true`) :

- `/auth/client-by-compte`
- `/auth/client-by-compte-avec-token-v2`
- `/auth/silent-otp`
- `/auth/verify-otp`

### 4.3 Endpoints disponibles

```typescript
BASE_URL = "https://<serveur>/api"

// Auth
POST /auth/login                              → Connexion
POST /auth/client-by-compte                   → Client par numéro de compte
POST /auth/client-by-compte-avec-token-v2     → Client par token (multi-clients)
POST /auth/verification-token-v2              → Vérification du token JWT
POST /auth/silent-otp                         → Génération OTP
POST /auth/verify-otp                         → Validation OTP
POST /auth/update-login                       → Mise à jour login/PIN
POST /auth/get-access                         → Validation clé secrète

// Compte
GET  /compte/comptes                          → Liste des comptes
GET  /compte/comptesstatistique               → Statistiques
GET  /compte/derniere-transaction             → Dernière transaction
GET  /compte/analyse-derniere-transaction     → Analyse transaction
GET  /compte/solde                            → Solde
GET  /compte/soldeglobale                     → Solde global
POST /compte/virementcompteacompte            → Virement
GET  /compte/blocages-compte                  → Blocages
GET  /compte/dernieres-operations-client      → Historique opérations

// Crédit
POST /credit/demande                          → Demande de crédit
```

---

## 5. Stockage sécurisé (`secureStorage.ts`)

Abstraction multi-plateforme avec fallback automatique :

```
secureSetItem / secureGetItem / secureDeleteItem
  │
  ├── Web → window.localStorage
  ├── iOS/Android (SecureStore disponible) → expo-secure-store (chiffré)
  └── Fallback → AsyncStorage
```

---

## 6. Gestion de session

### 6.1 Déconnexion douce (Soft Logout)

Déclenché par : inactivité (1 min), token expiré (401/403), déconnexion manuelle.

- Supprime : `auth_token`, `user_data`
- Conserve : `is_configured`, `pin_user`, `user_login`
- Résultat : retour à l'écran PinLogin

### 6.2 Déconnexion complète (Hard Logout / `fullLogout`)

Déclenché manuellement depuis les paramètres.

- Supprime toutes les clés sauf `device_id`
- Résultat : retour à l'écran InitialSetup

### 6.3 Expiration de token

```
httpClient intercepteur erreur
  └── emit("auth:expired")
        └── AuthProvider.on("auth:expired")
              └── logout() → Soft Logout
```

### 6.4 Inactivité (`InactivityProvider`)

- Timeout : 1 minute sans interaction
- Détection : `PanResponder` (toucher écran) + `AppState` (mise en arrière-plan)
- Action : `logout()` automatique
- Exclusion : mode invité

---

## 7. Providers globaux

| Provider             | Rôle                                                  |
| -------------------- | ----------------------------------------------------- |
| `ThemeProvider`      | Thème clair/sombre/système, persisté dans SecureStore |
| `I18nProvider`       | Internationalisation (fr/en/zh), dictionnaire intégré |
| `NetworkProvider`    | Détection hors-ligne, écran bloquant si pas de réseau |
| `AuthProvider`       | État d'authentification, login/logout, PIN            |
| `InactivityProvider` | Déconnexion automatique par inactivité                |

---

## 8. Navigation

```
Stack.Navigator (AppNavigator)
  │
  ├── Splash          → Écran de démarrage
  ├── InitialSetup    → Configuration initiale (token + PIN)
  ├── OtpVerify       → Validation OTP
  ├── PinLogin        → Connexion par PIN
  ├── PasswordRecovery
  │
  └── [isAuthenticated]
        ├── Main (Tab.Navigator)
        │     ├── Dashboard
        │     ├── Transactions
        │     ├── Products
        │     └── Settings
        │
        ├── Analytics, Transfer, Accounts, AccountDetails
        ├── Cards, CreditSimulator, CreditRequest
        ├── WalletScreens, WalletMobileScreens
        ├── Profile, Language, Statements
        └── Support, Privacy, Terms, About...
```

**Mode invité** : accès limité (Dashboard + Settings uniquement), Transactions et Products bloqués avec invitation à se connecter.

**`withGuestRestriction`** : HOC qui bloque l'accès aux écrans sensibles en mode invité.

---

## 9. Réponse à la question : configuration multi-clients

**Oui, c'est entièrement faisable** avec l'architecture actuelle. Voici comment étendre le système :

### Ce qui existe déjà

- Le token d'activation identifie le client côté serveur
- Le serveur retourne les paramètres spécifiques au client (`autoplay`, `device_id`, login, etc.)
- L'app s'adapte dynamiquement selon ces paramètres

### Ce qu'il faudrait ajouter

Pour une configuration multi-clients complète (endpoints différents par client, thème personnalisé, etc.) :

1. **Le serveur retourne la configuration client** dans la réponse `clientByTokenV2` :

   ```json
   {
     "token_info": { "autoplay": false, "client_id": "BANQUE_X" },
     "config": {
       "api_base_url": "https://api.banque-x.com/api",
       "theme_primary_color": "#FF6600",
       "app_name": "MyBanqueX",
       "features": ["wallet", "credits"]
     }
   }
   ```

2. **L'app stocke et applique cette config** :
   - `BASE_URL` dynamique → reconfigurer `httpClient.defaults.baseURL`
   - Couleurs → injecter dans `ThemeProvider`
   - Fonctionnalités → masquer/afficher des onglets dans `AppNavigator`

3. **Un `ClientConfigProvider`** centralise cette logique et expose la config à toute l'app.

Le mécanisme de token + device_id est déjà le point d'entrée idéal pour ce système.

---

## 10. Sécurité

- **Stockage** : SecureStore (chiffrement matériel iOS/Android)
- **PIN** : jamais stocké en clair, toujours hashé SHA-256
- **Token JWT** : vérifié à chaque démarrage (`verifyTokenV2`)
- **OTP** : validation serveur obligatoire
- **Capture écran** : désactivée sur l'écran de configuration PIN
- **Inactivité** : déconnexion automatique après 1 minute
- **Token expiré** : déconnexion automatique via EventBus
