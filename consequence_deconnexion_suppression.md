# Que se passe-t-il après une déconnexion avec suppression des données ?

Si l'utilisateur décide de se déconnecter en choisissant l'option de **suppression des données** (équivalent à "Oublier cet appareil" ou "Réinitialiser"), voici le déroulement exact :

## 1. Nettoyage Complet
L'application efface toutes les informations de la mémoire sécurisée du téléphone :
*   Le numéro de compte est supprimé.
*   Le Code PIN est supprimé.
*   Le statut "configuré" (`is_configured`) est supprimé.
*   Le token de session est supprimé.

## 2. Retour à la Case Départ
L'utilisateur est redirigé vers l'écran initial (`InitialSetupScreen`).

## 3. Comportement comme un "Nouvel Utilisateur"
Puisque le téléphone a "oublié" l'utilisateur, la redirection automatique **ne fonctionnera plus**.

*   L'utilisateur devra **saisir son numéro de compte**.
*   Il devra passer par l'étape de **vérification API**.
*   Il devra **recevoir et valider un code OTP (SMS/Email)** pour prouver son identité.
*   Il devra **reconfigurer son Code PIN**.

## Résumé
C'est comme si l'utilisateur venait d'installer l'application pour la première fois. La "magie" de la connexion rapide est désactivée par sécurité jusqu'à ce qu'il se ré-enrôle complètement.
