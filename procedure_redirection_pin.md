# Procédures d'Authentification : Redirection et OTP

Ce document détaille deux procédures clés pour l'optimisation du parcours d'authentification utilisateur.

---

## 1. Redirection automatique vers le PIN pour un compte déjà connu

Cette procédure décrit la logique à implémenter pour détecter si un utilisateur saisissant son numéro de compte est déjà configuré sur l'appareil, afin de lui éviter le parcours d'OTP et de configuration du PIN.

### Contexte
L'utilisateur se trouve sur l'écran **`InitialSetupScreen`** (écran de saisie du numéro de compte).
Il saisit un numéro de compte qui a **déjà été configuré** précédemment sur ce téléphone (et dont les données n'ont pas été effacées).

### Algorithme de Redirection

L'implémentation doit se faire dans la fonction qui gère la validation du numéro de compte (ex: `handleVerifyAccountNumber`).

#### Étape 1 : Interception
Dès que l'utilisateur clique sur "Vérifier" (ou que la validation automatique se déclenche), avant d'appeler l'API ou d'envoyer un OTP :

1.  **Récupérer les données locales :**
    *   Lire le numéro de compte stocké : `secureGetItem("user_account_number")`
    *   Lire le flag de configuration : `secureGetItem("is_configured")`
    *   Lire le flag de présence du PIN : `secureGetItem("pin_user")`

#### Étape 2 : Comparaison
Vérifier si les conditions suivantes sont réunies :
1.  Le numéro de compte saisi (nettoyé des espaces) correspond **exactement** au numéro de compte stocké.
2.  L'application est marquée comme configurée (`is_configured === "true"`).
3.  Un PIN est bien présent (`pin_user` existe).

#### Étape 3 : Action
*   **CAS A (Correspondance trouvée) :**
    *   Arrêter le processus de vérification API.
    *   Rediriger immédiatement l'utilisateur vers l'écran de connexion : `navigation.replace("PinLogin")`.
    *   *Résultat :* L'utilisateur n'a pas besoin de refaire l'OTP ni de rechoisir un code.

*   **CAS B (Pas de correspondance ou données manquantes) :**
    *   Continuer le flux normal (Appel API -> OTP -> Configuration PIN).

### Exemple de Code (Pseudo-code)

```typescript
const handleVerifyAccountNumber = async () => {
  // 1. Nettoyage de l'entrée
  const inputAccount = accountNumber.trim().toUpperCase();
  
  // 2. Vérification locale
  const storedAccount = await secureGetItem("user_account_number");
  const isConfigured = await secureGetItem("is_configured");
  const hasPin = await secureGetItem("pin_user");

  // 3. Redirection si déjà connu
  if (
    isConfigured === "true" && 
    hasPin && 
    storedAccount === inputAccount
  ) {
    // Le client est déjà configuré, on l'envoie se connecter
    navigation.replace("PinLogin");
    return;
  }

  // 4. Sinon, procédure normale (API, OTP...)
  // ... fetchClientInfo ...
};
```

---

## 2. Gestion de l'OTP (Token) Hybride (Auto/Manuel)

Cette procédure explique comment gérer la réception et la saisie du code OTP (Token) de manière flexible pour s'adapter à toutes les situations utilisateur.

### Principe Général
Le serveur envoie le code OTP (Token) sur deux canaux simultanément :
1.  **Par SMS** au numéro de téléphone associé au compte.
2.  **Par E-mail** à l'adresse associée au compte.

L'application mobile doit tenter de faciliter la vie de l'utilisateur (lecture automatique) tout en prévoyant le cas où l'utilisateur n'a pas accès à ses messages sur le téléphone en cours d'utilisation (saisie manuelle).

### Cas A : Lecture Automatique (Expérience Optimale)
Si la carte SIM ou l'adresse e-mail est configurée **sur le même téléphone** que celui où l'application est installée :

*   **SMS :** L'application doit écouter les SMS entrants (via l'API `SMS Retriever` sur Android ou l'autofill sur iOS).
    *   *Comportement :* Dès que le SMS arrive, le code est extrait et pré-rempli dans le champ de saisie. Idéalement, la validation se lance automatiquement.
*   **E-mail :** Il est plus difficile de lire automatiquement les e-mails pour des raisons de sécurité, mais l'utilisateur peut copier-coller le code depuis sa notification ou son application mail.

### Cas B : Saisie Manuelle (Expérience de Secours)
Ce cas est obligatoire et doit toujours être disponible. Il couvre les situations suivantes :
*   Le téléphone utilisé n'a pas la carte SIM du compte (ex: tablette, ou utilisateur utilisant un deuxième téléphone).
*   L'utilisateur consulte ses mails sur un ordinateur.
*   La lecture automatique du SMS a échoué (permissions refusées, format SMS non standard).

*   **Comportement Attendu :**
    *   Le champ de saisie OTP doit être **modifiable** (clavier ouvert).
    *   L'utilisateur lit le code sur son autre appareil (ou son ordinateur) et le tape manuellement.
    *   Un bouton "Valider" permet de soumettre le code saisi.

### Implémentation Technique (Logique)

L'écran de vérification OTP (`OtpVerifyScreen`) doit fonctionner ainsi :

1.  **Initialisation :**
    *   Afficher un message : "Un code a été envoyé au +225 XX...XX et à email@...com".
    *   Lancer l'écouteur de SMS en arrière-plan (si possible).
    *   Donner le focus au champ de saisie (input).

2.  **Pendant l'attente :**
    *   Si un SMS est détecté -> Remplir le champ -> (Optionnel) Valider automatiquement.
    *   Si l'utilisateur tape au clavier -> Mettre à jour le champ.

3.  **Validation :**
    *   L'utilisateur clique sur "Valider".
    *   L'application vérifie le code saisi (qu'il vienne du SMS ou du clavier) auprès du serveur.

### Résumé
L'application ne doit pas bloquer l'utilisateur en attendant *uniquement* une lecture automatique. Elle doit être "à l'écoute" mais laisser le champ libre pour que l'utilisateur puisse saisir le code qu'il a reçu, peu importe le canal (SMS/Mail) ou l'appareil de réception.
