import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, USE_MOCK } from '../config/supabase';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK) {
      setUser({ id: 'mock123', email: 'test@umm.ac.id' });
      setUserProfile({ display_name: 'Mahasiswa UMM', role: 'mahasiswa' });
      setLoading(false);
      return;
    }

    // Cek session saat awal load
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfile(currentUser.id).then(profile => {
          setUserProfile(profile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Dengarkan perubahan state autentikasi
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        const profile = await fetchUserProfile(currentUser.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) {
        // PGRST116 = row not found, bukan error serius
        if (error.code !== 'PGRST116') console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (e) {
      console.error('Error fetching profile:', e);
      return null;
    }
  };

  const register = async ({ email, password, displayName, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) throw error;

    if (data?.user) {
      const profileData = {
        id: data.user.id,
        email,
        display_name: displayName,
        role,
        login_method: 'email',
      };

      const { error: dbError } = await supabase.from('users').insert([profileData]);
      if (dbError) throw dbError;

      setUserProfile(profileData);
    }

    return data;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const loginWithGoogle = async () => {
    // Google Login belum dikonfigurasi
    throw new Error('Google Login belum dikonfigurasi.');
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  /**
   * Kembalikan access token (JWT) dari session yang aktif.
   * Digunakan oleh apiService untuk header Authorization: Bearer <token>
   */
  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
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
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
