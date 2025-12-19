# Observation : Redirection Directe vers le PIN

## Le Besoin
Une fois qu'un client s'est connecté au moins une fois sur un appareil, il ne doit plus subir le processus de vérification complet (OTP) lorsqu'il revient.

## Le Comportement Implémenté

### 1. Détection
Lorsque l'utilisateur saisit son numéro de compte sur l'écran d'accueil :
*   L'application vérifie silencieusement si ce numéro correspond à celui déjà enregistré dans le téléphone.
*   Elle vérifie également si un code PIN a déjà été défini.

### 2. Action Immédiate
*   **Si c'est le même compte :** L'application **interrompt** la vérification habituelle (pas d'appel API, pas d'envoi de SMS).
*   **Redirection :** L'utilisateur est envoyé **directement** sur l'écran de saisie du Code PIN.

### 3. Résultat pour l'Utilisateur
*   **Fluidité :** Accès instantané à la connexion sécurisée.
*   **Confort :** Pas d'attente de SMS, pas de reconfiguration inutile.
*   **Sécurité :** L'accès reste protégé par le Code PIN que seul l'utilisateur connaît.
