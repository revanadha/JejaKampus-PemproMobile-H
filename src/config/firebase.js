// Firebase Configuration
// Buat project di: https://console.firebase.google.com/

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

/**
 * Smart Storage Adapter:
 * - Expo Go / web → AsyncStorage (SecureStore tidak tersedia)
 * - Development Build / Production → SecureStore (terenkripsi)
 *
 * SecureStore hanya tersedia di native build, bukan Expo Go.
 * Kunci dibatasi 2048 karakter oleh SecureStore, sehingga nilai
 * panjang (token Firebase) dipecah jika perlu — atau fallback ke AsyncStorage.
 */
const isExpoGo = Constants.appOwnership === 'expo';

const SecureStoreAdapter = {
  getItem: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // Fallback jika nilai terlalu panjang atau tidak tersedia
      return await AsyncStorage.getItem(key);
    }
  },
  setItem: async (key, value) => {
    try {
      // SecureStore membatasi value maksimal 2048 byte
      if (value && value.length > 2000) {
        return await AsyncStorage.setItem(key, value);
      }
      return await SecureStore.setItemAsync(key, value);
    } catch {
      return await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

// Pilih adapter berdasarkan environment
const persistenceAdapter = isExpoGo ? AsyncStorage : SecureStoreAdapter;

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD47Ouu-FU0xGcoh2OWErATT94OS_02G18",
  authDomain: "jejakampus.firebaseapp.com",
  projectId: "jejakampus",
  storageBucket: "jejakampus.appspot.com",
  messagingSenderId: "654301402016",
  appId: "1:654301402016:web:576d26cb130c40f0cfcac5",
  measurementId: "G-086YT8VZPV"
};

export const USE_MOCK = firebaseConfig.projectId === "test-app";

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(persistenceAdapter),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

export default app;
