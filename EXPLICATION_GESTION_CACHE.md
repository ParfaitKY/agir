# Note Technique : Optimisation de la Gestion du Cache et Réinitialisation

## Objectif
Améliorer la procédure de "Nettoyage des données" de l'application mobile pour concilier **sécurité** (suppression des données personnelles) et **expérience utilisateur** (fluidité de reconnexion).

## Problématique Actuelle
Lorsqu'une réinitialisation des données est effectuée (via les paramètres de l'application ou une déconnexion forcée), l'application supprime intégralement le stockage local.

Cela inclut l'**Identifiant Unique de l'Appareil** (`device_id`), qui sert de lien de confiance entre le téléphone et le serveur bancaire.
**Conséquence :** Le serveur considère le téléphone comme un "nouvel appareil inconnu". L'utilisateur est donc forcé de reprendre le parcours d'enrôlement complet (Saisie du numéro de compte, validation OTP par SMS, redéfinition du code secret).

## Solution Technique : "Réinitialisation Intelligente"

La solution consiste à affiner la suppression des données pour cibler uniquement les éléments liés à la session utilisateur, tout en préservant l'empreinte technique du téléphone.

### Algorithme de Nettoyage Proposé

L'opération de nettoyage se déroule en trois étapes strictes :

1.  **Identification et Protection** :
    L'application isole l'identifiant technique (`device_id`) actuellement stocké.

2.  **Purge des Données Sensibles** :
    L'application exécute une suppression complète des données confidentielles et de session :
    *   Suppression des jetons d'authentification (`auth_token`).
    *   Suppression des informations client (Nom, Prénom, Soldes, Historique).
    *   Suppression des préférences utilisateur (Langue, Thème).
    *   Suppression des clés de chiffrement temporaires.

3.  **Persistance de l'Appareil** :
    L'identifiant technique (`device_id`) est maintenu ou restauré immédiatement dans le coffre-fort sécurisé du téléphone.

### Bénéfices

*   **Sécurité garantie** : Aucune donnée bancaire ou personnelle ne survit à l'opération. L'application revient à un état "neutre".
*   **Confort d'usage** : Au redémarrage, le serveur reconnaît immédiatement le téléphone. Il propose directement l'écran de connexion (Login/Mot de passe ou PIN) sans imposer de nouvelles étapes de vérification d'identité par SMS.
