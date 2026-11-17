// Token persistence, per the Expo Router authentication guide:
// SecureStore (Keychain / Android Keystore) on native, localStorage on web.
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useReducer } from 'react';
import { Platform } from 'react-native';

type StorageState = [[boolean, string | null], (value: string | null) => void];

export async function setStorageItemAsync(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else if (value == null) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export function useStorageState(key: string): StorageState {
  const [state, setState] = useReducer(
    (_: [boolean, string | null], action: string | null): [boolean, string | null] => [false, action],
    [true, null],
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        setState(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
      } catch {
        setState(null);
      }
    } else {
      SecureStore.getItemAsync(key)
        .then(setState)
        .catch(() => setState(null));
    }
  }, [key]);

  const setValue = useCallback(
    (value: string | null) => {
      setState(value);
      setStorageItemAsync(key, value);
    },
    [key],
  );

  return [state, setValue];
}
