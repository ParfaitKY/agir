# Gestion des Bénéficiaires

## Vue d'ensemble

Le système de gestion des bénéficiaires permet aux utilisateurs de sauvegarder leurs contacts fréquents pour faciliter les virements futurs. Les données sont stockées localement sur l'appareil de l'utilisateur.

## Fonctionnalités

### 1. **Ajouter un bénéficiaire**

L'utilisateur peut ajouter un nouveau bénéficiaire en fournissant :

- ✅ Nom complet (obligatoire)
- ✅ Numéro de compte (obligatoire)
- ✅ Banque (obligatoire, sélection dans une liste)
- ⚪ Email (optionnel)

**Processus :**

1. Cliquer sur le bouton "+" (FAB ou bouton dans le header)
2. Remplir le formulaire dans la modale
3. Cliquer sur "Enregistrer"
4. Le bénéficiaire est ajouté à la liste

### 2. **Afficher les bénéficiaires**

L'écran affiche :

- **Statistiques** : Nombre total, favoris, montant total transféré
- **Accès rapide** : Les 6 premiers bénéficiaires en cercles
- **Barre de recherche** : Recherche par nom ou numéro de compte
- **Onglets** : "Tous" ou "Favoris"
- **Liste complète** : Cartes détaillées de chaque bénéficiaire

### 3. **Marquer comme favori**

- Cliquer sur l'étoile à côté du nom
- Les favoris apparaissent dans l'onglet "Favoris"
- Les favoris ont une étoile dorée dans l'accès rapide

### 4. **Supprimer un bénéficiaire**

- Cliquer sur l'icône de corbeille
- Confirmer la suppression dans l'alerte
- Le bénéficiaire est supprimé définitivement

### 5. **Effectuer un virement vers un bénéficiaire**

**Depuis l'écran des bénéficiaires :**

- Cliquer sur la flèche à droite de la carte
- L'écran de virement s'ouvre avec le numéro pré-rempli

**Depuis l'accès rapide :**

- Cliquer sur un cercle de bénéficiaire
- L'écran de virement s'ouvre avec le numéro pré-rempli

### 6. **Historique des transferts**

Chaque fois qu'un virement est effectué :

- Le montant est enregistré sur le bénéficiaire
- La date du dernier transfert est mise à jour
- Ces informations s'affichent sur la carte du bénéficiaire

## Architecture technique

### Stockage des données

Les bénéficiaires sont stockés dans le SecureStorage avec la clé :

```
beneficiaires_{user_id}
```

Chaque utilisateur a sa propre liste de bénéficiaires.

### Structure des données

```typescript
interface Beneficiaire {
  id: string; // Timestamp unique
  name: string; // Nom complet
  accountNumber: string; // Numéro de compte
  bank: string; // Nom de la banque
  email?: string; // Email (optionnel)
  favorite: boolean; // Statut favori
  color: string; // Couleur de l'avatar (hex)
  createdAt: string; // Date de création (ISO)
  lastTransferAmount?: number; // Dernier montant transféré
  lastTransferDate?: string; // Date du dernier transfert (ISO)
}
```

### Hook personnalisé

`useBeneficiaires()` fournit :

```typescript
{
  beneficiaires: Beneficiaire[];           // Liste des bénéficiaires
  isLoading: boolean;                      // État de chargement
  error: string | null;                    // Erreur éventuelle
  stats: {                                 // Statistiques
    total: number;
    favorites: number;
    totalTransferred: number;
  };
  addBeneficiaire: (data) => Promise;      // Ajouter
  deleteBeneficiaire: (id) => Promise;     // Supprimer
  toggleFavorite: (id) => Promise;         // Basculer favori
  updateBeneficiaire: (id, data) => Promise; // Mettre à jour
  recordTransfer: (accountNumber, amount) => Promise; // Enregistrer un transfert
  reload: () => Promise;                   // Recharger
  getInitials: (name) => string;           // Obtenir les initiales
}
```

