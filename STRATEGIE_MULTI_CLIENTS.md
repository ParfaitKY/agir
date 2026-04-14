# Stratégie de Centralisation : Où mettre les informations des autres APK clients ?

Dans un système multi-clients (White Label), l'objectif est de supprimer les informations spécifiques à chaque client du code source de l'application mobile et de les déplacer vers un **Backend Centralisé**.

---

## 1. Avant vs Après : Le changement de stockage

### **Avant (Ancien modèle)**
Chaque client avait son propre APK (ou une version du code) avec des fichiers configurés en local :
- **Fichier `endpoints.ts`** : Contenait l'URL spécifique du serveur client.
- **Dossier `assets/`** : Contenait les logos, icônes et splashscreens du client.
- **Thèmes graphiques** : Les couleurs étaient codées en dur dans le code.

### **Après (Nouveau modèle)**
Une seule application générique est publiée. Toutes les informations des anciens APK sont déplacées dans une **Base de Données Backend (Discovery Service)**.

---

## 2. Structure du Stockage Centralisé (Côté Serveur)

Le serveur de découverte (Discovery Service) possèdera une table `Clients` ou `Configurations`. Voici à quoi ressemblerait le stockage de toutes les infos de vos anciens clients :

| Champ | Exemple Client A (ex: CEDAICI) | Exemple Client B (ex: ZENITH) |
| :--- | :--- | :--- |
| **clientId** (ID sécurisé) | `cedaici_prod_2024` | `zenith_test_99` |
| **baseUrl** | `https://api.cedaici.com/api` | `https://zenith-test.mgd.plus/api` |
| **clientName** | CEDAICI CI | Zenith Bank |
| **primaryColor** | `#004A99` (Bleu) | `#E30613` (Rouge) |
| **logoUrl** | `https://cdn.mgd.plus/logos/cedaici.png` | `https://cdn.mgd.plus/logos/zenith.png` |
| **enabledFeatures** | `["virement", "wallet", "credit"]` | `["virement", "analytics"]` |

---

## 3. Comment l'application récupère ces infos ?

L'application ne connaît rien au démarrage. Voici le flux :

1. **Saisie de l'ID** : L'utilisateur (ou un paramètre d'installation) fournit l'identifiant `clientId`.
2. **Requête Discovery** : L'app appelle `GET https://discovery.mgd.plus/config/{clientId}`.
3. **Réponse JSON** : Le serveur renvoie toute la configuration stockée en base de données.
4. **Injection** :
   - L'URL va dans le [httpClient.ts](file:///d:/PROJET_MG_DIGITAL_PLUS/REACTZENITHMOBILE/src/services/httpClient.ts).
   - Les couleurs vont dans le [ThemeProvider.tsx](file:///d:/PROJET_MG_DIGITAL_PLUS/REACTZENITHMOBILE/src/shared/styles/ThemeProvider.tsx).
   - Le logo est chargé dynamiquement via l'URL reçue.

---

## 4. Où mettre les fichiers physiques (Logos, Images) ?

Puisque vous ne pouvez plus mettre les logos de tous les clients dans le dossier `assets/` de l'APK (cela alourdirait l'application inutilement), vous devez :
1. Les héberger sur un **serveur de fichiers (CDN)** ou un dossier public sur votre serveur.
2. Stocker simplement l'URL de l'image dans la base de données de configuration.

---

## 5. Résumé de la migration

| Info à migrer | Ancien emplacement (APK) | Nouvel emplacement (Système Central) |
| :--- | :--- | :--- |
| URLs API | [endpoints.ts](file:///d:/PROJET_MG_DIGITAL_PLUS/REACTZENITHMOBILE/src/services/endpoints.ts) | Base de données Backend (Table Config) |
| Logos / Images | Dossier `/assets` | Serveur de fichiers distant (CDN/S3) |
| Couleurs / Thèmes | Styles CSS / TS | JSON de configuration envoyé par l'API |
| Droits / Options | Code (IF/ELSE) | Liste de permissions envoyée par l'API |

**En résumé : Toutes les informations des autres clients sont désormais des "données" gérées par un Backend, et non plus du "code" contenu dans l'application.**
