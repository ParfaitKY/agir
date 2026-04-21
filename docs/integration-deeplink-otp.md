# Intégration Deep Link OTP — `cedaici://api/auth/verify`

## Vue d'ensemble

Quand le serveur envoie un lien magique par SMS ou email, l'application l'intercepte, extrait l'OTP et l'UID, puis vérifie automatiquement la connexion sans que l'utilisateur ait à saisir quoi que ce soit.

**Format du lien :**

```
cedaici://api/auth/verify?token=<BASE64>&otp=<4_CHIFFRES>&uid=<USER_ID>&exp=<TIMESTAMP_UNIX>
```

---

## Fichiers modifiés

| Fichier                                        | Rôle                                                     |
| ---------------------------------------------- | -------------------------------------------------------- |
| `app.json`                                     | Déclare le scheme `cedaici` et les intentFilters Android |
| `src/app/navigation/AppNavigator.tsx`          | Intercepte et route le deep link                         |
| `src/modules/auth/screens/OtpSimpleScreen.tsx` | Vérifie l'OTP et connecte l'utilisateur                  |

---

## 1. `app.json` — Configuration du scheme

```json
"scheme": "cedaici",
"android": {
  "intentFilters": [{
    "action": "VIEW",
    "data": [{ "scheme": "cedaici", "host": "api", "pathPrefix": "/auth/verify" }],
    "category": ["BROWSABLE", "DEFAULT"]
  }]
},
"ios": {
  "infoPlist": {
    "CFBundleURLTypes": [{ "CFBundleURLSchemes": ["cedaici"] }]
  }
}
```

**Ce que ça fait :**

- Sur Android, le système OS intercepte les URLs `cedaici://api/auth/verify*` et ouvre l'app automatiquement.
- Sur iOS, le scheme `cedaici://` est enregistré auprès du système.

---

## 2. `AppNavigator.tsx` — Interception du lien

### Où c'est placé

Dans le `useEffect` qui écoute `Linking.addEventListener("url", handleDeepLink)`, **avant** tous les autres cas (priorité 0).

### Le code

```typescript
// 0. Magic link avec OTP intégré
if (url.includes("/auth/verify")) {
  const tokenMatch = /[?&]token=([^&#]*)/.exec(url);
  const otpMatch = /[?&]otp=([^&#]*)/.exec(url);
  const uidMatch = /[?&]uid=([^&#]*)/.exec(url);
  const expMatch = /[?&]exp=([^&#]*)/.exec(url);

  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
  const otp = otpMatch[1];
  const uid = uidMatch[1];
  const exp = Number(expMatch[1]);

  // Vérifier expiration
  if (exp && Date.now() / 1000 > exp) {
    Alert.alert("Lien expiré", "...");
    return;
  }

  // Naviguer vers OtpSimpleScreen avec les params
  navigation.reset({
    index: 0,
    routes: [
      {
        name: "OtpSimple",
        params: { user_id: uid, debug_otp: otp, from_deeplink: true, token },
      },
    ],
  });
}
```

### Étapes détaillées

1. **Détection** — vérifie si l'URL contient `/auth/verify`
2. **Extraction** — regex sur chaque paramètre (`token`, `otp`, `uid`, `exp`)
3. **Décodage** — `decodeURIComponent` sur le token (qui est encodé en Base64 URL-safe)
4. **Vérification d'expiration** — compare `exp` (timestamp Unix en secondes) avec `Date.now() / 1000`
5. **Navigation** — `navigation.reset()` vers `OtpSimple` pour éviter que l'utilisateur puisse revenir en arrière

---

## 3. `OtpSimpleScreen.tsx` — Vérification automatique

### Nouveaux params reçus

| Param           | Type      | Description                              |
| --------------- | --------- | ---------------------------------------- |
| `user_id`       | `string`  | ID de l'utilisateur (ex: `100000002495`) |
| `debug_otp`     | `string`  | Code OTP à 4 chiffres (ex: `6784`)       |
| `from_deeplink` | `boolean` | `true` si vient d'un lien magique        |
| `token`         | `string`  | Token JWT décodé (pour usage futur)      |

