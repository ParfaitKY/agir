# Correction erreur CORS - Update Login

## Date : 29 Avril 2026

## Problème

**Erreur CORS sur le web :**

```
Access to XMLHttpRequest at 'https://...api/auth/update-login'
from origin 'http://localhost:8081' has been blocked by CORS policy:
Request header field x-client-id is not allowed by
Access-Control-Allow-Headers in preflight response.
```

**Cause :**
Le header `X-CLIENT-ID` que nous envoyons n'est pas autorisé par le serveur dans les requêtes CORS.

## Solution

**Avant :**

```typescript
const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...(clientId ? { "X-CLIENT-ID": String(clientId) } : {}), // ❌ Cause CORS
};
```

**Après :**

```typescript
const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  // X-CLIENT-ID retiré car non autorisé par CORS
};
```

## Pourquoi cette erreur ?

### CORS (Cross-Origin Resource Sharing)

Quand une application web (localhost:8081) fait une requête vers un serveur différent (zenithmobile-serveurreact-cedaicitest.app.mgdigitalplus.com), le navigateur effectue une **requête preflight** (OPTIONS) pour vérifier les permissions.

Le serveur doit autoriser explicitement les headers personnalisés via :

```
Access-Control-Allow-Headers: Authorization, Content-Type, Accept
```

Si `X-CLIENT-ID` n'est pas dans cette liste, le navigateur bloque la requête.

### Pourquoi ça marche sur mobile ?

Sur les applications natives (iOS/Android), il n'y a **pas de politique CORS**. Les requêtes HTTP fonctionnent directement sans vérification preflight.

## Impact

- ✅ **Web** : Fonctionne maintenant (pas de header X-CLIENT-ID)
- ✅ **Mobile** : Continue de fonctionner (pas affecté)
- ✅ **API** : Le token Authorization suffit pour l'authentification

## Fichiers modifiés

- `src/modules/settings/screens/SettingsScreen.tsx`
  - Changement de PIN : Header X-CLIENT-ID retiré
  - Changement de code secret : Header X-CLIENT-ID retiré

## Alternative (si X-CLIENT-ID est vraiment nécessaire)

Si le serveur a vraiment besoin de `X-CLIENT-ID`, il faut que l'équipe backend ajoute ce header dans la configuration CORS :

**Configuration serveur (backend) :**

```javascript
// Express.js exemple
app.use(
  cors({
    origin: ["http://localhost:8081", "https://..."],
    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "Accept",
      "X-CLIENT-ID", // ← Ajouter ici
    ],
  }),
);
```

Mais pour l'instant, le token `Authorization` suffit pour identifier l'utilisateur.
