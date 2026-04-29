# Vérification du Compte Bénéficiaire

## Vue d'ensemble

Cette fonctionnalité permet de vérifier et d'afficher les informations du compte destinataire avant d'effectuer un virement. C'est une mesure de sécurité importante qui permet à l'utilisateur de confirmer qu'il envoie de l'argent au bon destinataire.

## Fonctionnement

### 1. Saisie du numéro de compte

L'utilisateur saisit le numéro de compte du bénéficiaire dans le champ "Compte bénéficiaire".

### 2. Vérification du compte

- Un bouton de recherche (icône loupe) apparaît à droite du champ lorsqu'un numéro est saisi
- L'utilisateur clique sur ce bouton pour vérifier le compte
- Le système interroge l'API `CLIENT_BY_COMPTE` pour récupérer les informations du client

### 3. Affichage des informations

Si le compte existe, une carte verte s'affiche avec :

- ✓ Icône de vérification
- **Nom et prénom du titulaire du compte** (récupérés via l'API)
- Type de compte (Compte courant, Compte épargne, etc.)
- Numéro de compte

### 4. Validation du transfert

- Le bouton "Effectuer le virement" n'est activé que si :
  - Le compte source est sélectionné
  - Le compte bénéficiaire est vérifié avec succès
  - Un montant valide est saisi

### 5. Confirmation

Dans la modale de confirmation, les informations du bénéficiaire (nom et prénom) sont affichées pour une dernière vérification avant le transfert.

## Gestion des erreurs

Si le compte n'existe pas ou si une erreur se produit :

- Un message d'erreur rouge s'affiche
- Le bouton de transfert reste désactivé
- L'utilisateur peut modifier le numéro et réessayer

## Modification du numéro

Si l'utilisateur modifie le numéro de compte après vérification :

- Les informations du bénéficiaire sont effacées
- Le bouton de vérification réapparaît
- L'utilisateur doit vérifier à nouveau le nouveau numéro

## Fichiers concernés

### Services

- `src/services/compte/verifyBeneficiaryAccount.ts` : Service API pour vérifier un compte via CLIENT_BY_COMPTE

### Domain

- `src/domain/compte/useVerifyBeneficiary.ts` : Hook React pour la vérification avec extraction des informations client

### UI

- `src/modules/transactions/screens/TransferScreen.tsx` : Écran de virement avec vérification

## API utilisée

L'endpoint `CLIENT_BY_COMPTE` (`/auth/client-by-compte`) est utilisé pour récupérer les informations complètes du client à partir d'un numéro de compte.

**Payload :**

```typescript
{
  numero_compte: string,
  device_id: string,
  brand: string,
  model: string,
  os: string,
  code_cryptage: string
}
```

**Headers :**

```typescript
{
  "X-NO-AUTH": "true"  // Pas besoin d'authentification pour cette API
}
```

**Réponse attendue :**

```typescript
{
  success: boolean,
  data: {
    NOMCLIENT: string,        // Nom du titulaire
    PRENOMCLIENT: string,     // Prénom du titulaire
    NUMCOMPTE: string,        // Numéro de compte
    IDCLIENT: string,         // ID du client
    CO_INTITULECOMPTE: string // Type de compte (optionnel)
    // ... autres champs
  }
}
```

## Avantages de cette API

1. **Pas besoin d'authentification** : L'API utilise `X-NO-AUTH: true`, donc pas besoin de token
2. **Informations complètes** : Retourne le nom et prénom du titulaire
3. **Validation robuste** : Permet de vérifier que le compte existe réellement
4. **Sécurité renforcée** : L'utilisateur voit le nom du destinataire avant de transférer

## Extraction des données

Le hook utilise une logique de normalisation flexible pour extraire les informations :

```typescript
// Recherche dans plusieurs champs possibles
const lastName = source?.NOMCLIENT ?? source?.NOM ?? source?.nom ?? ...
const firstName = source?.PRENOMCLIENT ?? source?.PRENOM ?? source?.prenom ?? ...
```

Cette approche garantit la compatibilité avec différents formats de réponse de l'API.

## Améliorations futures possibles

1. **Cache des bénéficiaires** : Mémoriser les comptes vérifiés récemment
2. **Liste de bénéficiaires favoris** : Permettre de sauvegarder des bénéficiaires fréquents
3. **Vérification automatique** : Vérifier automatiquement après la saisie complète du numéro
4. **Photo du bénéficiaire** : Afficher la photo si disponible dans l'API
5. **Historique des transferts** : Suggérer des bénéficiaires basés sur l'historique
