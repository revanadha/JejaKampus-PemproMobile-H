/**
 * userService.js
 * CRUD untuk tabel 'users' (profil pengguna) menggunakan apiService (token-based).
 *
 * Metode:
 *   GET    -> getUserProfile
 *   POST   -> createUserProfile
 *   PUT    -> updateUserProfile
 *   DELETE -> deleteUserProfile
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

// ─── GET ─────────────────────────────────────────────────────────────────────

/**
 * Ambil profil user berdasarkan UID.
 * @param {string} uid
 */
export const getUserProfile = async (uid) => {
  const { data, error, status } = await apiGet('users', { id: `eq.${uid}` });
  return { data: data?.[0] || null, error, status };
};

// ─── POST ─────────────────────────────────────────────────────────────────────

/**
 * Buat profil user baru (dipanggil saat register).
 * @param {object} profileData
 */
export const createUserProfile = async (profileData) => {
  const { data, error, status } = await apiPost('users', profileData);
  return { data: Array.isArray(data) ? data[0] : data, error, status };
};

// ─── PUT ──────────────────────────────────────────────────────────────────────

/**
 * Update profil user (PATCH/PUT).
 * @param {string} uid
 * @param {object} updates - Mis. { display_name, nim, prodi, bio }
 */
export const updateUserProfile = async (uid, updates) => {
  const { data, error, status } = await apiPut(
    'users',
    { id: `eq.${uid}` },
    { ...updates, updated_at: new Date().toISOString() }
  );
  return { data: Array.isArray(data) ? data[0] : data, error, status };
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Hapus profil user (soft delete atau hard delete sesuai kebijakan RLS).
 * @param {string} uid
 */
export const deleteUserProfile = async (uid) =>
  apiDelete('users', { id: `eq.${uid}` });