## Fichiers concernés

### Domain

- `src/domain/beneficiaires/useBeneficiaires.ts` : Hook de gestion des bénéficiaires

### UI

- `src/modules/dashboard/screens/BeneficiairesPage.tsx` : Page principale
- `src/modules/dashboard/screens/AddBeneficiaireModal.tsx` : Modale d'ajout
- `src/modules/transactions/screens/TransferScreen.tsx` : Écran de virement (intégration)

## Flux utilisateur

### Ajouter un bénéficiaire

```
1. Utilisateur clique sur "+"
   ↓
2. Modale s'ouvre
   ↓
3. Remplit le formulaire
   ↓
4. Clique sur "Enregistrer"
   ↓
5. Validation des champs
   ↓
6. Sauvegarde dans SecureStorage
   ↓
7. Mise à jour de la liste
   ↓
8. Modale se ferme
   ↓
9. Message de succès
```

### Effectuer un virement

```
1. Utilisateur clique sur la flèche du bénéficiaire
   ↓
2. Navigation vers TransferScreen
   ↓
3. Numéro de compte pré-rempli
   ↓
4. Utilisateur saisit le montant
   ↓
5. Confirme le virement
   ↓
6. Virement effectué
   ↓
7. Enregistrement du transfert sur le bénéficiaire
   ↓
8. Mise à jour de lastTransferAmount et lastTransferDate
```

## Couleurs des avatars

8 couleurs sont disponibles pour les avatars :

- 🔴 Rouge : `#EF4444`
- 🟢 Vert : `#10B981`
- 🟠 Orange : `#F59E0B`
- 🟣 Violet : `#8B5CF6`
- 🔵 Bleu : `#3B82F6`
- 🌸 Rose : `#EC4899`
- 🔷 Turquoise : `#14B8A6`
- 🟧 Orange foncé : `#F97316`

La couleur est attribuée aléatoirement lors de la création.

## Génération des initiales

```typescript
// Un seul mot : 2 premières lettres
"DERLY" → "DE"

// Plusieurs mots : Première lettre de chaque mot
"MARIE KOUASSI" → "MK"
"JEAN PAUL TRAORE" → "JP"
```

## Banques disponibles

Liste des banques dans le sélecteur :

1. CEDAICI SA
2. Ecobank
3. SGBCI
4. NSIA Banque
5. BOA
6. SIB
7. BICICI
8. BNI
9. Coris Bank
10. UBA
11. BGFI Bank
12. Orabank
13. Afriland First Bank
14. GTBank
15. Bridge Bank Group
16. Versus Bank
17. Autre Banque

## Sécurité

- ✅ Données stockées localement (pas de serveur)
- ✅ Utilisation de SecureStorage (chiffré)
- ✅ Isolation par utilisateur (clé avec user_id)
- ✅ Pas de partage entre utilisateurs
- ✅ Suppression lors de la déconnexion (si implémenté)

## Améliorations futures

### Fonctionnalités

1. **Import/Export** : Sauvegarder et restaurer les bénéficiaires
2. **Groupes** : Organiser les bénéficiaires par catégories
3. **Notes** : Ajouter des notes personnelles
4. **Photo** : Ajouter une photo au lieu de l'avatar coloré
5. **Synchronisation cloud** : Sauvegarder sur un serveur
6. **Partage** : Partager un bénéficiaire par QR code

### UX

1. **Tri** : Par nom, date, montant transféré
2. **Filtres avancés** : Par banque, par montant
3. **Statistiques détaillées** : Graphiques des transferts
4. **Suggestions** : Suggérer des bénéficiaires fréquents

### Technique

1. **Validation** : Vérifier le format du numéro de compte
2. **Doublons** : Détecter les bénéficiaires en double
3. **Migration** : Gérer les changements de structure
4. **Backup automatique** : Sauvegarde périodique
