# Connexion sur un NOUVEAU Téléphone : Ce qui va se passer

Lorsqu'un utilisateur installe l'application sur un **nouveau téléphone** (ou réinstalle l'application après l'avoir supprimée), le comportement est strictement sécurisé.

Voici le déroulement étape par étape :

## 1. L'État Initial
Le nouveau téléphone est "vierge". Il ne possède aucune donnée dans sa mémoire sécurisée (`SecureStore`).
*   Il ne connaît pas le numéro de compte.
*   Il ne connaît pas le Code PIN.
*   Il n'a pas le "token" de confiance.

## 2. La Tentative de Redirection (Échec Volontaire)
Lorsque l'utilisateur saisit son numéro de compte et clique sur "Vérifier" :
1.  L'application cherche dans sa mémoire : *"Est-ce que je connais déjà ce compte ?"*
2.  **Réponse : NON.** (Puisque c'est un nouveau téléphone).
3.  **Conséquence :** La redirection automatique vers le PIN est **désactivée**.

## 3. Le Retour à la Sécurité Renforcée (Parcours Standard)
Puisque le téléphone n'est pas encore "de confiance", l'application oblige l'utilisateur à prouver son identité :

1.  **Vérification Serveur :** L'app interroge le serveur pour vérifier le compte.
2.  **Preuve d'Identité (OTP) :**
    *   Un code est envoyé par SMS/Email.
    *   L'utilisateur **DOIT** saisir ce code. C'est la seule façon de prouver que c'est bien lui et pas un fraudeur qui a juste trouvé son numéro de compte.
3.  **Configuration du PIN :**
    *   L'utilisateur doit saisir son Code PIN (celui qu'il utilisait déjà, ou un nouveau s'il le souhaite).
    *   Cela permet d'enregistrer ce PIN dans la mémoire sécurisée de ce *nouveau* téléphone.

## 4. Résultat Final
Une fois ces étapes validées :
*   Le nouveau téléphone devient un **appareil de confiance**.
*   Les données sont enregistrées localement.
*   **La prochaine fois**, la redirection automatique fonctionnera aussi sur cet appareil.

## Résumé
Sur un nouveau téléphone, **pas de raccourci**. La sécurité prime : l'utilisateur doit refaire le parcours complet (OTP + PIN) une seule fois pour enrôler ce nouvel appareil.
