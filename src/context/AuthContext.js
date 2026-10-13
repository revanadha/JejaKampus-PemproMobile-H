import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth, USE_MOCK } from '../config/firebase';
import { dbHelpers } from '../config/supabase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

// ⚠️ Ganti dengan Client ID dari Google Cloud Console
// Buka: https://console.cloud.google.com/ > APIs & Services > Credentials
const GOOGLE_WEB_CLIENT_ID = '654301402016-abk059f3b22immuaeri97t293ed5k6g8.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  // Tangani hasil Google Sign-In
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (result) => {
          const profile = await fetchOrCreateGoogleProfile(result.user);
          setUserProfile(profile);
        })
        .catch(console.error);
    }
  }, [response]);

  useEffect(() => {
    if (USE_MOCK) {
      setUser({ uid: 'mock123', email: 'test@umm.ac.id' });
      setUserProfile({ displayName: 'Mahasiswa UMM', role: 'mahasiswa' });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await fetchUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchUserProfile = async (uid) => {
    try {
      const { data, error } = await dbHelpers.getUser(uid);
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error fetching profile:', e);
      return null;
    }
  };

  const fetchOrCreateGoogleProfile = async (firebaseUser) => {
    try {
      const { data: existingUser } = await dbHelpers.getUser(firebaseUser.uid);
      if (existingUser) return existingUser;

      const profileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        display_name: firebaseUser.displayName || 'Pengguna Baru',
        role: 'mahasiswa',
        photo_url: firebaseUser.photoURL || null,
        created_at: new Date().toISOString(),
        report_count: 0,
        success_count: 0,
        login_method: 'google',
      };
      const { data, error } = await dbHelpers.createUser(profileData);
      if (error) throw error;
      return profileData;
    } catch (e) {
      console.error('Error creating Google profile:', e);
      return null;
    }
  };

  const register = async ({ email, password, displayName, role }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user: newUser } = userCredential;

    await updateProfile(newUser, { displayName });
    // Kirim email verifikasi otomatis
    await sendEmailVerification(newUser);

    const profileData = {
      uid: newUser.uid,
      email,
      display_name: displayName,
      role,
      photo_url: null,
      created_at: new Date().toISOString(),
      report_count: 0,
      success_count: 0,
      login_method: 'email',
    };

    const { error } = await dbHelpers.createUser(profileData);
    if (error) throw error;
    
    setUserProfile(profileData);
    return userCredential;
  };

  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchUserProfile(credential.user.uid);
    setUserProfile(profile);
    return credential;
  };

  const loginWithGoogle = async () => {
    return await promptAsync();
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    userProfile,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    fetchUserProfile,
    googleRequest: request,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
