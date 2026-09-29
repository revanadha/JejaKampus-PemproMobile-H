import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

export default function ProfileScreen({ navigation }) {
  const { user, userProfile, logout } = useAuth();
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'reports'), where('authorId', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      setMyReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ]);
  };

  const lostCount = myReports.filter(r => r.type === 'lost').length;
  const foundCount = myReports.filter(r => r.type === 'found').length;
  const resolvedCount = myReports.filter(r => r.status === 'resolved').length;

  const ROLE_LABELS = { mahasiswa: 'Mahasiswa', dosen: 'Dosen', karyawan: 'Karyawan / Staff' };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Header */}
        <LinearGradient colors={['#0D1F35', COLORS.background]} style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.avatarBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.avatarInitial}>
                {userProfile?.displayName?.[0]?.toUpperCase() || '?'}
              </Text>
            </LinearGradient>
          </View>
          <Text style={styles.userName}>{userProfile?.displayName || 'Pengguna'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="school-outline" size={14} color={COLORS.accent} />
            <Text style={styles.roleText}>{ROLE_LABELS[userProfile?.role] || userProfile?.role} · UMM</Text>
          </View>
          {userProfile?.nim && (
            <Text style={styles.nim}>NIM: {userProfile.nim}</Text>
          )}
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={lostCount} label="Laporan Hilang" color={COLORS.lost} icon="search-outline" />
          <StatCard value={foundCount} label="Laporan Temuan" color={COLORS.found} icon="checkmark-circle-outline" />
          <StatCard value={resolvedCount} label="Berhasil" color={COLORS.accent} icon="trophy-outline" />
        </View>

        {/* My Reports */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Laporan Saya</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.sectionLink}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
          ) : myReports.length === 0 ? (
            <View style={styles.emptyReports}>
              <Ionicons name="document-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Belum ada laporan</Text>
            </View>
          ) : (
            myReports.slice(0, 3).map(report => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportItem}
                onPress={() => navigation.navigate('Home', { screen: 'ReportDetail', params: { reportId: report.id } })}
              >
                <View style={[styles.reportTypeDot, { backgroundColor: report.type === 'lost' ? COLORS.lost : COLORS.found }]} />
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle} numberOfLines={1}>{report.title}</Text>
                  <Text style={styles.reportMeta}>{report.locationName} · {report.type === 'lost' ? 'Hilang' : 'Ditemukan'}</Text>
                </View>
                <View style={[styles.reportStatus, { backgroundColor: report.status === 'resolved' ? COLORS.found + '30' : COLORS.pending + '30' }]}>
                  <Text style={[styles.reportStatusText, { color: report.status === 'resolved' ? COLORS.found : COLORS.pending }]}>
                    {report.status === 'active' ? 'Aktif' : report.status === 'claimed' ? 'Diklaim' : 'Selesai'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengaturan</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="person-outline" label="Edit Profil" onPress={() => Alert.alert('Segera hadir')} />
            <MenuItem icon="notifications-outline" label="Notifikasi" onPress={() => Alert.alert('Segera hadir')} />
            <MenuItem icon="shield-outline" label="Privasi & Keamanan" onPress={() => Alert.alert('Segera hadir')} />
            <MenuItem icon="help-circle-outline" label="Bantuan & FAQ" onPress={() => Alert.alert('Segera hadir')} />
            <MenuItem icon="information-circle-outline" label="Tentang JejaKampus" onPress={() => Alert.alert('JejaKampus v1.0', 'Aplikasi Lost & Found kampus UMM\nDibuat dengan ❤️ untuk sivitas akademika UMM')} last />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.lost} />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>

        <Text style={styles.version}>JejaKampus v1.0.0 · Universitas Muhammadiyah Malang</Text>
      </ScrollView>
    </View>
  );
}

const StatCard = ({ value, label, color, icon }) => (
  <View style={[styles.statCard, { borderColor: color + '40' }]}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuItem = ({ icon, label, onPress, last }) => (
  <TouchableOpacity style={[styles.menuItem, !last && styles.menuItemBorder]} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <View style={styles.menuItemIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.menuItemText}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: { alignItems: 'center', paddingTop: 60, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.base },
  avatarContainer: { marginBottom: SPACING.md },
  avatarBg: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: TYPOGRAPHY.sizes['3xl'], color: 'white' },
  userName: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: TYPOGRAPHY.sizes['2xl'], color: COLORS.textPrimary },
  userEmail: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, marginTop: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.accent + '20', paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.accent + '40' },
  roleText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.accent },
  nim: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.base, gap: SPACING.sm, marginTop: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center', paddingVertical: SPACING.md, gap: 4 },
  statValue: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: TYPOGRAPHY.sizes.xl },
  statLabel: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 9, color: COLORS.textSecondary, textAlign: 'center' },
  section: { paddingHorizontal: SPACING.base, marginTop: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.lg, color: COLORS.textPrimary },
  sectionLink: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.primary },
  emptyReports: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textMuted, marginTop: SPACING.sm },
  reportItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md },
  reportTypeDot: { width: 8, height: 8, borderRadius: 4 },
  reportInfo: { flex: 1 },
  reportTitle: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary },
  reportMeta: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  reportStatus: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  reportStatusText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: 10 },
  menuCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.base, paddingVertical: SPACING.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  menuItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center' },
  menuItemText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginHorizontal: SPACING.base, marginTop: SPACING.xl, paddingVertical: SPACING.md, backgroundColor: COLORS.lost + '15', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.lost + '40' },
  logoutText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.lost },
  version: { textAlign: 'center', fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 11, color: COLORS.textMuted, marginTop: SPACING.xl, marginBottom: SPACING.sm },
});
