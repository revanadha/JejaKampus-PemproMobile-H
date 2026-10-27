// Design System & Theme Constants

export const COLORS = {
  // Primary Palette
  primary: '#0A84FF',
  primaryDark: '#0066CC',
  primaryLight: '#4DA3FF',

  // Accent
  accent: '#00D4AA',
  accentDark: '#00A884',
  accentLight: '#4DFFDA',

  // Status Colors
  lost: '#FF453A',
  lostLight: '#FF6B63',
  found: '#30D158',
  foundLight: '#5EE080',
  pending: '#FFD60A',

  // Backgrounds
  background: '#0D1117',
  surface: '#161B22',
  surfaceElevated: '#21262D',
  surfaceCard: '#1C2128',

  // Text
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  textInverse: '#0D1117',

  // Border
  border: '#30363D',
  borderLight: '#21262D',

  // Gradient stops
  gradientStart: '#0A84FF',
  gradientEnd: '#00D4AA',

  // Category colors
  categoryElektronik: '#FF9F0A',
  categoryDokumen: '#0A84FF',
  categoryKunci: '#FFD60A',
  categoryPakaian: '#BF5AF2',
  categoryDompet: '#30D158',
  categoryLainnya: '#8B949E',
};

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const CAMPUS_LOCATIONS = [
  { id: 'perpus_pusat', name: 'Perpustakaan Pusat UMM', lat: -7.92062, lng: 112.59694 },
  { id: 'masjid_ar', name: 'Masjid AR. Fachruddin', lat: -7.92131, lng: 112.59583 },
  { id: 'parkir_barat', name: 'Area Parkir Barat', lat: -7.92095, lng: 112.59560 },
  { id: 'rektorat', name: 'Gedung Rektorat', lat: -7.92167, lng: 112.59813 },
  { id: 'gkb1', name: 'GKB 1', lat: -7.92062, lng: 112.59830 },
  { id: 'gkb2', name: 'GKB 2', lat: -7.92135, lng: 112.59913 },
  { id: 'gkb3', name: 'GKB 3', lat: -7.92112, lng: 112.59924 },
  { id: 'gkb4', name: 'GKB 4', lat: -7.92190, lng: 112.60012 },
  { id: 'fkip', name: 'Gedung FKIP (GKB 1)', lat: -7.92070, lng: 112.59840 },
  { id: 'feb', name: 'Gedung FEB (GKB 2)', lat: -7.92140, lng: 112.59910 },
  { id: 'ft', name: 'Gedung Fakultas Teknik (GKB 3)', lat: -7.92115, lng: 112.59930 },
  { id: 'fk', name: 'Gedung FK & Lab Biomedik', lat: -7.92265, lng: 112.59760 },
  { id: 'kantin_a', name: 'Kantin Danau UMM', lat: -7.92140, lng: 112.59850 },
  { id: 'pos_satpam_utama', name: 'Pos Satpam Utama (Gerbang Depan)', lat: -7.92320, lng: 112.59720, isDropOff: true },
  { id: 'pos_satpam_belakang', name: 'Pos Satpam Belakang', lat: -7.92020, lng: 112.60010, isDropOff: true },
  { id: 'pos_satpam_perpus', name: 'Pos Satpam Perpustakaan', lat: -7.92080, lng: 112.59680, isDropOff: true },
];

export const CATEGORIES = [
  { id: 'elektronik', name: 'Elektronik', icon: 'phone-portrait-outline', color: '#FF9F0A' },
  { id: 'dokumen', name: 'Dokumen / KTM', icon: 'document-text-outline', color: '#0A84FF' },
  { id: 'kunci', name: 'Kunci', icon: 'key-outline', color: '#FFD60A' },
  { id: 'pakaian', name: 'Pakaian', icon: 'shirt-outline', color: '#BF5AF2' },
  { id: 'dompet', name: 'Dompet / Tas', icon: 'bag-handle-outline', color: '#30D158' },
  { id: 'aksesoris', name: 'Aksesoris', icon: 'glasses-outline', color: '#FF6B9D' },
  { id: 'buku', name: 'Buku / Alat Tulis', icon: 'book-outline', color: '#FF9F0A' },
  { id: 'lainnya', name: 'Lainnya', icon: 'ellipsis-horizontal-outline', color: '#8B949E' },
];

export const DROP_OFF_LOCATIONS = CAMPUS_LOCATIONS.filter(l => l.isDropOff);
