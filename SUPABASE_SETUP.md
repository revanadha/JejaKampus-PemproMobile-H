# Supabase Setup Guide

Ganti Firebase dengan Supabase. Follow langkah ini:

## 1. Buat Supabase Project

1. Buka https://supabase.com
2. Sign up / login
3. Buat project baru (nama: "jejakampus")
4. Tunggu sampai project ready

## 2. Ambil Config

Di Project Settings > API:
- Copy `Project URL` → ganti `YOUR_SUPABASE_URL` di `src/config/supabase.js`
- Copy `anon public key` → ganti `YOUR_SUPABASE_ANON_KEY` di `src/config/supabase.js`

## 3. Buat Tabel & Schema

Buka SQL Editor di Supabase dashboard, jalankan query ini:

```sql
-- Users table
CREATE TABLE users (
  uid TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'mahasiswa',
  nim TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  location_id TEXT,
  location_name TEXT,
  color TEXT,
  brand TEXT,
  images TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT FALSE,
  author_id TEXT NOT NULL REFERENCES users(uid),
  author_name TEXT,
  author_role TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'resolved')),
  claim_requests JSONB DEFAULT '[]',
  hidden_details TEXT,
  verification_question TEXT,
  verification_answer TEXT,
  has_drop_off BOOLEAN DEFAULT FALSE,
  drop_off_location_id TEXT,
  drop_off_location_name TEXT,
  drop_off_status TEXT CHECK (drop_off_status IN ('pending', 'received', 'confirmed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chats table
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id TEXT NOT NULL REFERENCES users(uid),
  user1_name TEXT,
  user2_id TEXT NOT NULL REFERENCES users(uid),
  user2_name TEXT,
  report_id UUID REFERENCES reports(id),
  report_title TEXT,
  last_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id),
  sender_id TEXT NOT NULL REFERENCES users(uid),
  sender_name TEXT,
  text TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  type TEXT DEFAULT 'text',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Storage bucket untuk images (setup di Storage tab)
-- Buat bucket baru nama: "images"
-- Set public access (cek Allow public access)
```

## 4. Setup Storage

1. Buka Storage tab di Supabase
2. Create bucket baru nama: `images`
3. Pilih "Public bucket"
4. Save

## 5. Update Config File

Di `src/config/supabase.js`, ganti:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

## 6. Test Connection

Run app:
```bash
npm start
```

Coba register account baru. User data harus muncul di Supabase > users table.

## Notes

- Firebase auth masih dipakai untuk login/register. Data user disimpan di Supabase
- Real-time subscriptions di supabase.js bisa enable di Authentication > Policies jika perlu
- Storage files auto-serve via Supabase CDN
- Cost: $25/month standard plan (includes 500GB bandwidth, generous free tier)

Jika perlu help setup Supabase atau error, ping saya.
