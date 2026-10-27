import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { getMyReports, deleteReport } from '../../services/reportService';
import dayjs from 'dayjs';

const ROLE_LABELS = {
  mahasiswa: 'Mahasiswa',
  dosen: 'Dosen',
  karyawan: 'Karyawan / Staff',
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ value, label, color, icon }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '40' }]} >
      <LinearGradient colors={[color + '25', color + '08']} style={styles.statIconWrap}>
        <Ionicons name={icon} size={18} color={color} />
      </LinearGradient>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Menu Item ────────────────────────────────────────────────────────────────
function MenuItem({ icon, iconColor, bgColor, label, subtitle, onPress, last, badge, danger }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.menuItem, !last && styles.menuItemBorder]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        activeOpacity={1}
      >
        <View style={[styles.menuItemIcon, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.menuItemInfo}>
          <Text style={[styles.menuItemText, danger && { color: COLORS.lost }]}>{label}</Text>
          {subtitle && <Text style={styles.menuItemSub}>{subtitle}</Text>}
        </View>
        <View style={styles.menuItemRight}>
          {badge && (
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.menuBadge}>
              <Text style={styles.menuBadgeText}>{badge}</Text>
            </LinearGradient>
          )}
          <Ionicons name="chevron-forward" size={15} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Report Card ─────────────────────────────────────────────────────────────
