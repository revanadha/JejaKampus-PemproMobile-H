import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch,
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

function ToggleRow({ icon, iconColor, bgColor, label, desc, value, onToggle, last }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={[styles.rowIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {desc && <Text style={styles.rowDesc}>{desc}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.surfaceElevated, true: COLORS.primary + '80' }}
        thumbColor={value ? COLORS.primary : COLORS.textMuted}
      />
    </View>
  );
}

function SectionTitle({ label }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

export default function NotificationSettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    pushAll: true,
    matchFound: true,
    newMessage: true,
    claimRequest: true,
    statusUpdate: true,
    systemInfo: false,
    emailDigest: true,
    soundAlert: true,
    vibrate: true,
    quietHours: false,
  });

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <View style={styles.container}>
      <Header title="Pengaturan Notifikasi" onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

        {/* Master Switch */}
        <View style={styles.masterWrap}>
          <LinearGradient
            colors={settings.pushAll ? [COLORS.primary + '20', COLORS.accent + '10'] : [COLORS.surfaceElevated, COLORS.surfaceElevated]}
            style={styles.masterCard}
          >
            <View style={styles.masterLeft}>
              <LinearGradient
                colors={settings.pushAll ? [COLORS.primary, COLORS.accent] : [COLORS.textMuted, COLORS.textMuted]}
                style={styles.masterIcon}
              >
                <Ionicons name="notifications" size={26} color="white" />
              </LinearGradient>
              <View>
                <Text style={styles.masterLabel}>Semua Notifikasi</Text>
                <Text style={styles.masterDesc}>
                  {settings.pushAll ? 'Notifikasi aktif' : 'Notifikasi dimatikan'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.pushAll}
              onValueChange={() => toggle('pushAll')}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={settings.pushAll ? COLORS.primary : COLORS.textMuted}
            />
          </LinearGradient>
        </View>

        <View style={{ opacity: settings.pushAll ? 1 : 0.4, pointerEvents: settings.pushAll ? 'auto' : 'none' }}>
          {/* Aktivitas */}
          <SectionTitle label="AKTIVITAS LAPORAN" />
          <View style={styles.card}>
            <ToggleRow icon="sparkles" iconColor="#FFD60A" bgColor="#FFD60A20"
              label="Kecocokan Ditemukan"
              desc="Notifikasi saat sistem menemukan barang yang cocok"
              value={settings.matchFound} onToggle={() => toggle('matchFound')} />
            <ToggleRow icon="hand-left" iconColor={COLORS.accent} bgColor={COLORS.accent + '20'}
              label="Permintaan Klaim"
              desc="Saat seseorang mengklaim barang laporanmu"
              value={settings.claimRequest} onToggle={() => toggle('claimRequest')} />
            <ToggleRow icon="refresh-circle" iconColor={COLORS.primary} bgColor={COLORS.primary + '20'}
              label="Pembaruan Status"
              desc="Perubahan status pada laporan aktifmu"
              value={settings.statusUpdate} onToggle={() => toggle('statusUpdate')} last />
          </View>

          {/* Pesan */}
          <SectionTitle label="PESAN" />
          <View style={styles.card}>
            <ToggleRow icon="chatbubble-ellipses" iconColor="#BF5AF2" bgColor="#BF5AF220"
              label="Pesan Baru"
              desc="Saat ada pesan masuk di percakapanmu"
              value={settings.newMessage} onToggle={() => toggle('newMessage')} last />
          </View>

          {/* Lain-lain */}
          <SectionTitle label="LAINNYA" />
          <View style={styles.card}>
            <ToggleRow icon="mail" iconColor={COLORS.found} bgColor={COLORS.found + '20'}
              label="Ringkasan Email"
              desc="Laporan mingguan aktivitas via email"
              value={settings.emailDigest} onToggle={() => toggle('emailDigest')} />
            <ToggleRow icon="information-circle" iconColor={COLORS.textSecondary} bgColor={COLORS.surfaceElevated}
              label="Info Sistem"
              desc="Pembaruan aplikasi dan pengumuman"
              value={settings.systemInfo} onToggle={() => toggle('systemInfo')} last />
          </View>

          {/* Suara & Getaran */}
          <SectionTitle label="SUARA & GETARAN" />
          <View style={styles.card}>
            <ToggleRow icon="volume-high" iconColor="#FF9F0A" bgColor="#FF9F0A20"
              label="Suara Notifikasi"
              desc="Putar suara saat notifikasi masuk"
              value={settings.soundAlert} onToggle={() => toggle('soundAlert')} />
            <ToggleRow icon="phone-portrait" iconColor={COLORS.primary} bgColor={COLORS.primary + '20'}
              label="Getaran"
              desc="Getar saat ada notifikasi baru"
              value={settings.vibrate} onToggle={() => toggle('vibrate')} />
            <ToggleRow icon="moon" iconColor="#5E5CE6" bgColor="#5E5CE620"
              label="Jam Sunyi"
              desc="Tunda notifikasi pukul 22.00–07.00"
              value={settings.quietHours} onToggle={() => toggle('quietHours')} last />
          </View>
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

  masterWrap: { paddingHorizontal: SPACING.base, paddingTop: SPACING.lg },
  masterCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.base, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
  },
  masterLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  masterIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  masterLabel: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.md, color: COLORS.textPrimary },
  masterDesc: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },

  sectionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted, letterSpacing: 1,
    marginTop: SPACING.xl, marginBottom: SPACING.sm,
    marginLeft: SPACING.base + 4,
  },
  card: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, gap: SPACING.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowContent: { flex: 1 },
  rowLabel: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary },
  rowDesc: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
});
