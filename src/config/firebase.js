// Firebase Configuration
// Ganti dengan konfigurasi Firebase project Anda
// Buat project di: https://console.firebase.google.com/

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD47Ouu-FU0xGcoh2OWErATT94OS_02G18",
  authDomain: "jejakampus.firebaseapp.com",
  projectId: "jejakampus",
  storageBucket: "jejakampus.firebasestorage.app",
  messagingSenderId: "654301402016",
  appId: "1:654301402016:web:576d26cb130c40f0cfcac5",
  measurementId: "G-086YT8VZPV"
};

export const USE_MOCK = firebaseConfig.projectId === "test-app";

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

export default app;
