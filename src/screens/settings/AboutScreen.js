import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

function Header({ title, onBack }) {
  return (
    <LinearGradient colors={['#0D1F35', COLORS.background]} style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </LinearGradient>
  );
}

function SectionTitle({ label }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function LinkRow({ icon, iconColor, bgColor, label, onPress, last }) {
  return (
    <TouchableOpacity
      style={[styles.linkRow, !last && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.linkIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.linkLabel}>{label}</Text>
      <Ionicons name="open-outline" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const TEAM = [
  { name: 'Revan Adha', role: 'Lead Developer & UI/UX', initials: 'RA', color: '#0A84FF' },
  { name: 'Tim H', role: 'Backend & Firebase', initials: 'TH', color: '#BF5AF2' },
  { name: 'Pembimbing UMM', role: 'Dosen Pembimbing', initials: 'UMM', color: '#00D4AA' },
];

export default function AboutScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Header title="Tentang JejaKampus" onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

        {/* Hero Logo */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name="search" size={44} color="white" />
          </LinearGradient>
          <Text style={styles.appName}>JejaKampus</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>v1.0.0</Text>
          </View>
          <Text style={styles.tagline}>Temukan yang Hilang,{'\n'}Kembalikan yang Tersesat</Text>
          <Text style={styles.campusTag}>🎓 Universitas Muhammadiyah Malang</Text>
        </View>

        {/* Tentang Aplikasi */}
        <SectionTitle label="TENTANG APLIKASI" />
        <View style={styles.descCard}>
          <Text style={styles.descText}>
            JejaKampus adalah platform Lost {'&'} Found digital khusus sivitas akademika UMM.
            Aplikasi ini memudahkan pelaporan barang hilang dan temuan, menghubungkan penemu
            dengan pemilik barang melalui chat langsung, serta menampilkan titik laporan
            di peta kampus secara real-time.
          </Text>
        </View>

        {/* Fitur Unggulan */}
        <SectionTitle label="FITUR UNGGULAN" />
        <View style={styles.featureGrid}>
          {[
            { icon: 'document-text', color: '#0A84FF', label: 'Laporan Digital', desc: 'Buat laporan hilang/temuan dengan foto' },
            { icon: 'map', color: '#30D158', label: 'Peta Real-time', desc: 'Lihat titik laporan di kampus' },
            { icon: 'chatbubbles', color: '#BF5AF2', label: 'Chat Langsung', desc: 'Hubungi penemu/pemilik' },
            { icon: 'notifications', color: '#FF9F0A', label: 'Notifikasi Pintar', desc: 'Alert saat barang cocok ditemukan' },
            { icon: 'shield-checkmark', color: '#00D4AA', label: 'Data Aman', desc: 'Sesi terenkripsi di perangkat' },
            { icon: 'search-circle', color: '#FF453A', label: 'Deteksi Cocok', desc: 'Sistem otomatis cocokkan laporan' },
          ].map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + '20' }]}>
                <Ionicons name={f.icon} size={24} color={f.color} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* Info Versi */}
        <SectionTitle label="INFORMASI VERSI" />
        <View style={styles.infoCard}>
          <InfoRow label="Versi Aplikasi" value="1.0.0" />
          <InfoRow label="SDK Expo" value="57.0.25" />
          <InfoRow label="React Native" value="0.86.3" />
          <InfoRow label="Firebase SDK" value="12.19.0" />
          <InfoRow label="Platform" value="Android & iOS" />
          <InfoRow label="Tahun Rilis" value="2026" last />
        </View>

        {/* Tim Pengembang */}
        <SectionTitle label="TIM PENGEMBANG" />
        <View style={styles.teamCard}>
          {TEAM.map((member, i) => (
            <View key={i} style={[styles.teamRow, i < TEAM.length - 1 && styles.rowBorder]}>
              <LinearGradient
                colors={[member.color, member.color + 'AA']}
                style={styles.teamAvatar}
              >
                <Text style={styles.teamAvatarText}>{member.initials}</Text>
              </LinearGradient>
              <View>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tautan */}
        <SectionTitle label="TAUTAN" />
        <View style={styles.linkCard}>
          <LinkRow icon="globe-outline" iconColor={COLORS.primary} bgColor={COLORS.primary + '20'}
            label="Website UMM"
            onPress={() => Linking.openURL('https://www.umm.ac.id')} />
          <LinkRow icon="logo-github" iconColor={COLORS.textSecondary} bgColor={COLORS.surfaceElevated}
            label="Source Code (GitHub)"
            onPress={() => Linking.openURL('https://github.com')} />
          <LinkRow icon="document-text-outline" iconColor="#FF9F0A" bgColor="#FF9F0A20"
            label="Kebijakan Privasi"
            onPress={() => Linking.openURL('https://www.umm.ac.id')} last />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <LinearGradient
            colors={[COLORS.primary + '15', COLORS.accent + '08']}
            style={styles.footerInner}
          >
            <Text style={styles.footerText}>Dibuat dengan ❤️ untuk sivitas UMM</Text>
            <Text style={styles.footerSub}>© 2026 JejaKampus · Universitas Muhammadiyah Malang</Text>
            <Text style={styles.footerSub}>Mata Kuliah Pemrograman Mobile — Kelompok H</Text>
          </LinearGradient>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 55, paddingBottom: SPACING.md, paddingHorizontal: SPACING.base,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.lg, color: COLORS.textPrimary,
  },

  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.base,
  },
  logoGradient: {
    width: 100, height: 100, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.sizes['3xl'], color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  versionBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.md, paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.primary + '40',
  },
  versionBadgeText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.primary,
  },
  tagline: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.md, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 26,
  },
  campusTag: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },

  sectionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted, letterSpacing: 1,
    marginTop: SPACING.xl, marginBottom: SPACING.sm,
    marginLeft: SPACING.base + 4,
  },

  descCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.base,
  },
  descText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textSecondary,
    lineHeight: 24,
  },

  featureGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: SPACING.base, gap: SPACING.sm,
  },
  featureCard: {
    width: '47.5%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: 6,
  },
  featureIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary,
  },
  featureDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textMuted, lineHeight: 16,
  },

  infoCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textSecondary,
  },
  infoValue: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary,
  },

  teamCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  teamRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
  },
  teamAvatar: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  teamAvatarText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 14, color: 'white',
  },
  teamName: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary,
  },
  teamRole: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textMuted, marginTop: 2,
  },

  linkCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  linkIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  linkLabel: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary,
  },

  footer: { margin: SPACING.base, marginTop: SPACING.xl },
  footerInner: {
    alignItems: 'center', gap: 6, padding: SPACING.xl,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  footerText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textSecondary,
  },
  footerSub: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textMuted, textAlign: 'center',
  },
});
