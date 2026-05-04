# Améliorations & Corrections — Zenith Mobile

> Analyse complète du projet au **4 mai 2026**  
> Priorités classées par impact utilisateur et risque technique

---

## 🔴 Critique — Sécurité

### 1. Clé de chiffrement codée en dur

**Fichiers** : `src/services/endpoints.ts`, `src/domain/compte/useVirement.ts`, `src/domain/wallet/useWalletSubscribe.ts`

```ts
export const CODECRYPTAGE = "Y}@128eVIXfoi7"; // visible dans le bundle APK
```

La clé est exposée dans le code source et donc dans le bundle distribué. N'importe qui qui décompile l'APK peut la lire.

**Correction** : la faire injecter par le serveur lors de l'authentification, ou la stocker dans une variable d'environnement non embarquée dans le bundle.

---

### 2. PIN invité par défaut prévisible

**Fichier** : `src/app/providers/AuthProvider.tsx`

```ts
const hashedDefaultPin = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  "12345", // PIN par défaut connu
);
```

Le mode invité crée un PIN `12345` hashé. Si un attaquant accède au SecureStore, il peut tenter ce PIN en premier.

**Correction** : générer un PIN aléatoire pour le mode invité, ou ne pas créer de PIN du tout pour ce mode.

---

### 3. Vérification du bénéficiaire non obligatoire

**Fichier** : `src/modules/transactions/screens/TransferScreen.tsx`

L'utilisateur peut lancer un virement sans avoir vérifié que le compte destinataire existe. Une faute de frappe envoie l'argent vers un compte inconnu.

**Correction** : bloquer le bouton "Effectuer le virement" tant que la vérification du bénéficiaire n'a pas retourné un succès confirmé.

---

### 4. Auto-submit OTP sans confirmation explicite

**Fichier** : `src/modules/auth/screens/OtpVerifyScreen.tsx`

Quand `silentOtp` retourne un code, il est soumis automatiquement après 500 ms sans que l'utilisateur ne valide. Un deep link malveillant pourrait déclencher ce flux.

**Correction** : pré-remplir les champs mais laisser l'utilisateur appuyer sur "Valider" manuellement, ou au minimum afficher un compte à rebours visible.

---

## 🟠 Haute priorité — Données & Stabilité

### 5. Solde non rafraîchi à l'ouverture de TransferScreen

**Fichier** : `src/modules/transactions/screens/TransferScreen.tsx`

`fetchAccounts()` est appelé une seule fois au montage. Si l'utilisateur revient sur cet écran après une transaction, il voit l'ancien solde.

**Correction** :

```ts
import { useFocusEffect } from "@react-navigation/native";

useFocusEffect(
  React.useCallback(() => {
    fetchAccounts();
  }, []),
);
```

---

### 6. Données pays et comptes codées en dur dans WalletMobileSubscribeScreen

**Fichier** : `src/modules/settings/screens/WalletMobileSubscribeScreen.tsx`

```ts
// Données en dur
const PAYS_DATA = [
  { PY_CODEPAYS: "0001", PY_LIBELLE: "CÔTE D'IVOIRE" },
  ...
];
const COMPTES_DATA = [
  { CO_CODECOMPTE: "001", NUMEROCOMPTE: "1000COC00007919001", SOLDE: "2 212 500 FCFA" },
  ...
];
```

Les comptes affichés ne correspondent pas aux vrais comptes de l'utilisateur connecté.

**Correction** : utiliser `useCompteStatistiques()` pour les comptes et un endpoint dédié pour les pays.

---

### 7. Condition de course dans l'enregistrement du bénéficiaire

**Fichier** : `src/modules/transactions/screens/TransferScreen.tsx`

```ts
const ok = await submit({ ... });
setDone(ok);
if (ok) {
  const amountNum = Number(...);
  await recordTransfer(destinationAccount, amountNum); // peut échouer silencieusement
}
```

Si l'app est mise en arrière-plan ou crashe entre `submit` et `recordTransfer`, le bénéficiaire n'est pas enregistré dans l'historique.

**Correction** : enregistrer le bénéficiaire avant d'afficher le succès, et gérer l'erreur explicitement.

---

### 8. Pas de vérification des doublons dans les bénéficiaires

**Fichier** : `src/domain/beneficiaires/useBeneficiaires.ts`

Le même numéro de compte peut être ajouté plusieurs fois avec des noms différents, créant de la confusion dans la liste.

**Correction** : avant d'ajouter, vérifier si `accountNumber` existe déjà et proposer une mise à jour plutôt qu'un doublon.

---

### 9. Erreur réseau vs. compte inexistant non distingués

**Fichier** : `src/domain/compte/useVerifyBeneficiary.ts`

