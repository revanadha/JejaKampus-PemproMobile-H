/**
 * __tests__/networkValidation.test.js
 * Unit test untuk memvalidasi logika deteksi network error
 * di AuthContext (parseAuthError, isNetworkError).
 *
 * Test ini bersifat offline-safe (tidak butuh koneksi internet).
 * Jalankan: npm test
 */

// ─── Mock supabase & react sebelum import AuthContext ─────────────────────────
jest.mock('react', () => ({
  createContext: jest.fn(() => ({})),
  useContext: jest.fn(),
  useEffect: jest.fn(),
  useState: jest.fn((init) => [init, jest.fn()]),
}));

jest.mock('../src/config/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
  USE_MOCK: false,
}));

const { parseAuthError } = require('../src/context/AuthContext');

// =============================================================================
// Suite 1: isNetworkError (via parseAuthError)
// =============================================================================
describe('parseAuthError — deteksi network error', () => {
  const NETWORK_MESSAGE = /koneksi|jaringan/i;

  test('mendeteksi "Network request failed"', () => {
    const err = new Error('Network request failed');
    expect(parseAuthError(err).message).toMatch(NETWORK_MESSAGE);
  });

  test('mendeteksi "Failed to fetch"', () => {
    const err = new Error('Failed to fetch');
    expect(parseAuthError(err).message).toMatch(NETWORK_MESSAGE);
  });

  test('mendeteksi "NetworkError"', () => {
    const err = new Error('NetworkError when attempting to fetch resource');
    expect(parseAuthError(err).message).toMatch(NETWORK_MESSAGE);
  });

  test('mendeteksi "Unable to resolve host"', () => {
    const err = new Error('Unable to resolve host zklprhlbxjlvrtvucyyx.supabase.co');
    expect(parseAuthError(err).message).toMatch(NETWORK_MESSAGE);
  });

  test('mendeteksi "ETIMEDOUT"', () => {
    const err = new Error('ETIMEDOUT');
    expect(parseAuthError(err).message).toMatch(NETWORK_MESSAGE);
  });

  test('mendeteksi AbortError (name property)', () => {
    const err = new Error('The operation was aborted');
    err.name = 'AbortError';
    expect(parseAuthError(err).message).toMatch(NETWORK_MESSAGE);
  });
});

// =============================================================================
// Suite 2: parseAuthError — pesan error spesifik Supabase
// =============================================================================
describe('parseAuthError — normalisasi pesan error Supabase', () => {
  test('invalid login credentials → pesan email/password salah', () => {
    const err = { message: 'Invalid login credentials' };
    const result = parseAuthError(err);
    expect(result.message).toMatch(/email|password/i);
  });

  test('invalid credentials → pesan email/password salah', () => {
    const err = { message: 'invalid credentials' };
    expect(parseAuthError(err).message).toMatch(/email|password/i);
  });

  test('email not confirmed → pesan email belum dikonfirmasi', () => {
    const err = { message: 'Email not confirmed' };
    expect(parseAuthError(err).message).toMatch(/konfirmasi|confirm/i);
  });

  test('user not found → pesan akun tidak ditemukan', () => {
    const err = { message: 'User not found' };
    expect(parseAuthError(err).message).toMatch(/tidak ditemukan|mendaftar/i);
  });

  test('too many requests → pesan tunggu beberapa saat', () => {
    const err = { message: 'Too many requests' };
    expect(parseAuthError(err).message).toMatch(/banyak percobaan|tunggu/i);
  });

  test('rate limit → pesan tunggu beberapa saat', () => {
    const err = { message: 'Rate limit exceeded' };
    expect(parseAuthError(err).message).toMatch(/banyak percobaan|tunggu/i);
  });

  test('over_email_send_rate_limit → pesan tunggu beberapa saat', () => {
    const err = { message: 'over_email_send_rate_limit' };
    expect(parseAuthError(err).message).toMatch(/banyak percobaan|tunggu/i);
  });

  test('already registered → pesan email sudah terdaftar', () => {
    const err = { message: 'User already registered' };
    expect(parseAuthError(err).message).toMatch(/sudah terdaftar/i);
  });

  test('user already exists → pesan email sudah terdaftar', () => {
    const err = { message: 'user already exists' };
    expect(parseAuthError(err).message).toMatch(/sudah terdaftar/i);
  });

  test('at least 6 characters → pesan password terlalu pendek', () => {
    const err = { message: 'Password should be at least 6 characters' };
    expect(parseAuthError(err).message).toMatch(/minimal 6|6 karakter/i);
  });

  test('weak_password → pesan password terlalu pendek', () => {
    const err = { message: 'weak_password' };
    expect(parseAuthError(err).message).toMatch(/minimal 6|6 karakter/i);
  });

  test('valid email format → pesan format tidak valid', () => {
    const err = { message: 'Please enter a valid email' };
    expect(parseAuthError(err).message).toMatch(/format email/i);
  });

  test('error tidak dikenal → pesan fallback generik', () => {
    const err = { message: 'some unexpected error xyz' };
    const result = parseAuthError(err);
    expect(result).toBeInstanceOf(Error);
    expect(result.message.length).toBeGreaterThan(0);
  });

  test('error dengan error_description (format Supabase lama)', () => {
    const err = { error_description: 'invalid login credentials' };
    const result = parseAuthError(err);
    expect(result.message).toMatch(/email|password/i);
  });

  test('null/undefined error → tidak crash, kembalikan error generik', () => {
    expect(() => parseAuthError(null)).not.toThrow();
    expect(() => parseAuthError(undefined)).not.toThrow();
  });

  test('selalu mengembalikan instance Error', () => {
    expect(parseAuthError(new Error('test'))).toBeInstanceOf(Error);
    expect(parseAuthError({ message: 'test' })).toBeInstanceOf(Error);
    expect(parseAuthError(null)).toBeInstanceOf(Error);
  });
});
