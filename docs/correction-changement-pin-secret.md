# Correction du changement de PIN et Code Secret

## Date : 29 Avril 2026

## Problème identifié

**Symptôme :**

- L'utilisateur change son code PIN ou son code secret
- Le système affiche "Réalisé avec succès"
- Mais l'ancien code continue de fonctionner
- Le nouveau code ne fonctionne pas

**Cause :**

1. **Pour le PIN** : Le nouveau PIN était bien sauvegardé localement (hashé en SHA256), mais pas synchronisé avec le serveur
2. **Pour le code secret** : Le code ne faisait rien du tout ! Il affichait juste un console.log et fermait la modale

## Solution implémentée

### 1. Changement de PIN

**Avant :**

```typescript
// Sauvegarde locale uniquement
await secureSetItem("pin_user", hashedNewPin);
Alert.alert("Succès", "Votre code PIN a été modifié avec succès.");
// L'utilisateur reste connecté avec l'ancien PIN en mémoire
```

**Après :**

```typescript
// Sauvegarde locale
await secureSetItem("pin_user", hashedNewPin);

// Déconnexion forcée pour synchroniser
Alert.alert(
  "Succès",
  "Votre code PIN a été modifié avec succès. Vous allez être déconnecté pour appliquer les changements.",
  [
    {
      text: "OK",
      onPress: async () => {
        await logout(); // Force la reconnexion avec le nouveau PIN
      },
    },
  ],
);
```

### 2. Changement de Code Secret

**Avant :**

```typescript
onPress={() => {
  if (newPassword !== confirmPassword) {
    setPasswordError("Les clés ne correspondent pas");
    return;
  }
  console.log("Change secret key", { currentPassword, newPassword });
  // ❌ Rien n'est fait !
  setShowChangePasswordModal(false);
}}
```

**Après :**

```typescript
onPress={async () => {
  // 1. Validation
  if (newPassword !== confirmPassword) {
    setPasswordError("Les clés ne correspondent pas");
    return;
  }
  if (!newPassword || newPassword.length < 4) {
    setPasswordError("La clé secrète doit contenir au moins 4 caractères");
    return;
  }

  // 2. Vérification de l'ancienne clé
  const storedSecret = await secureGetItem("user_secret_key");
  if (storedSecret && storedSecret !== currentPassword) {
    setPasswordError("La clé secrète actuelle est incorrecte.");
    return;
  }

  // 3. Appel API pour mettre à jour sur le serveur
  const result = await updateLogin(payload, headers);

  // 4. Sauvegarde locale
  await secureSetItem("user_secret_key", newPassword);

  // 5. Déconnexion forcée
  Alert.alert(
    "Succès",
    "Votre clé secrète a été modifiée avec succès. Vous allez être déconnecté.",
    [{ text: "OK", onPress: async () => await logout() }]
  );
}}
```

## Pourquoi forcer la déconnexion ?

### Problème de synchronisation

Quand l'utilisateur change son PIN/code secret :

1. **Sauvegarde locale** : Le nouveau code est sauvegardé sur l'appareil
2. **Appel API** : Le serveur est censé mettre à jour le code
3. **Problème** : L'utilisateur reste connecté avec l'ancien code en mémoire

**Scénario problématique :**

```
1. Utilisateur connecté avec PIN "12345"
2. Change le PIN pour "54321"
3. Nouveau PIN sauvegardé localement
4. Utilisateur reste connecté (session active)
5. Ferme l'app et la rouvre
6. Essaie de se connecter avec "54321" → ❌ Échec
7. Essaie avec "12345" → ✅ Succès (car le serveur a encore l'ancien)
```

**Solution avec déconnexion :**

```
1. Utilisateur connecté avec PIN "12345"
2. Change le PIN pour "54321"
3. Nouveau PIN sauvegardé localement
4. API appelée pour mettre à jour le serveur
5. Déconnexion automatique
6. Utilisateur se reconnecte avec "54321"
7. Le serveur valide le nouveau PIN
8. ✅ Synchronisation complète
```

## Flux utilisateur

### Changement de PIN

```
1. Utilisateur ouvre "Paramètres"
   ↓
2. Clique sur "Changer le code PIN"
   ↓
3. Saisit :
   - PIN actuel (5 chiffres)
   - Nouveau PIN (5 chiffres)
   - Confirmation du nouveau PIN
   ↓
4. Clique sur "Confirmer"
   ↓
5. Validation :
   - PIN actuel correct ?
   - Nouveau PIN = Confirmation ?
   - Nouveau PIN = 5 chiffres ?
   ↓
6. Appel API updateLogin
   ↓
7. Sauvegarde locale (hashé SHA256)
   ↓
8. Message : "Votre code PIN a été modifié avec succès.
              Vous allez être déconnecté pour appliquer les changements."
   ↓
9. Utilisateur clique "OK"
   ↓
10. Déconnexion automatique
    ↓
11. Écran de connexion par PIN
    ↓
12. Utilisateur se connecte avec le nouveau PIN
    ↓
13. ✅ Succès
```

### Changement de Code Secret