function ReportCard({ report, onPress }) {
  const isLost = report.type === 'lost';
  const isResolved = report.status === 'resolved';
  const statusColor = isResolved ? COLORS.found : report.status === 'claimed' ? COLORS.accent : COLORS.pending;
  const statusLabel = isResolved ? 'Selesai' : report.status === 'claimed' ? 'Diklaim' : 'Aktif';

  return (
    <TouchableOpacity style={styles.reportCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.reportTypeDot, { backgroundColor: isLost ? COLORS.lost : COLORS.found }]} />
      <View style={styles.reportInfo}>
        <Text style={styles.reportTitle} numberOfLines={1}>{report.title}</Text>
        <Text style={styles.reportMeta} numberOfLines={1}>
          <Ionicons name="location-outline" size={11} /> {report.locationName || 'UMM'}
          {'  ·  '}
          {isLost ? '📦 Hilang' : '🔍 Ditemukan'}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor + '25', borderColor: statusColor + '50' }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { user, userProfile, logout } = useAuth();
  const { isOnline } = useNetwork();
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchMyReports = async () => {
    if (!user) return;
    setFetchError(null);
    // GET dengan access token otomatis dari reportService
    const { data, error } = await getMyReports(user.id);
    if (error) {
      setFetchError(error.message || 'Gagal memuat laporan.');
    } else if (data) {
      const mappedData = data.map(d => ({
        ...d,
        locationName: d.location_name,
      }));
      setMyReports(mappedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    
    fetchMyReports();

    const channel = supabase.channel('public:reports_profile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `author_id=eq.${user.id}` }, () => {
         fetchMyReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Keluar', 'Apakah kamu yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ]);
  };

  // DELETE: hapus laporan dengan konfirmasi
  const handleDeleteReport = (reportId, title) => {
    if (!isOnline) {
      Alert.alert('Tidak Ada Koneksi', 'Anda sedang offline. Hubungkan ke internet untuk menghapus laporan.');
      return;
    }
    Alert.alert(
      'Hapus Laporan',
      `Apakah kamu yakin ingin menghapus laporan "${title}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteReport(reportId);
            if (error) {
              Alert.alert('Gagal', error.message || 'Tidak dapat menghapus laporan.');
            } else {
              setMyReports(prev => prev.filter(r => r.id !== reportId));
            }
          },
        },
      ]
    );
  };

  const lostCount = myReports.filter(r => r.type === 'lost').length;
  const foundCount = myReports.filter(r => r.type === 'found').length;
  const resolvedCount = myReports.filter(r => r.status === 'resolved').length;
  const initial = (userProfile?.display_name?.[0] || '?').toUpperCase();
  const joinDate = userProfile?.created_at
    ? dayjs(userProfile.created_at).format('MMM YYYY')
    : 'UMM';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Profile Header ─────────────────────────────── */}
        <LinearGradient colors={['#0D1F35', COLORS.background]} style={styles.profileHeader}>
          {/* Edit button */}
          <TouchableOpacity
            style={styles.editHeaderBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.accent]}
              style={styles.avatarBg}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarInitial}>{initial}</Text>
            </LinearGradient>
            <View style={styles.avatarCameraBtn}>
              <Ionicons name="camera" size={12} color="white" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{userProfile?.display_name || 'Pengguna'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Ionicons name="school-outline" size={13} color={COLORS.accent} />
              <Text style={styles.roleText}>
                {ROLE_LABELS[userProfile?.role] || 'Mahasiswa'} · UMM
              </Text>
            </View>
            {userProfile?.nim && (
              <View style={styles.nimBadge}>
                <Ionicons name="card-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.nimText}>{userProfile.nim}</Text>
              </View>
            )}
          </View>

          <Text style={styles.joinDate}>Bergabung {joinDate}</Text>
        </LinearGradient>

        {/* ── Stats ──────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard value={lostCount} label={'Laporan\nHilang'} color={COLORS.lost} icon="search-outline" />
          <StatCard value={foundCount} label={'Laporan\nTemuan'} color={COLORS.found} icon="checkmark-circle-outline" />
          <StatCard value={resolvedCount} label={'Berhasil\nSelesai'} color={COLORS.accent} icon="trophy-outline" />
        </View>

        {/* ── Laporan Saya ────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Laporan Saya</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.sectionLink}>Lihat Semua →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
          ) : fetchError ? (
            <View style={styles.emptyReports}>
              <LinearGradient colors={['#FF453A20', '#FF453A08']} style={styles.emptyIcon}>
                <Ionicons name="cloud-offline-outline" size={32} color={COLORS.lost} />
              </LinearGradient>
              <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>Gagal memuat laporan</Text>
              <Text style={[styles.emptyText, { fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }]}>{fetchError}</Text>
              <TouchableOpacity
                style={[styles.createReportBtn, { marginTop: SPACING.sm }]}
                onPress={() => { setLoading(true); fetchMyReports(); }}
                disabled={!isOnline}
              >
                <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.createReportGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="refresh" size={16} color="white" />
                  <Text style={styles.createReportText}>Coba Lagi</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : myReports.length === 0 ? (
            <View style={styles.emptyReports}>
              <LinearGradient colors={[COLORS.primary + '20', COLORS.accent + '08']} style={styles.emptyIcon}>
                <Ionicons name="document-outline" size={32} color={COLORS.primary} />
              </LinearGradient>
              <Text style={styles.emptyText}>Belum ada laporan</Text>
              <TouchableOpacity
                style={styles.createReportBtn}
                onPress={() => navigation.navigate('Home', { screen: 'CreateReport' })}
              >
                <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.createReportGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="add" size={16} color="white" />
                  <Text style={styles.createReportText}>Buat Laporan</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            myReports.slice(0, 3).map(report => (
              <ReportCard
                key={report.id}
                report={report}
                onPress={() => navigation.navigate('Home', {
                  screen: 'ReportDetail', params: { reportId: report.id },
                })}
                onLongPress={() => handleDeleteReport(report.id, report.title)}
              />
            ))
          )}
        </View>

        {/* ── Pengaturan Akun ─────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="person-outline" iconColor={COLORS.primary} bgColor={COLORS.primary + '20'}
              label="Edit Profil"
              subtitle="Nama, foto, NIM, program studi"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <MenuItem
              icon="notifications-outline" iconColor="#FF9F0A" bgColor="#FF9F0A20"
              label="Notifikasi"
              subtitle="Atur jenis dan waktu notifikasi"
              onPress={() => navigation.navigate('NotificationSettings')}
              badge="3"
            />
            <MenuItem
              icon="shield-checkmark-outline" iconColor={COLORS.found} bgColor={COLORS.found + '20'}
              label="Privasi & Keamanan"
              subtitle="Password, privasi, keamanan akun"
              onPress={() => navigation.navigate('PrivacySecurity')}
              last
            />
          </View>
        </View>

        {/* ── Informasi & Dukungan ─────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi & Dukungan</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="help-circle-outline" iconColor="#BF5AF2" bgColor="#BF5AF220"
              label="Bantuan & FAQ"
              subtitle="Panduan penggunaan dan tanya jawab"
              onPress={() => navigation.navigate('HelpFaq')}
            />
            <MenuItem
              icon="information-circle-outline" iconColor={COLORS.accent} bgColor={COLORS.accent + '20'}
              label="Tentang JejaKampus"
              subtitle="Versi aplikasi dan tim pengembang"
              onPress={() => navigation.navigate('About')}
              last
            />
          </View>
        </View>

        {/* ── Keluar ──────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline" iconColor={COLORS.lost} bgColor={COLORS.lost + '15'}
              label="Keluar"
              subtitle="Akhiri sesi dan kembali ke halaman login"
              onPress={handleLogout}
              danger last
            />
          </View>
        </View>

        <Text style={styles.version}>JejaKampus v1.0.0 · Universitas Muhammadiyah Malang</Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  profileHeader: {
    alignItems: 'center',
    paddingTop: 55, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.base,
    position: 'relative',
  },
  editHeaderBtn: {
    position: 'absolute', top: 55, right: SPACING.base,
    width: 40, height: 40, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatarWrap: { position: 'relative', marginBottom: SPACING.md },
  avatarBg: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.background,
  },
  avatarInitial: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.sizes['3xl'], color: 'white',
  },
  avatarCameraBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.background,
  },

  userName: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.sizes['2xl'], color: COLORS.textPrimary,
  },
  userEmail: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary,
    marginTop: 4, marginBottom: SPACING.md,
  },
  badgeRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.accent + '40',
  },
  roleText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.accent,
  },
  nimBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
  },
  nimText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary,
  },
  joinDate: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textMuted, marginTop: SPACING.sm,
  },

  statsRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.base,
    gap: SPACING.sm, marginTop: SPACING.md,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, borderWidth: 1,
    alignItems: 'center', paddingVertical: SPACING.md,
    gap: 5,
  },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: TYPOGRAPHY.sizes.xl },
  statLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 9, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 13,
  },

  section: { paddingHorizontal: SPACING.base, marginTop: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.lg, color: COLORS.textPrimary, marginBottom: SPACING.md,
  },
  sectionLink: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.primary,
  },

  reportCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md,
  },
  reportTypeDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  reportInfo: { flex: 1 },
  reportTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary,
  },
  reportMeta: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textSecondary, marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  statusText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: 10 },

  emptyReports: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.md },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textMuted,
  },
  createReportBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  createReportGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.lg, paddingVertical: 10,
  },
  createReportText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.base, color: 'white',
  },

  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, gap: SPACING.md,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuItemIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuItemInfo: { flex: 1 },
  menuItemText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary,
  },
  menuItemSub: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textMuted, marginTop: 2,
  },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  menuBadgeText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 10, color: 'white' },

  version: {
    textAlign: 'center', marginTop: SPACING.xl,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textMuted,
  },
});
