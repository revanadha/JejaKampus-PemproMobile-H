import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, USE_MOCK } from '../config/supabase';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

// ─── Normalisasi error Supabase + network ─────────────────────────────────────
const isNetworkError = (e) => {
  const msg = (e?.message || '').toLowerCase();
  return (
    e?.name === 'AbortError' ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('unable to resolve host') ||
    msg.includes('etimedout')
  );
};

export const parseAuthError = (err) => {
  if (isNetworkError(err)) {
    return new Error('Tidak ada koneksi internet. Periksa jaringan Anda dan coba lagi.');
  }
  const msg = (err?.message || err?.error_description || String(err)).toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return new Error('Email atau password salah.');
  }
  if (msg.includes('email not confirmed')) {
    return new Error('Email belum dikonfirmasi. Matikan "Confirm email" di Supabase Dashboard.');
  }
  if (msg.includes('user not found')) {
    return new Error('Akun tidak ditemukan. Silakan mendaftar terlebih dahulu.');
  }
  if (msg.includes('too many requests') || msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
    return new Error('Terlalu banyak percobaan. Harap tunggu beberapa saat.');
  }
  if (msg.includes('already registered') || msg.includes('user already exists')) {
    return new Error('Email sudah terdaftar. Silakan langsung login.');
  }
  if (msg.includes('at least 6 characters') || msg.includes('weak_password')) {
    return new Error('Password minimal 6 karakter.');
  }
  if (msg.includes('valid email') || msg.includes('invalid format')) {
    return new Error('Format email tidak valid.');
  }
  return new Error(err?.message || 'Terjadi kesalahan. Silakan coba lagi.');
};

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
      if (isNetworkError(e)) {
        console.warn('[AuthContext] Offline saat fetch profil, skip.');
      } else {
        console.error('Error fetching profile:', e);
      }
      return null;
    }
  };

  const register = async ({ email, password, displayName, role }) => {
    const cleanEmail = email.trim().toLowerCase();
    const name = displayName?.trim() || cleanEmail.split('@')[0];

    let data, error;
    try {
      ({ data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { display_name: name } },
      }));
    } catch (e) {
      throw parseAuthError(e);
    }

    if (error) throw parseAuthError(error);

    if (data?.user) {
      const profileData = {
        id: data.user.id,
        email: cleanEmail,
        display_name: name,
        role: role || 'mahasiswa',
        login_method: 'email',
      };

      try {
        await supabase.from('users').upsert([profileData]);
      } catch (dbErr) {
        console.warn('[AuthContext] Note on profile upsert:', dbErr?.message);
      }

      if (data.session) {
        setUser(data.user);
        setUserProfile(profileData);
      }
    }

    return data;
  };

  const login = async (email, password) => {
    let data, error;
    try {
      ({ data, error } = await supabase.auth.signInWithPassword({ email, password }));
    } catch (e) {
      throw parseAuthError(e);
    }
    if (error) throw parseAuthError(error);
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
