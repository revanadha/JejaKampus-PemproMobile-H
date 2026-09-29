# 🎓 JejaKampus - Aplikasi Lost & Found UMM

Aplikasi mobile React Native (Expo) untuk sistem barang hilang dan ditemukan di kampus Universitas Muhammadiyah Malang (UMM).

## Fitur Utama

- Post & Filter Laporan (Hilang vs Ditemukan) dengan foto, deskripsi, dan kategori
- Verifikasi Kepemilikan berbasis Q&A (penemu buat pertanyaan, pemilik harus jawab)
- Chat In-App & Mode Anonim (real-time tanpa perlu share nomor HP)
- Peta Interaktif Google Maps (dark mode, marker titik lokasi)
- Integrasi Drop-off Pos Satpam dengan status tracking

## Setup

1. **Install dependensi:**
   ```bash
   npm install
   ```

2. **Konfigurasi Firebase** di `src/config/firebase.js`:
   - Buat project di https://console.firebase.google.com
   - Aktifkan: Authentication, Firestore, Storage, Realtime DB
   - Salin config ke `src/config/firebase.js`

3. **Google Maps API Key** di `app.json`:
   ```json
   "googleMapsApiKey": "YOUR_IOS_KEY"
   "apiKey": "YOUR_ANDROID_KEY"
   ```
   Aktifkan Maps SDK di Google Cloud Console.

4. **Jalankan:**
   ```bash
   npx expo start
   ```

## Struktur Project

```
src/
├── config/firebase.js          - Firebase setup
├── constants/theme.js          - Design system (colors, typography, locations)
├── context/AuthContext.js      - Auth state management
├── navigation/AppNavigator.js  - Routing (auth + main tabs)
├── screens/
│   ├── auth/LoginScreen.js
│   ├── auth/RegisterScreen.js
│   └── main/
│       ├── HomeScreen.js       - Feed + filter
│       ├── CreateReportScreen.js
│       ├── ReportDetailScreen.js - Detail + claim modal
│       ├── MapScreen.js        - Google Maps
│       ├── ChatsListScreen.js
│       ├── ChatScreen.js       - Real-time chat
│       └── ProfileScreen.js
└── components/
    ├── ReportCard.js
    └── FilterModal.js
```

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /reports/{reportId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.authorId;
    }
    match /chats/{chatId} {
      allow read, write: if request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      match /messages/{messageId} {
        allow read, write: if request.auth.uid in
          get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
  }
}
```
