/**
 * __tests__/apiService.test.js
 * Unit test otomatis untuk apiService.js menggunakan Jest.
 *
 * Test ini TIDAK memanggil Supabase sungguhan (offline-safe).
 * Semua network call di-mock menggunakan jest.fn() / global.fetch mock.
 *
 * Jalankan: npm test
 */

// ─── Mock global fetch ────────────────────────────────────────────────────────
global.fetch = jest.fn();

// ─── Mock supabase (agar import supabase tidak crash di Node biasa) ────────────
jest.mock('../src/config/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-jwt-token' } },
        error: null,
      }),
    },
  },
  USE_MOCK: false,
}));

// ─── Import setelah mock ──────────────────────────────────────────────────────
const {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  ERROR_CODES,
} = require('../src/services/apiService');

// ─── Helper untuk membuat mock response fetch ─────────────────────────────────
function mockFetchResponse(status, body, ok = null) {
  const isOk = ok !== null ? ok : status >= 200 && status < 300;
  return Promise.resolve({
    status,
    ok: isOk,
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

// ─── Bersihkan mock sebelum setiap test ───────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// Suite 1: apiGet
// =============================================================================
describe('apiGet', () => {
  test('mengembalikan data ketika response 200', async () => {
    const mockData = [{ id: '1', title: 'Test Report', type: 'lost' }];
    global.fetch.mockReturnValueOnce(mockFetchResponse(200, mockData));

    const { data, error, status } = await apiGet('reports');

    expect(status).toBe(200);
    expect(error).toBeNull();
    expect(data).toEqual(mockData);
  });

  test('meneruskan query params dengan benar ke URL', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(200, []));

    await apiGet('reports', { type: 'eq.lost', limit: 10 });

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain('type=eq.lost');
    expect(calledUrl).toContain('limit=10');
  });

  test('mengembalikan error OFFLINE jika fetch gagal (network error)', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network request failed'));

    const { data, error, status } = await apiGet('reports', {}, 0); // retries=0
    // Note: apiGet tidak support retries param, tapi internal retry 2x
    // Kita test bahwa akhirnya error dikembalikan
    expect(error).not.toBeNull();
  });

  test('mengembalikan error AUTH untuk response 401', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(401, { message: 'Unauthorized' }, false));

    const { data, error, status } = await apiGet('reports');

    expect(status).toBe(401);
    expect(error.code).toBe(ERROR_CODES.AUTH);
    expect(data).toBeNull();
  });

  test('mengembalikan error AUTH untuk response 403', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(403, { message: 'Forbidden' }, false));

    const { data, error, status } = await apiGet('reports');

    expect(status).toBe(403);
    expect(error.code).toBe(ERROR_CODES.AUTH);
  });

  test('mengembalikan error NOT_FOUND untuk response 404', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(404, { message: 'Not found' }, false));

    const { data, error, status } = await apiGet('reports');

    expect(status).toBe(404);
    expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  test('mengembalikan error SERVER untuk response 500', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(500, { message: 'Internal server error' }, false));

    const { data, error, status } = await apiGet('reports');

    expect(status).toBe(500);
    expect(error.code).toBe(ERROR_CODES.SERVER);
  });

  test('menangani response 204 (No Content) tanpa crash', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(204, null));

    const { data, error, status } = await apiGet('reports');

    expect(status).toBe(204);
    expect(data).toBeNull();
    expect(error).toBeNull();
  });
});

// =============================================================================
// Suite 2: apiPost
// =============================================================================
describe('apiPost', () => {
  test('mengirim data dan mengembalikan item yang dibuat (201)', async () => {
    const payload = { title: 'Dompet Hilang', type: 'lost' };
    const createdItem = { id: 'abc-123', ...payload, status: 'active' };

    global.fetch.mockReturnValueOnce(mockFetchResponse(201, [createdItem]));

    const { data, error, status } = await apiPost('reports', payload);

    expect(status).toBe(201);
    expect(error).toBeNull();
    // apiPost memanggil request dengan method POST
    const calledOptions = global.fetch.mock.calls[0][1];
    expect(calledOptions.method).toBe('POST');
  });

  test('menyertakan Authorization header dalam request', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(201, [{ id: '1' }]));

    await apiPost('reports', { title: 'Test' });

    const calledOptions = global.fetch.mock.calls[0][1];
    expect(calledOptions.headers).toHaveProperty('Authorization');
    expect(calledOptions.headers.Authorization).toMatch(/^Bearer /);
  });

  test('menyertakan apikey header dalam request', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(201, [{ id: '1' }]));

    await apiPost('reports', { title: 'Test' });

    const calledOptions = global.fetch.mock.calls[0][1];
    expect(calledOptions.headers).toHaveProperty('apikey');
  });

  test('mengembalikan error untuk response 400', async () => {
    global.fetch.mockReturnValueOnce(
      mockFetchResponse(400, { message: 'null value in column violates not-null constraint' }, false)
    );

    const { data, error, status } = await apiPost('reports', {});

    expect(status).toBe(400);
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});