Une erreur réseau et un compte inexistant affichent le même message. L'utilisateur ne sait pas si c'est sa connexion ou le numéro saisi qui est en cause.

**Correction** :

```ts
if (error.message === "Network Error" || !error.response) {
  setError("Impossible de vérifier le compte. Vérifiez votre connexion.");
} else if (error.response?.status === 404) {
  setError("Ce numéro de compte n'existe pas.");
} else {
  setError("Erreur lors de la vérification.");
}
```

---

### 10. Environnement de test actif en production

**Fichier** : `src/services/endpoints.ts`

```ts
export const BASE_URL =
  //"https://zenithmobile-serveurreact-cedaiciprod.app.mgdigitalplus.com/api";
  "https://zenithmobile-serveurreact-cedaicitest.app.mgdigitalplus.com/api"; // TEST actif
```

L'URL de test est active. Si ce build est distribué, les utilisateurs se connectent au serveur de test.

**Correction** : utiliser une variable d'environnement (`process.env.API_URL` via `app.config.js`) pour basculer automatiquement selon le profil de build EAS (`development`, `preview`, `production`).

---

## 🟡 Priorité moyenne — UX & Qualité

### 11. Indicateur hors-ligne absent

**Fichier** : `src/app/providers/NetworkProvider.tsx` (existant mais non utilisé visuellement)

L'utilisateur peut tenter un virement sans savoir qu'il est hors-ligne. L'erreur n'apparaît qu'après l'appel API.

**Correction** : afficher une bannière persistante en haut de l'écran quand `isConnected === false`, en utilisant le `NetworkProvider` déjà en place.

---

### 12. Recherche de bénéficiaires sans debounce

**Fichier** : `src/modules/dashboard/screens/BeneficiairesPage.tsx`

Le filtre s'applique à chaque frappe, ce qui peut ralentir l'interface sur des listes longues.

**Correction** :

```ts
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";

const debouncedSearch = useDebouncedValue(search, 300);
const filtered = beneficiaires.filter((b) =>
  b.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
);
```

---

### 13. Logique de normalisation dupliquée

**Fichiers** : `AuthProvider.tsx`, `InitialSetupScreen.tsx`, `useVerifyBeneficiary.ts`, `useClientByTokenV2.ts`

La même fonction `normalize(raw)` / `pick(obj, patterns)` est copiée-collée dans au moins 4 fichiers.

**Correction** : extraire dans `src/shared/utils/apiNormalize.ts` et importer depuis un seul endroit.

---

### 14. Messages d'erreur non traduits

**Fichiers** : multiples screens et hooks

Certains messages sont en français hardcodé, d'autres utilisent `t()`. L'app supporte plusieurs langues mais les erreurs API ne sont pas traduites.

**Correction** : passer tous les messages utilisateur par le système i18n, y compris les messages d'erreur des hooks.

---

### 15. Pas d'état vide sur l'écran Transactions

**Fichier** : `src/modules/transactions/screens/TransactionsScreen.tsx`

Si l'utilisateur n'a aucune transaction, l'écran affiche une liste vide sans explication.

**Correction** : afficher un composant `EmptyState` (déjà présent dans `src/shared/components/EmptyState.tsx`) avec un message et une icône adaptés.

---

### 16. ContactCard non mémoïsé dans BeneficiairesPage

**Fichier** : `src/modules/dashboard/screens/BeneficiairesPage.tsx`

Chaque mise à jour du parent (ex. changement de recherche) re-rend tous les `ContactCard`, même ceux non affectés.

**Correction** :

```ts
const ContactCard = React.memo(({ item, onTransfer, onDelete, colors }) => {
  // ...
});
```

---

### 17. Skeleton loader absent sur TransferScreen

**Fichier** : `src/modules/transactions/screens/TransferScreen.tsx`

Pendant le chargement du compte source, seul un `ActivityIndicator` s'affiche dans un placeholder. L'expérience est abrupte.

**Correction** : afficher un skeleton animé qui reproduit la forme de la carte compte pendant le chargement.

---

### 18. Confirmation de suppression de bénéficiaire sans PIN

**Fichier** : `src/modules/dashboard/screens/BeneficiairesPage.tsx`

La suppression d'un bénéficiaire ne demande qu'une confirmation `Alert`. Une action accidentelle est possible.

**Correction** : pour les actions destructives, demander la confirmation par PIN (réutiliser le composant PinLogin en modal).

---

## 🔵 Qualité du code

### 19. Types `any` excessifs dans les hooks wallet

**Fichiers** : `src/domain/wallet/useWalletSubscribe.ts`, `useWalletUnsubscribe.ts`, `useWalletTransactions.ts`

Les réponses API sont typées `any`, ce qui supprime toute aide du compilateur TypeScript.

