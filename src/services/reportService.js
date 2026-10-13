/**
 * reportService.js
 * CRUD lengkap untuk tabel 'reports' menggunakan apiService (token-based).
 *
 * Metode yang tersedia:
 *   GET    -> getReports, getReportById, getMyReports
 *   POST   -> createReport
 *   PUT    -> updateReport, updateReportStatus
 *   DELETE -> deleteReport
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

// ─── GET ─────────────────────────────────────────────────────────────────────

/**
 * Ambil semua laporan dengan filter opsional.
 * @param {{ type?, category?, location_id?, status?, limit? }} options
 */
export const getReports = async (options = {}) => {
  const params = {
    order: 'created_at.desc',
    limit: options.limit || 50,
  };
  if (options.type) params.type = `eq.${options.type}`;
  if (options.category) params.category = `eq.${options.category}`;
  if (options.location_id) params.location_id = `eq.${options.location_id}`;
  if (options.status) params.status = `eq.${options.status}`;

  return apiGet('reports', params);
};

/**
 * Ambil satu laporan berdasarkan ID.
 * @param {string} reportId
 */
export const getReportById = async (reportId) => {
  const { data, error, status } = await apiGet('reports', { id: `eq.${reportId}` });
  // Supabase array result -> ambil elemen pertama
  return { data: data?.[0] || null, error, status };
};

/**
 * Ambil laporan milik user yang sedang login.
 * @param {string} userId
 * @param {{ type?, status? }} options
 */
export const getMyReports = async (userId, options = {}) => {
  const params = {
    author_id: `eq.${userId}`,
    order: 'created_at.desc',
  };
  if (options.type) params.type = `eq.${options.type}`;
  if (options.status) params.status = `eq.${options.status}`;

  return apiGet('reports', params);
};

// ─── POST ─────────────────────────────────────────────────────────────────────

/**
 * Buat laporan baru (INSERT).
 * @param {object} reportData - Data laporan sesuai skema tabel
 */
export const createReport = async (reportData) => {
  const { data, error, status } = await apiPost('reports', reportData);
  return { data: Array.isArray(data) ? data[0] : data, error, status };
};

// ─── PUT ──────────────────────────────────────────────────────────────────────

/**
 * Update laporan (PATCH/PUT) berdasarkan ID.
 * @param {string} reportId
 * @param {object} updates - Field yang diubah, mis. { status: 'resolved' }
 */
export const updateReport = async (reportId, updates) => {
  const { data, error, status } = await apiPut(
    'reports',
    { id: `eq.${reportId}` },
    { ...updates, updated_at: new Date().toISOString() }
  );
  return { data: Array.isArray(data) ? data[0] : data, error, status };
};

/**
 * Shortcut: Ubah status laporan saja.
 * @param {string} reportId
 * @param {'active'|'claimed'|'resolved'|'closed'} newStatus
 */
export const updateReportStatus = (reportId, newStatus) =>
  updateReport(reportId, { status: newStatus });

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Hapus laporan berdasarkan ID (hanya oleh pemilik / RLS enforced).
 * @param {string} reportId
 */
export const deleteReport = async (reportId) =>
  apiDelete('reports', { id: `eq.${reportId}` });
