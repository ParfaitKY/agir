import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Utilitaires de stockage sécurisés avec fallback pour Android/Web
export async function secureSetItem(key: string, value: string): Promise<void> {
  // Web fallback
  if (Platform.OS === 'web') {
    try {
      window?.localStorage?.setItem(key, value);
      return;
    } catch (e) {
      // Ignore and continue to try SecureStore
    }
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    // Fallback natif (Android/iOS) si SecureStore indisponible
    await AsyncStorage.setItem(key, value);
  } catch (err) {
    // Dernier fallback pour Web si nécessaire
    if (Platform.OS === 'web') {
      try {
        window?.localStorage?.setItem(key, value);
        return;
      } catch (e) {}
    }
    throw err;
  }
}

export async function secureGetItem(key: string): Promise<string | null> {
  // Web fallback
  if (Platform.OS === 'web') {
    try {
      const v = window?.localStorage?.getItem(key);
      if (v !== null && v !== undefined) return v;
    } catch (e) {
      // Ignore and continue
    }
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      const v = await SecureStore.getItemAsync(key);
      if (v !== null && v !== undefined) return v;
    }
    // Fallback natif
    const v2 = await AsyncStorage.getItem(key);
    return v2;
  } catch (err) {
    // Dernier fallback pour Web si nécessaire
    if (Platform.OS === 'web') {
      try {
        return window?.localStorage?.getItem(key);
      } catch (e) {}
    }
    throw err;
  }
}

export async function secureDeleteItem(key: string): Promise<void> {
  // Web fallback
  if (Platform.OS === 'web') {
    try {
      window?.localStorage?.removeItem(key);
    } catch (e) {
      // Ignore
    }
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      await SecureStore.deleteItemAsync(key);
    }
    await AsyncStorage.removeItem(key);
  } catch (err) {
    // Dernier fallback pour Web si nécessaire
    if (Platform.OS === 'web') {
      try {
        window?.localStorage?.removeItem(key);
        return;
      } catch (e) {}
    }
    throw err;
  }
}

