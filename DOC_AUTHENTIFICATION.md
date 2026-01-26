# Principe de Navigation selon Autoplay

Ce document synthétise la logique de navigation et de comportement de l'application en fonction du paramètre `autoplay` renvoyé par le serveur lors de la vérification du token.

## 1. Flux Commun (Départ)
*   L'utilisateur saisit son **Token** sur l'écran d'accueil.
*   L'application vérifie le token auprès du serveur.
*   Le serveur répond avec un statut `autoplay`.
*   **Action :** L'application navigue **toujours** vers l'écran de vérification OTP (`OtpVerifyScreen`).

---

## 2. Distinction des Cas

### CAS A : Autoplay = TRUE (Mode "Première Configuration")
*Scénario : L'utilisateur configure l'appareil pour la première fois ou réinitialise ses accès.*

*   **Comportement OTP :**
    *   L'application récupère le code silencieusement via l'API.
    *   Elle remplit les champs automatiquement.
    *   Elle valide le formulaire automatiquement (sans clic utilisateur).
*   **Redirection POST-OTP :**
    *   Le système redirige vers **l'Étape 2 : Configuration du PIN**.
    *   *Raison :* L'utilisateur doit définir son code PIN et valider ses informations personnelles avant de pouvoir se connecter.
    *   *Finalité :* Une fois le PIN créé, il sera envoyé vers l'écran de Login.

### CAS B : Autoplay = FALSE (Mode "Accès Existants")
*Scénario : L'utilisateur a déjà configuré son compte (PIN existant) mais doit valider ce nouvel appareil.*

*   **Comportement OTP :**
    *   L'application déclenche l'envoi du code par **E-mail**.
    *   L'utilisateur doit saisir le code manuellement.
    *   L'utilisateur doit cliquer sur "Valider".
*   **Redirection POST-OTP :**
    *   Le système redirige **DIRECTEMENT** vers **l'écran de Connexion (PinLoginScreen)**.
    *   *Raison :* Les accès (PIN, Login) sont déjà définis sur le serveur. Il est inutile de refaire la configuration.
    *   *Action :* L'application marque localement la configuration comme terminée et envoie l'utilisateur se connecter.

---

## Tableau Récapitulatif

| Statut Autoplay | Gestion OTP | Destination après OTP | Pourquoi ? |
| :--- | :--- | :--- | :--- |
| **TRUE** | **Automatique** (Zéro clic) | **Configuration PIN** (Step 2) | Il faut créer le PIN localement. |
| **FALSE** | **Manuelle** (Saisie Mail) | **Connexion** (PinLogin) | Le PIN existe déjà, on se connecte. |
