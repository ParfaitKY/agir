# Note Technique : Gestion du Cache et Préservation de l'Autoplay

## Contexte
L'application Zenith Mobile utilise une fonctionnalité "Autoplay" qui permet une reconnexion fluide pour les utilisateurs sur des appareils de confiance. Cette fonctionnalité repose sur un identifiant unique de l'appareil (`device_id`) stocké localement.

## Problématique
Actuellement, lorsque l'utilisateur souhaite réinitialiser l'application ou vider le cache pour résoudre un bug (via une fonction "Effacer les données" ou "Déconnexion forcée"), toutes les données locales sont supprimées, y compris le `device_id`.

**Conséquence :** Le serveur ne reconnaît plus l'appareil comme étant "de confiance". L'Autoplay est désactivé, et l'utilisateur doit recommencer tout le processus d'enrôlement (Saisie du numéro de compte -> OTP -> Création de PIN), ce qui dégrade l'expérience utilisateur.

## Solution Technique Proposée : "Nettoyage Intelligent"

L'objectif est d'offrir une option "Réinitialiser l'application" qui efface toutes les données sensibles et de configuration, **SAUF** le lien de confiance avec le serveur.

### Algorithme de la fonction `clearAppCache`

1.  **Sauvegarde Préalable** :
    Avant toute suppression, l'application lit et met en mémoire la valeur actuelle du `device_id`.

2.  **Nettoyage Complet** :
    L'application procède à la suppression de toutes les clés de stockage connues :
    *   Tokens d'authentification (`auth_token`)
    *   Données utilisateur (`user_data`, `user_login`, profil)
    *   Configuration locale (`is_configured`)
    *   Codes PIN cryptés (`pin_user`)
    *   Clés secrètes (`user_secret_key`)
    *   Données métier en cache (Soldes, historiques, bénéficiaires)

3.  **Restauration Ciblée** :
    Immédiatement après le nettoyage, l'application réécrit le `device_id` sauvegardé à l'étape 1 dans le stockage sécurisé.

### Résultat pour l'Utilisateur

*   **Sécurité** : L'application est "propre". Plus aucune donnée personnelle ou bancaire n'est accessible sans reconnexion.
*   **Expérience** : Au redémarrage, l'application détecte le `device_id` restauré. Le serveur reconnait l'appareil et autorise l'utilisateur à se reconnecter simplement avec son PIN (ou à le redéfinir via le login) sans repasser par la validation OTP complexe.

## Implémentation

Cette logique doit être encapsulée dans un utilitaire dédié (ex: `cacheManager.ts`) et appelée lors de l'action "Effacer les données" dans les paramètres de l'application.

```typescript
// Pseudo-code de la logique
async function smartCacheClear() {
  // 1. Sauvegarde
  const deviceId = await getStorage('device_id');

  // 2. Suppression totale
  await clearAllStorage();

  // 3. Restauration
  if (deviceId) {
    await setStorage('device_id', deviceId);
  }
}
```