**Correction** : définir des interfaces dans `src/services/wallet/types.ts` et les utiliser dans les hooks.

---

### 20. Noms de champs API éparpillés comme magic strings

**Fichiers** : multiples

`"CL_NOMCLIENT"`, `"PRENOMCLIENT"`, `"CO_CODECOMPTE"`, etc. apparaissent dans au moins 8 fichiers différents sans constante partagée.

**Correction** : créer `src/shared/constants/apiFields.ts` :

```ts
export const API_FIELDS = {
  CLIENT_NOM: "CL_NOMCLIENT",
  CLIENT_PRENOM: "CL_PRENOMCLIENT",
  COMPTE_CODE: "CO_CODECOMPTE",
  // ...
} as const;
```

---

## 📋 Tableau récapitulatif

| #   | Problème                                  | Fichier principal                 | Priorité    | Effort |
| --- | ----------------------------------------- | --------------------------------- | ----------- | ------ |
| 1   | Clé de chiffrement hardcodée              | `endpoints.ts`                    | 🔴 Critique | Moyen  |
| 2   | PIN invité prévisible                     | `AuthProvider.tsx`                | 🔴 Critique | Faible |
| 3   | Vérification bénéficiaire non obligatoire | `TransferScreen.tsx`              | 🔴 Critique | Faible |
| 4   | Auto-submit OTP sans confirmation         | `OtpVerifyScreen.tsx`             | 🔴 Critique | Faible |
| 5   | Solde non rafraîchi au focus              | `TransferScreen.tsx`              | 🟠 Haute    | Faible |
| 6   | Données wallet codées en dur              | `WalletMobileSubscribeScreen.tsx` | 🟠 Haute    | Moyen  |
| 7   | Race condition bénéficiaire               | `TransferScreen.tsx`              | 🟠 Haute    | Faible |
| 8   | Doublons bénéficiaires                    | `useBeneficiaires.ts`             | 🟠 Haute    | Faible |
| 9   | Erreur réseau vs. compte inexistant       | `useVerifyBeneficiary.ts`         | 🟠 Haute    | Faible |
| 10  | URL de test en production                 | `endpoints.ts`                    | 🟠 Haute    | Faible |
| 11  | Indicateur hors-ligne absent              | `NetworkProvider.tsx`             | 🟡 Moyenne  | Moyen  |
| 12  | Recherche sans debounce                   | `BeneficiairesPage.tsx`           | 🟡 Moyenne  | Faible |
| 13  | Logique normalisation dupliquée           | Multiple                          | 🟡 Moyenne  | Moyen  |
| 14  | Messages d'erreur non traduits            | Multiple                          | 🟡 Moyenne  | Moyen  |
| 15  | Pas d'état vide Transactions              | `TransactionsScreen.tsx`          | 🟡 Moyenne  | Faible |
| 16  | ContactCard non mémoïsé                   | `BeneficiairesPage.tsx`           | 🟡 Moyenne  | Faible |
| 17  | Skeleton loader absent                    | `TransferScreen.tsx`              | 🟡 Moyenne  | Moyen  |
| 18  | Suppression sans PIN                      | `BeneficiairesPage.tsx`           | 🟡 Moyenne  | Moyen  |
| 19  | Types `any` dans wallet hooks             | `useWalletSubscribe.ts`           | 🔵 Qualité  | Moyen  |
| 20  | Magic strings API                         | Multiple                          | 🔵 Qualité  | Moyen  |

---

## 🎯 Ordre d'exécution recommandé

**Semaine 1 — Sécurité & Stabilité**

- [ ] #3 Rendre la vérification bénéficiaire obligatoire
- [ ] #2 Corriger le PIN invité
- [ ] #10 Configurer les URLs par environnement EAS
- [ ] #5 Rafraîchir le solde au focus de TransferScreen
- [ ] #7 Corriger la race condition bénéficiaire

**Semaine 2 — Données réelles**

- [ ] #6 Connecter WalletMobileSubscribeScreen aux vraies données
- [ ] #8 Détecter les doublons de bénéficiaires
- [ ] #9 Distinguer erreur réseau / compte inexistant
- [ ] #11 Afficher le bandeau hors-ligne

**Semaine 3 — UX**

- [ ] #15 État vide sur Transactions
- [ ] #17 Skeleton loader sur TransferScreen
- [ ] #12 Debounce sur la recherche bénéficiaires
- [ ] #16 Mémoïser ContactCard

**Backlog — Qualité**

- [ ] #13 Extraire la logique de normalisation
- [ ] #20 Centraliser les noms de champs API
- [ ] #19 Typer les hooks wallet
- [ ] #14 Passer tous les messages par i18n
- [ ] #1 Externaliser la clé de chiffrement
- [ ] #4 Revoir le flux auto-submit OTP
