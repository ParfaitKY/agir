# Processus Détaillé d'Authentification et Configuration

Ce document explique étape par étape le flux de l'application depuis la saisie du token jusqu'à l'accès à l'écran de connexion, en distinguant les deux scénarios : **Autoplay True** (Automatique) et **Autoplay False** (Manuel).

---

## Scénario 1 : Autoplay est TRUE (Mode Automatique)

Ce mode est conçu pour une expérience utilisateur fluide où l'utilisateur doit définir ses accès.

### Étape 1 : Vérification du Token
1.  L'utilisateur saisit son **Token** (ou Numéro de compte) sur l'écran d'accueil (`InitialSetupScreen`).
2.  L'application interroge le serveur.
3.  **Réponse Serveur** : Le token est valide et contient le flag `"autoplay": true`.

### Étape 2 : Transition vers l'OTP
4.  L'application détecte le succès et navigue immédiatement vers l'écran **Vérification OTP** (`OtpVerifyScreen`).
5.  Elle transmet l'information : "Nous sommes en mode Automatique".

### Étape 3 : Traitement OTP (Silencieux)
6.  L'écran OTP lance une requête en arrière-plan (`silentOtp`).
7.  **Réponse Serveur** : Le serveur renvoie directement le code OTP (ex: "123456") dans la réponse JSON.
8.  **Action Application** :
    *   Le système remplit automatiquement les 6 cases du code.
    *   Il affiche "Code détecté automatiquement".
    *   Il valide le formulaire automatiquement sans intervention de l'utilisateur.

### Étape 4 : Configuration des Accès (Step 2)
9.  Une fois l'OTP validé, l'utilisateur est redirigé vers l'écran de **Configuration des Accès** (`InitialSetupScreen` - Step 2).
10. Il définit son **Code PIN** et confirme ses informations.
11. Après enregistrement, il est enfin redirigé vers l'écran **Pin Login**.

---

## Scénario 2 : Autoplay est FALSE (Mode Manuel)

Ce mode correspond à un utilisateur dont les accès sont déjà définis.

### Étape 1 : Vérification du Token
1.  L'utilisateur saisit son **Token** sur l'écran d'accueil.
2.  L'application interroge le serveur.
3.  **Réponse Serveur** : Le token est valide mais contient le flag `"autoplay": false`.

### Étape 2 : Transition vers l'OTP
4.  L'application navigue vers l'écran **Vérification OTP** (`OtpVerifyScreen`).
5.  Elle transmet l'information : "Nous sommes en mode Manuel".

### Étape 3 : Traitement OTP (Manuel)
6.  L'écran OTP lance une requête en arrière-plan (pour déclencher l'envoi mail).
7.  **Action Application** :
    *   L'application **bloque** le remplissage automatique.
    *   Elle demande à l'utilisateur de saisir le code reçu par e-mail.
8.  **Action Utilisateur** :
    *   Il saisit le code et valide.

### Étape 4 : Redirection Directe
9.  Une fois l'OTP validé, l'utilisateur est **redirigé directement vers l'écran Pin Login**.
10. L'étape de configuration (Step 2) est sautée car les accès sont considérés comme déjà définis.

---

## Résumé des Différences

| Étape | Autoplay TRUE 🟢 | Autoplay FALSE 🟠 |
| :--- | :--- | :--- |
| **Saisie OTP** | Automatique | Manuelle |
| **Après OTP** | -> **Configuration PIN (Step 2)** | -> **Pin Login (Direct)** |
| **Logique Métier** | "Définir ses accès" | "Accès déjà définis" |
