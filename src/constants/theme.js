// Design System & Theme Constants
// Reference: Clean Modern Neo-Utility Style (Soft Light, Warm Gold & Charcoal)

export const COLORS = {
  // Primary Palette (Warm Amber / Gold as featured in reference UI)
  primary: '#F59E0B',
  primaryDark: '#D97706',
  primaryLight: '#FEF3C7',

  // Accent (Charcoal Dark for callout cards & contrast elements)
  accent: '#18181B',
  accentDark: '#09090B',
  accentLight: '#27272A',

  // Status Colors
  lost: '#EF4444',
  lostLight: '#FEE2E2',
  found: '#10B981',
  foundLight: '#D1FAE5',
  pending: '#F59E0B',

  // Backgrounds (Clean modern off-white and pure white cards)
  background: '#F8F9FB',
  headerBackground: '#F8F9FB',
  surface: '#FFFFFF',
  surfaceElevated: '#F3F4F6',
  surfaceCard: '#FFFFFF',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Border
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Gradient stops
  gradientStart: '#F59E0B',
  gradientEnd: '#FBBF24',

  // Category colors
  categoryElektronik: '#F59E0B',
  categoryDokumen: '#3B82F6',
  categoryKunci: '#EAB308',
  categoryPakaian: '#8B5CF6',
  categoryDompet: '#10B981',
  categoryLainnya: '#6B7280',
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
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
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
  { id: 'elektronik', name: 'Elektronik', icon: 'phone-portrait-outline', color: '#F59E0B' },
  { id: 'dokumen', name: 'Dokumen / KTM', icon: 'document-text-outline', color: '#C41E3A' },
  { id: 'kunci', name: 'Kunci', icon: 'key-outline', color: '#EAB308' },
  { id: 'pakaian', name: 'Pakaian', icon: 'shirt-outline', color: '#A855F7' },
  { id: 'dompet', name: 'Dompet / Tas', icon: 'bag-handle-outline', color: '#10B981' },
  { id: 'aksesoris', name: 'Aksesoris', icon: 'glasses-outline', color: '#EC4899' },
  { id: 'buku', name: 'Buku / Alat Tulis', icon: 'book-outline', color: '#F97316' },
  { id: 'lainnya', name: 'Lainnya', icon: 'ellipsis-horizontal-outline', color: '#71717A' },
];

export const DROP_OFF_LOCATIONS = CAMPUS_LOCATIONS.filter(l => l.isDropOff);