### Auto-submit

```typescript
const fromDeeplink: boolean = route.params?.from_deeplink === true;

useEffect(() => {
  if (
    fromDeeplink &&
    debugOtp &&
    debugOtp.replace(/\D/g, "").length === DIGITS
  ) {
    const digits = debugOtp.replace(/\D/g, "").slice(0, DIGITS);
    const filled = digits
      .split("")
      .concat(Array(DIGITS).fill(""))
      .slice(0, DIGITS);
    setValues(filled); // Remplit visuellement les cases
    setTimeout(() => submitOtp(digits), 400); // Soumet après 400ms
  }
}, []);
```

**Pourquoi 400ms ?** Pour laisser le temps au composant de se monter et à l'animation de s'afficher avant de lancer la requête.

### Flux de vérification (`submitOtp`)

```
OtpSimpleScreen
    │
    ├─ POST /api/auth/verify-otp-simple
    │     { user_id, otp_code }
    │
    ├─ Succès ──► Sauvegarde token + client_id + login
    │             markConfigured(true)
    │             navigation.reset → "Main" (Dashboard)
    │
    └─ Échec ──► Affiche l'erreur
                 L'utilisateur peut saisir manuellement
```

### Subtitle adaptatif

```tsx
{
  fromDeeplink
    ? "Vérification automatique de votre lien de connexion…"
    : `Saisissez le code à ${DIGITS} chiffres\nreçu par SMS ou e-mail.`;
}
```

---

## 4. Flux complet end-to-end

```
Serveur envoie SMS/email
        │
        ▼
Utilisateur clique sur le lien
cedaici://api/auth/verify?token=...&otp=6784&uid=100000002495&exp=1776451623
        │
        ▼
OS Android/iOS intercepte → ouvre l'app
        │
        ▼
AppNavigator.handleDeepLink()
  ├─ Vérifie /auth/verify ✓
  ├─ Extrait token, otp, uid, exp
  ├─ Vérifie exp > now ✓
  └─ navigation.reset → OtpSimpleScreen
        │
        ▼
OtpSimpleScreen monte
  ├─ from_deeplink=true → useEffect déclenché
  ├─ Cases OTP remplies visuellement (6784)
  ├─ submitOtp("6784") après 400ms
  └─ POST /api/auth/verify-otp-simple
        │
        ▼
Réponse serveur success=true
  ├─ Sauvegarde auth_token, client_id, user_login
  ├─ markConfigured(true)
  └─ navigation.reset → Main (Dashboard)
```

---

## 5. Cas d'erreur gérés

| Cas                          | Comportement                                                     |
| ---------------------------- | ---------------------------------------------------------------- |
| Lien expiré (`exp < now`)    | Alert "Lien expiré" + arrêt                                      |
| `uid` ou `otp` manquant      | Alert "Lien invalide" + arrêt                                    |
| OTP rejeté par le serveur    | Affiche l'erreur, cases réinitialisées, saisie manuelle possible |
| App fermée au moment du clic | `Linking.getInitialURL()` récupère l'URL au démarrage            |

---

## 6. Tester

### Android (via ADB)

```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "cedaici://api/auth/verify?token=MTAwMDAwMDAyNDk1fDY3ODR8NTQ1NjY2NTU2NTZ8MTc3NjQ1MTYyM3xlM2M2NGVlNTMyZDA4NjdkMmU5ZjZiM2RlNWQ1YTU2Nw%3D%3D&otp=6784&uid=100000002495&exp=9999999999" \
  com.cedaici.mobile
```

### iOS (simulateur)

```bash
xcrun simctl openurl booted \
  "cedaici://api/auth/verify?token=TEST&otp=6784&uid=100000002495&exp=9999999999"
```

> **Note :** Utiliser `exp=9999999999` (année 2286) pour les tests afin d'éviter l'expiration.
