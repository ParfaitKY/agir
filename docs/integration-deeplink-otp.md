# Intégration du gestionnaire de lien OTP (Deep Link)

## Où intégrer le code ?

**Fichier cible : `src/app/navigation/AppNavigator.tsx`**

Ce fichier contient déjà un `handleDeepLink` complet dans le `useEffect` de `AppNavigator`.
Il gère 3 cas (SMS, callback web, magic link). Il faut ajouter un **4ème cas** pour le lien OTP.

---

## Emplacement exact

Dans la fonction `handleDeepLink`, dans le bloc **"Ordre de priorité"**, **avant** le cas 1 (SMS) :

```tsx
// ── Ordre de priorité ───────────────────────────────────────────────
const url = event.url;

// 👇 AJOUTER ICI — CAS 0 : Lien OTP direct (cedaici://api/auth/verify?token=...&otp=...&uid=...)
if (url.includes("/auth/verify") && url.includes("otp=")) {
  try {
    const parsed = Linking.parse(url);
    const otp = parsed.queryParams?.otp as string;
    const uid = parsed.queryParams?.uid as string;
    const exp = parsed.queryParams?.exp as string;

    console.log("[DeepLink OTP] otp:", otp, "uid:", uid, "exp:", exp);

    // Vérifier expiration
    if (exp && Date.now() / 1000 > Number(exp)) {
      Alert.alert("Lien expiré", "Ce lien OTP n'est plus valide.");
      return;
    }

    if (!otp || !uid) {
      Alert.alert("Lien invalide", "Paramètres OTP manquants.");
      return;
    }

    // Appeler l'endpoint verify-otp-simple
    const response = await fetch(`${BASE_URL}/auth/verify-otp-simple`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: uid, otp_code: otp }),
    });
    const data = await response.json();

    if (data?.success) {
      await markConfigured(true);
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } else {
      Alert.alert("❌ Erreur", data?.message || "Code OTP invalide.");
    }
  } catch (e) {
    console.error("[DeepLink OTP] Erreur:", e);
    Alert.alert("Erreur", "Impossible de traiter ce lien OTP.");
  }
  return;
}

// 1. SMS / WhatsApp (déjà existant)
if (url.includes("verify-sms") || url.includes("sms-verify")) {
  ...
```

---

## Import à ajouter en haut du fichier

`Linking` est déjà importé dans `AppNavigator.tsx` via React Native :

```tsx
import { Linking } from "react-native"; // ✅ déjà présent
```

---

## Résumé du flux

```
SMS reçu → lien cedaici://api/auth/verify?token=...&otp=6784&uid=100000002495&exp=...
    └── App ouverte → handleDeepLink()
            └── Détecte "/auth/verify" + "otp="
                    └── POST /auth/verify-otp-simple { user_id, otp_code }
                            ├── success → markConfigured(true) → Dashboard
                            └── erreur  → Alert message serveur
```

---

## Note importante

Ne pas remplacer le code existant dans `handleDeepLink` — juste **insérer le nouveau cas avant le cas 1**.
Les cas existants (SMS, callback web, magic link) restent inchangés.