// =============================================================================
// Suite 3: apiPut (PATCH)
// =============================================================================
describe('apiPut', () => {
  test('mengirim PATCH request dengan filter dan body yang benar', async () => {
    const updates = { status: 'resolved' };
    global.fetch.mockReturnValueOnce(mockFetchResponse(200, [{ id: '1', ...updates }]));

    await apiPut('reports', { id: 'eq.report-1' }, updates);

    const calledUrl = global.fetch.mock.calls[0][0];
    const calledOptions = global.fetch.mock.calls[0][1];

    expect(calledUrl).toContain('id=eq.report-1');
    expect(calledOptions.method).toBe('PATCH');

    const sentBody = JSON.parse(calledOptions.body);
    expect(sentBody).toMatchObject(updates);
  });

  test('mengembalikan data yang di-update', async () => {
    const updated = { id: '1', status: 'resolved', title: 'Dompet' };
    global.fetch.mockReturnValueOnce(mockFetchResponse(200, [updated]));

    const { data, error } = await apiPut('reports', { id: 'eq.1' }, { status: 'resolved' });

    expect(error).toBeNull();
    expect(data).toEqual([updated]);
  });
});

// =============================================================================
// Suite 4: apiDelete
// =============================================================================
describe('apiDelete', () => {
  test('mengirim DELETE request dengan filter yang benar', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(200, []));

    await apiDelete('reports', { id: 'eq.report-abc' });

    const calledUrl = global.fetch.mock.calls[0][0];
    const calledOptions = global.fetch.mock.calls[0][1];

    expect(calledUrl).toContain('id=eq.report-abc');
    expect(calledOptions.method).toBe('DELETE');
  });

  test('menangani 204 No Content dari DELETE', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(204, null));

    const { data, error, status } = await apiDelete('reports', { id: 'eq.123' });

    expect(status).toBe(204);
    expect(error).toBeNull();
  });
});

// =============================================================================
// Suite 5: Error Normalization & Network Validation
// =============================================================================
describe('Error Normalization & Validasi Jaringan', () => {
  test('Pesan error 401 ramah pengguna (bahasa Indonesia)', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(401, { message: 'Unauthorized' }, false));

    const { error } = await apiGet('reports');

    expect(error.message).toMatch(/sesi|login/i);
  });

  test('Pesan error 404 ramah pengguna', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(404, { message: 'Not found' }, false));

    const { error } = await apiGet('reports');

    expect(error.message).toMatch(/tidak ditemukan/i);
  });

  test('Pesan error 500 ramah pengguna', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(500, { message: 'Internal Error' }, false));

    const { error } = await apiGet('reports');

    expect(error.message).toMatch(/server|bermasalah/i);
  });

  test('AbortError (timeout) dideteksi sebagai network error', async () => {
    const abortError = new Error('The user aborted a request');
    abortError.name = 'AbortError';
    global.fetch
      .mockRejectedValueOnce(abortError) // attempt 1 — retry
      .mockRejectedValueOnce(abortError) // attempt 2 — retry
      .mockRejectedValueOnce(abortError); // attempt 3 — final fail

    const { error } = await apiGet('reports');

    expect(error.code).toBe(ERROR_CODES.OFFLINE);
    expect(error.message).toMatch(/koneksi|jaringan/i);
  });

  test('"network request failed" dideteksi sebagai network error', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockRejectedValueOnce(new Error('Network request failed'));

    const { error } = await apiGet('reports');

    expect(error.code).toBe(ERROR_CODES.OFFLINE);
  });

  test('"failed to fetch" dideteksi sebagai network error', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockRejectedValueOnce(new Error('Failed to fetch'));

    const { error } = await apiGet('reports');

    expect(error.code).toBe(ERROR_CODES.OFFLINE);
  });

  test('URL menggunakan HTTPS (bukan HTTP)', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(200, []));

    await apiGet('reports');

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toMatch(/^https:\/\//);
  });

  test('Header Content-Type adalah application/json', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse(200, []));

    await apiGet('reports');

    const calledOptions = global.fetch.mock.calls[0][1];
    expect(calledOptions.headers['Content-Type']).toBe('application/json');
  });
});
