import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { secureGetItem, secureDeleteItem } from "./secureStorage";

/**
 * Nettoie toutes les données de l'application SAUF le device_id.
 * Cela permet de réinitialiser l'application comme si elle venait d'être installée,
 * tout en préservant l'association avec le serveur pour l'autoplay.
 */
export const clearAppCache = async (): Promise<void> => {
  try {
    console.log("=== STARTING SMART CACHE CLEAR ===");

    // 1. Sauvegarder le device_id (même si on essaie de ne pas l'effacer, c'est une sécurité)
    const deviceId = await secureGetItem("device_id");
    const deviceIdBackup = await AsyncStorage.getItem("device_id_backup");
    
    console.log(`Preserving device_id: ${deviceId}`);

    // 2. Liste de toutes les clés connues à supprimer
    const KEYS_TO_REMOVE = [
      "auth_token",
      "user_data",
      "is_configured",
      "pin_user",
      "user_login",
      "user_firstname",
      "user_lastname",
      "user_phone",
      "user_address",
      "user_account_number",
      "user_agency",
      "user_id",
      "user_secret_key",
      "access_data",
      "client_id",
      "solde_globale",
      "compte_statistiques",
      "analyse_derniere_transaction",
      "work_date",
      "auth_token_init",
      "device_brand_token",
      "device_model_token",
      "device_os_token"
    ];

    // 3. Suppression dans SecureStore
    for (const key of KEYS_TO_REMOVE) {
      await secureDeleteItem(key);
    }

    // 4. Suppression dans AsyncStorage (sauf backup device_id)
    const asyncKeys = await AsyncStorage.getAllKeys();
    const asyncKeysToRemove = asyncKeys.filter(k => k !== "device_id_backup");
    if (asyncKeysToRemove.length > 0) {
      await AsyncStorage.multiRemove(asyncKeysToRemove);
    }

    // 5. Restauration explicite si jamais effacé par mégarde (paranoïa utile)
    if (deviceId) {
      await SecureStore.setItemAsync("device_id", deviceId);
    }
    if (deviceIdBackup) {
      await AsyncStorage.setItem("device_id_backup", deviceIdBackup);
    }

    // 6. Nettoyage localStorage web si applicable
    if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.clear();
    }

    console.log("=== SMART CACHE CLEAR COMPLETED ===");
  } catch (error) {
    console.error("Error during smart cache clear:", error);
    throw error;
  }
};
