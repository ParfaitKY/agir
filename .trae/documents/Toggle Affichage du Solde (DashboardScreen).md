## Objectif
- Permettre d’afficher et de masquer le solde sur la carte principale du tableau de bord, sans modifier la mise en page ni les autres informations.

## Changements ciblés
- Ajouter un état local `isBalanceHidden` pour contrôler la visibilité du solde.
- Rendre le bouton œil interactif (dans la section utilisateur) pour basculer l’état.
- Changer dynamiquement l’icône entre `eye-outline` et `eye-off-outline` selon l’état.
- Afficher un masque (`••••••••`) à la place du montant lorsque le solde est caché.
- Conserver les sous-informations (comptes actifs, pourcentage) visibles; seule la valeur du solde est masquée.

## Détails d’implémentation
- État
  - Ajouter: `const [isBalanceHidden, setIsBalanceHidden] = useState(false);` près des autres hooks d’état (autour de `showQrModal`, `showAllTransactions`).
- Bouton œil (ligne ~406)
  - Ajouter `onPress={() => setIsBalanceHidden((v) => !v)}` sur le `TouchableOpacity`.
  - Icône: `name={isBalanceHidden ? "eye-off-outline" : "eye-outline"}` pour refléter l’état.
- Solde (ligne ~414)
  - Remplacer le `Text` du montant par une expression conditionnelle:
    - `isBalanceHidden ? "••••••••" : "5 850 000 XAF"`
  - Garder styles existants pour éviter tout décalage visuel.
- Portée
  - Le bloc carte principale n’est rendu que lorsque `!isGuestMode`; aucun changement requis pour le mode invité.

## Vérification
- En mode connecté: toucher l’icône œil doit masquer/afficher immédiatement le montant sans changer la hauteur/largeur du composant.
- En mode invité: la carte principale n’apparaît pas; aucun effet attendu.
- Tester sur Android/iOS (Expo) pour valider le rendu et l’icône.

## i18n et évolutions
- Aucune clé i18n supplémentaire requise; on peut ultérieurement remplacer le masque par une clé `dashboard.balance.hiddenMask` si souhaité.

## Références du fichier
- `src/modules/dashboard/screens/DashboardScreen.tsx:406` (bouton œil)
- `src/modules/dashboard/screens/DashboardScreen.tsx:414` (affichage du montant)