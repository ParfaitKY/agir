# Améliorations recommandées — CEDAICI Mobile

> Dernière mise à jour : Avril 2026
> ✅ = Déjà corrigé | 🔴 Critique | 🟠 Important | 🟡 Qualité

---

## ✅ Déjà corrigés

| #   | Problème                                                                                    | Fichier                         |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | `OP_CODEOPERATEUR` hardcodé → utilise maintenant `OP_CODEOPERATEURGESTIONNAIRECOMPTEMOBILE` | `useVirement.ts`, `useLogin.ts` |
| 2   | Timeout inactivité 1 min → **5 minutes**                                                    | `InactivityProvider.tsx`        |
| 3   | Déconnexion au démarrage si hors ligne → fallback session locale                            | `AuthProvider.tsx`              |
| 4   | Headers CORS bloqués (`X-CLIENT-ID`, `X-LOGIN`) → passés dans le body                       | tous les hooks `domain/compte/` |
| 5   | OTP Android tremblant → `setTimeout`, `caretHidden`, `maxLength=2`                          | `OtpSimpleScreen.tsx`           |
| 6   | Cache Metro gardait l'ancienne URL → intercepteur force `baseURL`                           | `httpClient.ts`                 |

---

## 🔴 Priorité haute

### 1. Token post-OTP non sauvegardé correctement

Après `/auth/verify-otp-simple`, si le serveur renvoie un nouveau `access_token` (avec `auth_stage: "authenticated"`), il doit remplacer le token de login (`auth_stage: "otp_pending"`). Sans ça, les appels API sensibles (virement, comptes) sont rejetés.

**Action** : Vérifier avec le backend si `/verify-otp-simple` renvoie un nouveau token. Si oui, le sauvegarder dans `OtpSimpleScreen.tsx` (déjà en place, à valider en prod).

---

### 2. Pas de refresh token

Quand le JWT expire (généralement après 5 min selon le payload), l'utilisateur est déconnecté sans avertissement. Il n'y a aucun mécanisme de renouvellement silencieux.

**Action** : Demander au backend un endpoint `/auth/refresh-token`. Implémenter dans `httpClient.ts` un intercepteur qui tente le refresh avant de déclencher `auth:expired`.

---

### 3. Virement — confirmation avant envoi

Actuellement le virement s'exécute dès le clic sur "Effectuer le virement" sans écran de confirmation. Une erreur de saisie du compte bénéficiaire est irréversible.

**Action** : Ajouter un modal de confirmation avec récapitulatif (émetteur, bénéficiaire, montant) avant l'appel API.

---

## 🟠 Priorité moyenne

### 4. Notifications — badge hardcodé à "5"

Le badge de notifications dans le Dashboard affiche toujours `5` en dur. Aucun endpoint de notifications n'est connecté.

**Action** : Masquer le badge ou connecter un endpoint `/notifications/count`.
**Fichier** : `DashboardScreen.tsx`

---

### 5. Date serveur hardcodée dans ProfileScreen

```ts
const serverDate = new Date(2025, 6, 11); // hardcodé
```

Cette date est utilisée comme référence "aujourd'hui" dans le calendrier de filtrage des transactions.

**Action** : Utiliser `JT_DATEJOURNEETRAVAIL` stocké dans le SecureStore après le login, ou `new Date()`.
**Fichier** : `ProfileScreen.tsx`

---

### 6. Écran Analytics — pas de filtre de période

L'analytique charge toujours les 50 dernières opérations. Impossible de voir les tendances sur 7j, 30j ou 3 mois.

**Action** : Ajouter des chips de période (7j / 30j / 3 mois) qui relancent `fetchData` avec les dates correspondantes.
**Fichier** : `AnalyticsScreen.tsx`

---

### 7. Simulateur de crédit — taux non réel

Le taux d'intérêt est saisi manuellement par l'utilisateur. La formule utilise des intérêts simples (non conformes aux pratiques bancaires).

**Action** : Charger le taux depuis un endpoint ou afficher une valeur indicative pré-remplie. Utiliser la formule d'amortissement standard.
**Fichier** : `CreditSimulatorScreen.tsx`

---

### 8. Écran Cartes non implémenté

Le bouton "Cartes" dans le Dashboard et la navigation ouvre un modal "Fonctionnalité à venir". Il occupe une place dans la navigation principale sans valeur.

**Action** : Connecter à un endpoint `/compte/cartes` ou retirer de la barre de navigation jusqu'à implémentation.

---

## 🟡 Qualité & Maintenabilité

### 9. Logs sensibles en production

Des `console.log` affichent des données sensibles en clair :

- `[OTP] CodeOtp reçu : "1234"`
- Tokens JWT complets
- Logins et mots de passe

**Action** : Conditionner tous les logs à `if (__DEV__)` ou les supprimer avant la mise en production.

---

### 10. Clé de cryptage dupliquée dans 10+ fichiers

```ts
CODECRYPTAGE: "Y}@128eVIXfoi7";
```

Cette constante est copiée partout. Si elle change, il faut modifier 10+ fichiers.

**Action** : La centraliser dans `src/services/endpoints.ts` :

```ts
export const CODECRYPTAGE = "Y}@128eVIXfoi7";
```

---

### 11. Duplication de la logique `normalize` / `pick`

Les fonctions `normalize()` et `pick()` pour extraire les données serveur sont copiées dans `useLogin.ts`, `AuthProvider.tsx`, `InitialSetupScreen.tsx`, `AppNavigator.tsx` et d'autres.

**Action** : Extraire dans `src/shared/utils/apiNormalizer.ts`.

---

### 12. Gestion d'erreur réseau incohérente

Certains hooks affichent "Identifiants manquants" quand c'est en réalité une erreur CORS ou réseau. L'utilisateur ne comprend pas pourquoi ses données ne chargent pas.

**Action** : Distinguer les erreurs réseau (`Network Error`) des erreurs d'authentification dans `httpClient.ts` et afficher des messages adaptés.

---

### 13. Mode invité — guards manquants

En mode invité, certains hooks tentent des appels API avec un token `"guest"` qui échoue silencieusement. Les écrans affichent des états vides sans explication.

**Action** : Ajouter un guard `if (token === "guest") return` dans tous les hooks `domain/compte/`.

---

## 🔒 Sécurité

### 14. `localStorage` web non sécurisé

Sur web, les tokens JWT sont stockés dans `localStorage` (accessible par JavaScript, vulnérable au XSS).

**Action** : Acceptable en développement. En production web, utiliser `sessionStorage` ou des cookies `httpOnly` via un proxy backend.

---

### 15. Pas de certificate pinning

Les appels HTTPS ne vérifient pas le certificat du serveur. Une attaque man-in-the-middle est possible sur des réseaux non sécurisés.

**Action** : Implémenter le certificate pinning avec `expo-ssl-pinning` ou équivalent avant la mise en production.
