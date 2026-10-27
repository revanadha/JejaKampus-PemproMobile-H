/**
 * apiService.js
 * Core HTTP helper yang menyisipkan Bearer token (Supabase JWT) secara otomatis
 * ke setiap request. Mendukung metode: GET, POST, PUT, DELETE.
 *
 * Fitur tambahan:
 * - Deteksi offline / network error otomatis
 * - Retry logic untuk network error (max 2x)
 * - Error normalization dengan kode error yang konsisten
 */

import { supabase } from '../config/supabase';

const SUPABASE_URL = 'https://zklprhlbxjlvrtvucyyx.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprbHByaGxieGpsdnJ0dnVjeXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjYyNjgsImV4cCI6MjEwNjg0MjI2OH0.8bd5GpfCk3aVYq6Bq3HIs8xWwEswVJPlU4pD0yd4HHI';

// ─── Error Codes ──────────────────────────────────────────────────────────────
export const ERROR_CODES = {
  OFFLINE: 'NETWORK_OFFLINE',
  TIMEOUT: 'NETWORK_TIMEOUT',
  SERVER: 'SERVER_ERROR',
  AUTH: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN: 'UNKNOWN_ERROR',
};

const REQUEST_TIMEOUT_MS = 15000; // 15 detik

// ─── Ambil Access Token dari session aktif ───────────────────────────────────
const getAccessToken = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      console.warn('[apiService] Tidak ada session aktif, menggunakan anon key.');
      return null;
    }
    return session.access_token;
  } catch (e) {
    console.warn('[apiService] Gagal ambil session:', e.message);
    return null;
  }
};

// ─── Buat headers dengan Bearer token ────────────────────────────────────────
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

// ─── Bangun URL lengkap untuk REST endpoint ───────────────────────────────────
const buildUrl = (table, params = {}) => {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
};

// ─── Deteksi apakah error adalah network/offline error ───────────────────────
const isNetworkError = (e) => {
  if (!e) return false;
  const msg = (e.message || '').toLowerCase();
  return (
    e.name === 'AbortError' ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('unable to resolve host') ||
    msg.includes('etimedout') ||
    msg.includes('econnrefused') ||
    msg.includes('connection refused')
  );
};

// ─── Normalizer pesan error ───────────────────────────────────────────────────
const normalizeError = (e, status = 0) => {
  if (isNetworkError(e) || status === 0) {
    return {
      message: 'Tidak ada koneksi internet. Periksa jaringan Anda dan coba lagi.',
      code: ERROR_CODES.OFFLINE,
      detail: null,
    };
  }
  if (status === 401 || status === 403) {
    return {
      message: 'Sesi Anda telah berakhir. Silakan login kembali.',
      code: ERROR_CODES.AUTH,
      detail: null,
    };
  }
  if (status === 404) {
    return {
      message: 'Data tidak ditemukan.',
      code: ERROR_CODES.NOT_FOUND,
      detail: null,
    };
  }
  if (status >= 500) {
    return {
      message: 'Server sedang bermasalah. Coba beberapa saat lagi.',
      code: ERROR_CODES.SERVER,
      detail: null,
    };
  }
  return {
    message: e?.message || 'Terjadi kesalahan. Silakan coba lagi.',
    code: ERROR_CODES.UNKNOWN,
    detail: null,
  };
};

// ─── Fetch dengan timeout ─────────────────────────────────────────────────────
const fetchWithTimeout = (url, options, timeout = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
};

// ─── Wrapper generik untuk semua request (dengan retry) ───────────────────────
const request = async (method, url, body = null, extraHeaders = {}, retries = 2) => {
  try {
    const headers = await buildHeaders(extraHeaders);
    const options = { method, headers };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetchWithTimeout(url, options);
    const status = response.status;

    if (status === 204) return { data: null, error: null, status };

    const text = await response.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch { parsed = text; }

    if (!response.ok) {
      const msg = parsed?.message || parsed?.hint || parsed?.details || `HTTP ${status}`;
      console.error(`[apiService] ${method} ${url} => ${status}:`, msg);
      return {
        data: null,
        error: normalizeError({ message: msg }, status),
        status,
      };
    }

    return { data: parsed, error: null, status };

  } catch (e) {
    // Retry untuk network error (bukan error HTTP biasa)
    if (isNetworkError(e) && retries > 0) {
      console.warn(`[apiService] Network error, retrying... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // tunggu 1 detik
      return request(method, url, body, extraHeaders, retries - 1);
    }

    const err = normalizeError(e, 0);
    console.error(`[apiService] ${method} ${url} => ${err.code}:`, e.message);
    return { data: null, error: err, status: 0 };
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

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
