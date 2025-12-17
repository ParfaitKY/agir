**Objet**
- Intégrer le flux OTP sans Bearer en 3 étapes dans `InitialSetupScreen.tsx` et `OtpVerifyScreen.tsx`.

**Endpoints**
- `POST` `http://172.20.10.7:6001/api/auth/client-by-compte`
- `POST` `http://172.20.10.7:6001/api/auth/silent-otp`
- `POST` `http://172.20.10.7:6001/api/auth/verify-otp`

**Constantes**
- `code_cryptage`: `Y}@128eVIXfoi7`
- `API_BASE`: `http://172.20.10.7:6001/api/auth`

**Étape 1: client-by-compte**
- Déclencher après saisie valide du `numero_compte`.
- Payload:
```
{
  "numero_compte": "<NUMERO>",
  "device_id": "<DEVICE_ID>",
  "brand": "<MARQUE>",
  "model": "<MODELE>",
  "os": "<OS>",
  "code_cryptage": "Y}@128eVIXfoi7"
}
```
- Exemple d’intégration dans `InitialSetupScreen.tsx`:
```
const API_BASE = "http://172.20.10.7:6001/api/auth";
const ENCRYPT = "Y}@128eVIXfoi7";

async function getDeviceId() {
  const existing = await secureGetItem("device_id");
  if (existing) return existing;
  const val = `${Platform.OS}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`.toUpperCase();
  await secureSetItem("device_id", val);
  return val;
}

async function getDeviceInfo() {
  const id = await getDeviceId();
  const os = `${Platform.OS} ${Platform.Version}`;
  return { device_id: id, brand: "Unknown", model: "Unknown", os };
}

async function submitClientByCompte(numero_compte) {
  const info = await getDeviceInfo();
  const res = await fetch(`${API_BASE}/client-by-compte`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      numero_compte,
      ...info,
      code_cryptage: ENCRYPT,
    }),
  });
  const data = await res.json();
  await secureSetItem("user_account_number", numero_compte);
  navigation.navigate("OtpVerify", {
    numero_compte,
    device_id: info.device_id,
    onSuccess: () => {/* suite du setup */},
    onCancel: () => {/* retour */},
  });
}
```

**Étape 2: silent-otp**
- Appel silencieux immédiatement après succès de l’étape 1.
- Afficher un patienteur pendant le chargement.
- Remplir automatiquement les 6 cases OTP si un `otp_code` est retourné.
- Payload:
```
{
  "numero_compte": "<NUMERO>",
  "device_id": "<DEVICE_ID>",
  "code_cryptage": "Y}@128eVIXfoi7"
}
```
- Intégré dans `OtpVerifyScreen.tsx` (déjà appliqué):
  - Récupère `numero_compte` et `device_id` (via params ou SecureStorage).
  - Appelle `silent-otp` et auto-remplit les cases si présent.
  - Affiche "Patientez, détection du code…" puis "Détecté" ou "En attente".

**Étape 3: verify-otp**
- Validation du code OTP.
- Payload:
```
{
  "numero_compte": "<NUMERO>",
  "device_id": "<DEVICE_ID>",
  "otp_code": "<CODE_6_CHIFFRES>",
  "code_cryptage": "Y}@128eVIXfoi7"
}
```
- Intégré dans `OtpVerifyScreen.tsx`:
  - Bouton "Valider" envoie la requête.
  - En cas de succès, déclenche `onSuccess` et revient.
  - En cas d’échec, affiche un message d’erreur.

**Notes d’implémentation**
- Aucun en-tête d’autorisation Bearer.
- `device_id` est généré et persisté via `SecureStorage` si absent.
- `os` utilise `Platform.OS` et `Platform.Version`.
- `brand` et `model` peuvent être enrichis avec `expo-device` si souhaité.

**Points d’intégration UI**
- `InitialSetupScreen.tsx`:
  - Ajouter l’appel `submitClientByCompte` sur la validation du numéro de compte.
  - Gérer les états `loading` et `error`.
- `OtpVerifyScreen.tsx`:
  - Patienteur de détection.
  - Auto-remplissage OTP.
  - Validation et gestion des erreurs.

