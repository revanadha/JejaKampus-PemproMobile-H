/**
 * apiService.js
 * Core HTTP helper yang menyisipkan Bearer token (Supabase JWT) secara otomatis
 * ke setiap request. Mendukung metode: GET, POST, PUT, DELETE.
 */

import { supabase } from '../config/supabase';

const SUPABASE_URL = 'https://zklprhlbxjlvrtvucyyx.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprbHByaGxieGpsdnJ0dnVjeXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjYyNjgsImV4cCI6MjEwNjg0MjI2OH0.8bd5GpfCk3aVYq6Bq3HIs8xWwEswVJPlU4pD0yd4HHI';

// Ambil Access Token dari session aktif
const getAccessToken = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    console.warn('[apiService] Tidak ada session aktif, menggunakan anon key.');
    return null;
  }
  return session.access_token;
};

// Buat headers dengan Bearer token
const buildHeaders = async (extra = {}) => {
  const token = await getAccessToken();
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: token ? `Bearer ${token}` : `Bearer ${SUPABASE_ANON_KEY}`,
    Prefer: 'return=representation',
    ...extra,
  };
};

// Bangun URL lengkap untuk REST endpoint
const buildUrl = (table, params = {}) => {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
};

// Wrapper generik untuk semua request
const request = async (method, url, body = null, extraHeaders = {}) => {
  try {
    const headers = await buildHeaders(extraHeaders);
    const options = { method, headers };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const status = response.status;

    if (status === 204) return { data: null, error: null, status };

    const text = await response.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch { parsed = text; }

    if (!response.ok) {
      const msg = parsed?.message || parsed?.hint || parsed?.details || `HTTP ${status}`;
      console.error(`[apiService] ${method} ${url} => ${status}:`, msg);
      return { data: null, error: { message: msg, code: status, detail: parsed }, status };
    }

    return { data: parsed, error: null, status };
  } catch (e) {
    console.error(`[apiService] Network error on ${method} ${url}:`, e);
    return { data: null, error: { message: e.message }, status: 0 };
  }
};

/**
 * GET - Ambil data dari tabel
 * Contoh: const { data } = await apiGet('reports', { type: 'eq.lost', limit: 20 });
 */
export const apiGet = (table, params = {}) => {
  const url = buildUrl(table, { select: '*', ...params });
  return request('GET', url);
};

/**
 * POST - Tambah data baru
 * Contoh: const { data } = await apiPost('reports', { title: '...', type: 'lost' });
 */
export const apiPost = (table, body) => {
  const url = buildUrl(table);
  return request('POST', url, body);
};

/**
 * PUT - Update data (PATCH semantics via Supabase REST)
 * Contoh: const { data } = await apiPut('reports', { id: 'eq.abc' }, { status: 'resolved' });
 */
export const apiPut = (table, filters = {}, body) => {
  const url = buildUrl(table, filters);
  return request('PATCH', url, body);
};

/**
 * DELETE - Hapus data
 * Contoh: const { error } = await apiDelete('reports', { id: 'eq.abc123' });
 */
export const apiDelete = (table, filters = {}) => {
  const url = buildUrl(table, filters);
  return request('DELETE', url);
};

// Helper: Ambil token untuk keperluan debug / display
export const getCurrentToken = getAccessToken;
