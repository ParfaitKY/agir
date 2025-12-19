# Faisabilité et Prompt pour la Redirection Automatique

## Est-ce faisable ?
**OUI**. (Cette fonctionnalité a d'ailleurs déjà été implémentée dans votre fichier `InitialSetupScreen.tsx` lors de ma précédente intervention).

## Prompt suggéré
Si vous deviez demander à une IA de coder cette fonctionnalité, voici le prompt idéal à utiliser :

> **"Modifie le fichier `src/modules/auth/screens/InitialSetupScreen.tsx`. Dans la fonction `handleVerifyAccountNumber`, ajoute une vérification avant l'appel API. Récupère les valeurs `user_account_number`, `is_configured` et `pin_user` depuis le `SecureStore`. Si le numéro de compte saisi correspond à celui stocké ET que l'application est marquée comme configurée avec un PIN, redirige immédiatement l'utilisateur vers l'écran `PinLogin` (`navigation.replace('PinLogin')`) et arrête l'exécution de la fonction pour éviter l'envoi de l'OTP."**

Ce prompt est précis car il spécifie :
1.  Le fichier cible.
2.  L'endroit exact (la fonction).
3.  La condition logique (comparaison des données stockées vs saisies).
4.  L'action attendue (redirection immédiate).
5.  Le résultat évité (pas d'OTP).