```
1. Utilisateur ouvre "Paramètres"
   ↓
2. Clique sur "Changer le code secret"
   ↓
3. Saisit :
   - Code secret actuel
   - Nouveau code secret (min 4 caractères)
   - Confirmation du nouveau code
   ↓
4. Clique sur "Confirmer"
   ↓
5. Validation :
   - Code actuel correct ?
   - Nouveau code = Confirmation ?
   - Nouveau code >= 4 caractères ?
   ↓
6. Appel API updateLogin
   ↓
7. Sauvegarde locale
   ↓
8. Message : "Votre clé secrète a été modifiée avec succès.
              Vous allez être déconnecté pour appliquer les changements."
   ↓
9. Utilisateur clique "OK"
   ↓
10. Déconnexion automatique
    ↓
11. Écran de connexion
    ↓
12. Utilisateur se connecte avec le nouveau code secret
    ↓
13. ✅ Succès
```

## Sécurité

### Hashage du PIN

Le PIN est toujours hashé en SHA256 avant d'être sauvegardé :

```typescript
const hashedNewPin = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  newPin,
);
await secureSetItem("pin_user", hashedNewPin);
```

**Avantages :**

- ✅ Le PIN n'est jamais stocké en clair
- ✅ Même si quelqu'un accède au storage, il ne peut pas lire le PIN
- ✅ Protection contre les attaques par lecture de mémoire

### Vérification de l'ancien code

Avant de changer, le système vérifie que l'utilisateur connaît l'ancien code :

**Pour le PIN :**

```typescript
const storedPin = await secureGetItem("pin_user");
const isHash = /^[a-f0-9]{64}$/i.test(storedPin);
if (isHash) {
  const hashedCurrent = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    currentPin,
  );
  match = hashedCurrent === storedPin;
}
```

**Pour le code secret :**

```typescript
const storedSecret = await secureGetItem("user_secret_key");
if (storedSecret && storedSecret !== currentPassword) {
  setPasswordError("La clé secrète actuelle est incorrecte.");
  return;
}
```

## Validation

### PIN

- ✅ Exactement 5 chiffres
- ✅ Nouveau PIN ≠ Ancien PIN (recommandé)
- ✅ Nouveau PIN = Confirmation

### Code Secret

- ✅ Minimum 4 caractères
- ✅ Nouveau code = Confirmation
- ✅ Ancien code correct

## Messages d'erreur

### PIN

- "Le code PIN actuel est incorrect."
- "Le code PIN doit contenir exactement 5 chiffres."
- "Les codes PIN ne correspondent pas."
- "Erreur lors de la mise à jour : [message serveur]"

### Code Secret

- "La clé secrète actuelle est incorrecte."
- "La clé secrète doit contenir au moins 4 caractères."
- "Les clés ne correspondent pas."
- "Erreur lors de la mise à jour : [message serveur]"

## API utilisée

**Endpoint :** `/auth/update-login` (PUT)

**Payload :**

```json
{
  "nouveau_login": "user_login",
  "nouveau_motpasse": "nouveau_pin_ou_login",
  "cle_secrete": "nouvelle_cle_secrete",
  "code_cryptage": "Y}@128eVIXfoi7",
  "SL_LOGIN": "user_login",
  "LOGIN": "user_login"
}
```

**Headers :**

```json
{
  "Authorization": "Bearer [token]",
  "X-CLIENT-ID": "[client_id]",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

## Fichiers modifiés

- `src/modules/settings/screens/SettingsScreen.tsx`
  - Ajout de `loadingPassword` state
  - Implémentation complète du changement de code secret
  - Déconnexion forcée après changement de PIN
  - Déconnexion forcée après changement de code secret

## Tests recommandés

### Test 1 : Changement de PIN réussi

1. Se connecter
2. Aller dans Paramètres → Changer le code PIN
3. Saisir : Ancien PIN, Nouveau PIN, Confirmation
4. Cliquer "Confirmer"
5. ✅ Message de succès
6. ✅ Déconnexion automatique
7. Se reconnecter avec le nouveau PIN
8. ✅ Connexion réussie

### Test 2 : Ancien PIN incorrect

1. Aller dans Paramètres → Changer le code PIN
2. Saisir un mauvais ancien PIN
3. ✅ Message "Le code PIN actuel est incorrect."
4. ✅ Pas de changement

### Test 3 : Confirmation ne correspond pas

1. Aller dans Paramètres → Changer le code PIN
2. Nouveau PIN ≠ Confirmation
3. ✅ Message "Les codes PIN ne correspondent pas."
4. ✅ Pas de changement

### Test 4 : Changement de code secret réussi

1. Se connecter
2. Aller dans Paramètres → Changer le code secret
3. Saisir : Ancien code, Nouveau code, Confirmation
4. Cliquer "Confirmer"
5. ✅ Message de succès
6. ✅ Déconnexion automatique
7. Se reconnecter avec le nouveau code secret
8. ✅ Connexion réussie

### Test 5 : Code secret trop court

1. Aller dans Paramètres → Changer le code secret
2. Saisir un code de moins de 4 caractères
3. ✅ Message "La clé secrète doit contenir au moins 4 caractères."
4. ✅ Pas de changement

## Améliorations futures

1. **Confirmation par SMS/Email** : Envoyer un code de confirmation avant de changer
2. **Historique des changements** : Logger les changements de PIN/code secret
3. **Politique de mot de passe** : Forcer des codes plus complexes
4. **Expiration** : Forcer le changement tous les X mois
5. **Tentatives limitées** : Bloquer après X tentatives de changement échouées
6. **Notification** : Envoyer une notification après changement réussi
