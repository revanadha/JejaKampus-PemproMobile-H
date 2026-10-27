/**
 * test-api.js
 * Script pengujian endpoint Supabase via terminal dengan assertions lengkap.
 *
 * Mencakup:
 *  - Positive testing  : GET, POST, PATCH, DELETE (flow lengkap)
 *  - Negative testing  : token salah, endpoint tidak ada, body invalid
 *  - Schema validation : memastikan field wajib ada di response
 *  - Network validation: timeout & connection handling
 *
 * Jalankan: node test-api.js
 */

require('dotenv').config();
const https = require('https');

// ─── Konfigurasi dari environment variable ────────────────────────────────────
const SUPABASE_HOST = new URL(
  process.env.TEST_SUPABASE_URL || 'https://zklprhlbxjlvrtvucyyx.supabase.co'
).hostname;

const SUPABASE_KEY =
  process.env.TEST_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprbHByaGxieGpsdnJ0dnVjeXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjYyNjgsImV4cCI6MjEwNjg0MjI2OH0.8bd5GpfCk3aVYq6Bq3HIs8xWwEswVJPlU4pD0yd4HHI';

// ─── State hasil test ─────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let createdReportId = null; // digunakan lintas test (POST → PATCH → DELETE)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Kirim HTTP request ke Supabase REST API */
function request(method, path, body = null, customKey = null, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_HOST,
      path: path,
      method: method,
      headers: {
        apikey: customKey || SUPABASE_KEY,
        Authorization: `Bearer ${customKey || SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    };

    const timer = setTimeout(() => {
      req.destroy(new Error('ETIMEDOUT'));
    }, timeoutMs);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        clearTimeout(timer);
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });

    if (body && method !== 'GET') req.write(JSON.stringify(body));
    req.end();
  });
}

/** Assertion sederhana — melempar error jika kondisi false */
function assert(condition, message) {
  if (!condition) throw new Error(`ASSERTION GAGAL: ${message}`);
}

/** Validasi bahwa object memiliki semua field yang diharapkan */
function assertSchema(obj, requiredFields, label = 'object') {
  for (const field of requiredFields) {
    assert(
      obj !== null && obj !== undefined && field in obj,
      `${label} harus memiliki field '${field}', tapi tidak ada. Data: ${JSON.stringify(obj)}`
    );
  }
}

/** Jalankan satu test case dan tangkap hasilnya */
async function runTest(name, fn) {
  process.stdout.write(`  ▸ ${name}... `);
  try {
    await fn();
    console.log('✅ LULUS');
    passed++;
  } catch (e) {
    console.log(`❌ GAGAL\n    → ${e.message}`);
    failed++;
  }
}

/** Cetak header section */
function section(title) {
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`📂 ${title}`);
  console.log('─'.repeat(55));
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

async function testPositiveGetReports() {
  section('1. GET Reports — Positive Tests');

  await runTest('Status 200 untuk GET /rest/v1/reports', async () => {
    const res = await request('GET', '/rest/v1/reports?select=id,title,type,created_at&limit=5');
    assert(res.status === 200, `Diharapkan 200, dapat ${res.status}`);
  });

  await runTest('Response berupa array', async () => {
    const res = await request('GET', '/rest/v1/reports?select=*&limit=3');
    assert(Array.isArray(res.body), `Diharapkan array, dapat ${typeof res.body}`);
  });

  await runTest('Setiap item memiliki field wajib (schema validation)', async () => {
    const res = await request('GET', '/rest/v1/reports?select=*&limit=3');
    assert(Array.isArray(res.body) && res.body.length > 0, 'Data reports kosong, tidak bisa validasi schema');
    const REQUIRED_FIELDS = ['id', 'title', 'type', 'status', 'created_at'];
    for (const item of res.body) {
      assertSchema(item, REQUIRED_FIELDS, 'report');
    }
  });

  await runTest('Filter type=lost berfungsi (query param)', async () => {
    const res = await request('GET', '/rest/v1/reports?select=id,type&type=eq.lost&limit=5');
    assert(res.status === 200, `Diharapkan 200, dapat ${res.status}`);
    if (res.body.length > 0) {
      assert(
        res.body.every((r) => r.type === 'lost'),
        'Semua item harus memiliki type "lost"'
      );
    }
  });

  await runTest('Filter type=found berfungsi (query param)', async () => {
    const res = await request('GET', '/rest/v1/reports?select=id,type&type=eq.found&limit=5');
    assert(res.status === 200, `Diharapkan 200, dapat ${res.status}`);
  });
}

async function testPositiveGetUsers() {
  section('2. GET Users — Positive Tests');

  await runTest('Status 200 untuk GET /rest/v1/users', async () => {
    const res = await request('GET', '/rest/v1/users?select=id,display_name,email&limit=3');
    assert(res.status === 200, `Diharapkan 200, dapat ${res.status}`);
  });

  await runTest('Response berupa array', async () => {
    const res = await request('GET', '/rest/v1/users?select=*&limit=3');
    assert(Array.isArray(res.body), `Diharapkan array, dapat ${typeof res.body}`);
  });

  await runTest('Setiap user memiliki field wajib (schema validation)', async () => {
    const res = await request('GET', '/rest/v1/users?select=*&limit=3');
    if (res.body.length > 0) {
      const REQUIRED_FIELDS = ['id', 'email', 'display_name'];
      for (const user of res.body) {
        assertSchema(user, REQUIRED_FIELDS, 'user');
      }
    }
  });
}

async function testStorage() {
  section('3. Storage — Positive Tests');

  await runTest('Bucket "reports" dapat diakses', async () => {
    const res = await request('GET', '/storage/v1/bucket/reports');
    assert(res.status === 200, `Diharapkan 200, dapat ${res.status}. Body: ${JSON.stringify(res.body)}`);
  });

  await runTest('Bucket "reports" memiliki schema yang benar', async () => {
    const res = await request('GET', '/storage/v1/bucket/reports');
    assert(res.status === 200, `Diharapkan 200, dapat ${res.status}`);
    assertSchema(res.body, ['id', 'name'], 'bucket');
  });
}

async function testCRUDReports() {
  section('4. CRUD Reports — POST, PATCH, DELETE (Flow End-to-End)');

  // POST — Buat laporan baru
  await runTest('POST: Membuat laporan baru (status 201)', async () => {
    const payload = {
      title: '[TEST] Kunci Motor Tertinggal',
      type: 'found',
      description: 'Ditemukan di depan GKB 3 (data test otomatis)',
      category: 'kunci',
      location_id: 'gkb3',
      location_name: 'GKB III',
      status: 'active',
      images: [],
    };
    const res = await request('POST', '/rest/v1/reports', payload);
    assert(
      res.status === 201 || res.status === 200,
      `Diharapkan 201 atau 200, dapat ${res.status}. Body: ${JSON.stringify(res.body)}`
    );
    const created = Array.isArray(res.body) ? res.body[0] : res.body;
    assert(created && created.id, `Response POST harus mengembalikan objek dengan 'id'. Dapat: ${JSON.stringify(created)}`);
    createdReportId = created.id;
    console.log(`\n    → ID Laporan Baru: ${createdReportId}`);
  });

  await runTest('POST: Response memiliki schema yang benar', async () => {
    if (!createdReportId) throw new Error('Lewati: POST sebelumnya gagal');
    const res = await request('GET', `/rest/v1/reports?id=eq.${createdReportId}&select=*`);
    assert(res.status === 200, `Diharapkan 200, dapat ${res.status}`);
    const item = res.body[0];
    assertSchema(item, ['id', 'title', 'type', 'status', 'created_at'], 'laporan baru');
  });

  // PATCH — Update laporan yang baru dibuat
  await runTest('PATCH: Update status laporan (status 200)', async () => {
    if (!createdReportId) throw new Error('Lewati: POST sebelumnya gagal');
    const res = await request(
      'PATCH',
      `/rest/v1/reports?id=eq.${createdReportId}`,
      { status: 'resolved', updated_at: new Date().toISOString() }
    );
    assert(
      res.status === 200 || res.status === 204,
      `Diharapkan 200/204, dapat ${res.status}. Body: ${JSON.stringify(res.body)}`
    );
  });

  await runTest('PATCH: Verifikasi perubahan tersimpan di database', async () => {
    if (!createdReportId) throw new Error('Lewati: POST sebelumnya gagal');
    const res = await request('GET', `/rest/v1/reports?id=eq.${createdReportId}&select=status`);
    assert(res.status === 200, `Diharapkan 200, dapat ${res.status}`);
    assert(res.body[0]?.status === 'resolved', `Status harus 'resolved', dapat '${res.body[0]?.status}'`);
  });

  // DELETE — Hapus laporan test
  await runTest('DELETE: Menghapus laporan test (status 200/204)', async () => {
    if (!createdReportId) throw new Error('Lewati: POST sebelumnya gagal');
    const res = await request('DELETE', `/rest/v1/reports?id=eq.${createdReportId}`);
    assert(
      res.status === 200 || res.status === 204,
      `Diharapkan 200/204, dapat ${res.status}. Body: ${JSON.stringify(res.body)}`
    );
  });

  await runTest('DELETE: Verifikasi laporan sudah tidak ada', async () => {
    if (!createdReportId) throw new Error('Lewati: DELETE sebelumnya gagal');
    const res = await request('GET', `/rest/v1/reports?id=eq.${createdReportId}&select=id`);
    assert(res.status === 200, `Diharapkan 200, dapat ${res.status}`);
    assert(res.body.length === 0, `Data harus kosong setelah delete, tapi masih ada ${res.body.length} item`);
  });
}

async function testNegative() {
  section('5. Negative Tests — Error & Auth Handling');

  await runTest('Token salah → harus 401 atau 403', async () => {
    const INVALID_KEY = 'ini.bukan.token.valid';
    const res = await request('GET', '/rest/v1/reports?select=id', null, INVALID_KEY);
    assert(
      res.status === 401 || res.status === 403,
      `Diharapkan 401/403 untuk token invalid, dapat ${res.status}`
    );
  });

  await runTest('Endpoint tidak ada → harus 404', async () => {
    const res = await request('GET', '/rest/v1/tabel_yang_tidak_ada');
    assert(
      res.status === 404,
      `Diharapkan 404 untuk endpoint tidak ada, dapat ${res.status}`
    );
  });

  await runTest('POST dengan body kosong → harus 400 atau 422', async () => {
    const res = await request('POST', '/rest/v1/reports', {});
    assert(
      res.status === 400 || res.status === 422 || res.status === 409,
      `Diharapkan 400/422/409 untuk body kosong, dapat ${res.status}`
    );
  });

  await runTest('GET dengan ID yang tidak valid → array kosong (bukan error)', async () => {
    const res = await request('GET', '/rest/v1/reports?id=eq.id-yang-tidak-ada-sama-sekali&select=id');
    assert(res.status === 200, `Diharapkan 200, dapat ${res.status}`);
    assert(Array.isArray(res.body), 'Response harus array');
    assert(res.body.length === 0, `Harus array kosong, dapat ${res.body.length} item`);
  });

  await runTest('Storage bucket tidak ada → harus 400 atau 404', async () => {
    const res = await request('GET', '/storage/v1/bucket/bucket-tidak-ada');
    assert(
      res.status === 400 || res.status === 404,
      `Diharapkan 400/404 untuk bucket tidak ada, dapat ${res.status}`
    );
  });
}

async function testNetworkValidation() {
  section('6. Network & Konektivitas — Validasi Antarmuka Jaringan');

  await runTest('Koneksi ke Supabase host berhasil (DNS resolve OK)', async () => {
    const res = await request('GET', '/rest/v1/reports?limit=1&select=id');
    assert(res.status > 0, 'Tidak bisa terhubung ke server Supabase (network error)');
  });

  await runTest('Header wajib dikirim (apikey & Authorization)', async () => {
    // Tanpa header, Supabase harus menolak (tidak boleh 200)
    const res = await new Promise((resolve, reject) => {
      const options = {
        hostname: SUPABASE_HOST,
        path: '/rest/v1/reports?select=id&limit=1',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }, // tanpa apikey
      };
      const req = https.request(options, (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => resolve({ status: r.statusCode }));
      });
      req.on('error', reject);
      req.end();
    });
    assert(
      res.status === 401 || res.status === 400 || res.status === 403,
      `Request tanpa apikey harus ditolak (401/400/403), dapat ${res.status}`
    );
  });

  await runTest('Response time < 10 detik (performance check)', async () => {
    const start = Date.now();
    const res = await request('GET', '/rest/v1/reports?limit=1&select=id');
    const elapsed = Date.now() - start;
    assert(res.status === 200, `Diharapkan 200, dapat ${res.status}`);
    assert(elapsed < 10000, `Response time ${elapsed}ms melebihi 10 detik`);
    console.log(`\n    → Response time: ${elapsed}ms`);
  });

  await runTest('HTTPS digunakan (bukan HTTP)', () => {
    const url = process.env.TEST_SUPABASE_URL || 'https://zklprhlbxjlvrtvucyyx.supabase.co';
    assert(url.startsWith('https://'), `URL harus menggunakan HTTPS: ${url}`);
  });
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

async function runAll() {
  console.log('\n' + '═'.repeat(55));
  console.log('🚀  JEJAKAMPUS — API TEST SUITE');
  console.log('    Supabase Endpoint Validation');
  console.log('═'.repeat(55));

  await testPositiveGetReports();
  await testPositiveGetUsers();
  await testStorage();
  await testCRUDReports();
  await testNegative();
  await testNetworkValidation();

  // ─── Ringkasan ────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n' + '═'.repeat(55));
  console.log('📊  HASIL AKHIR');
  console.log('═'.repeat(55));
  console.log(`  Total  : ${total} test`);
  console.log(`  ✅ Lulus: ${passed} test`);
  console.log(`  ❌ Gagal: ${failed} test`);
  console.log('═'.repeat(55) + '\n');

  if (failed > 0) {
    process.exit(1); // exit code 1 → CI/CD mendeteksi kegagalan
  }
}

runAll().catch((e) => {
  console.error('\n💥 Error fatal saat menjalankan test:', e.message);
  process.exit(1);
});
