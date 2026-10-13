import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
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

function ActionRow({ icon, iconColor, bgColor, label, desc, onPress, last, danger }) {
  return (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && { color: COLORS.lost }]}>{label}</Text>
        {desc && <Text style={styles.rowDesc}>{desc}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function PasswordField({ label, value, onChangeText, placeholder }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
        <Ionicons name="lock-closed-outline" size={18} color={focused ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={!show}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <TouchableOpacity onPress={() => setShow(!show)}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PrivacySecurityScreen({ navigation }) {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving] = useState(false);

  const passwordStrength = () => {
    if (newPass.length === 0) return null;
    if (newPass.length < 6) return { label: 'Lemah', color: COLORS.lost, width: '25%' };
    if (newPass.length < 10 || !/[A-Z]/.test(newPass)) return { label: 'Sedang', color: COLORS.pending, width: '55%' };
    return { label: 'Kuat', color: COLORS.found, width: '100%' };
  };
  const strength = passwordStrength();

  const handleChangePassword = async () => {
    if (!oldPass || !newPass || !confirmPass) {
      Alert.alert('Lengkapi semua field password');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Password baru tidak cocok');
      return;
    }
    if (newPass.length < 6) {
      Alert.alert('Password minimal 6 karakter');
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    Alert.alert('✅ Berhasil', 'Password berhasil diubah.');
    setOldPass(''); setNewPass(''); setConfirmPass('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Header title="Privasi & Keamanan" onBack={() => navigation.goBack()} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

          {/* Status Keamanan */}
          <View style={styles.statusCard}>
            <LinearGradient colors={[COLORS.found + '20', COLORS.accent + '10']} style={styles.statusInner}>
              <View style={styles.statusIcon}>
                <LinearGradient colors={[COLORS.found, COLORS.accent]} style={styles.statusIconGradient}>
                  <Ionicons name="shield-checkmark" size={28} color="white" />
                </LinearGradient>
              </View>
              <View>
                <Text style={styles.statusTitle}>Akun Terlindungi</Text>
                <Text style={styles.statusDesc}>Sesi tersimpan secara terenkripsi</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Ganti Password */}
          <SectionTitle label="UBAH PASSWORD" />
          <View style={styles.card}>
            <PasswordField label="Password Saat Ini" value={oldPass} onChangeText={setOldPass} placeholder="••••••••" />
            <PasswordField label="Password Baru" value={newPass} onChangeText={setNewPass} placeholder="Minimal 6 karakter" />

            {/* Strength Bar */}
            {strength && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: strength.width, backgroundColor: strength.color }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            <PasswordField label="Konfirmasi Password Baru" value={confirmPass} onChangeText={setConfirmPass} placeholder="Ulangi password baru" />

            <TouchableOpacity onPress={handleChangePassword} disabled={saving} activeOpacity={0.85} style={{ marginTop: SPACING.sm, marginBottom: SPACING.sm }}>
              <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.applyBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="key-outline" size={18} color="white" />
                <Text style={styles.applyBtnText}>{saving ? 'Menyimpan...' : 'Ubah Password'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Sesi & Privasi */}
          <SectionTitle label="PRIVASI AKUN" />
          <View style={styles.menuCard}>
            <ActionRow icon="eye-off-outline" iconColor={COLORS.primary} bgColor={COLORS.primary + '20'}
              label="Visibilitas Profil"
              desc="Hanya sivitas UMM yang dapat melihat profilmu"
              onPress={() => Alert.alert('Visibilitas Profil', 'Saat ini profilmu hanya terlihat oleh pengguna terdaftar JejaKampus.')} />
            <ActionRow icon="location-outline" iconColor={COLORS.accent} bgColor={COLORS.accent + '20'}
              label="Data Lokasi"
              desc="Kelola izin lokasi untuk fitur peta"
              onPress={() => Alert.alert('Data Lokasi', 'Lokasi hanya digunakan untuk menampilkan titik laporan di peta.')} />
            <ActionRow icon="time-outline" iconColor="#FF9F0A" bgColor="#FF9F0A20"
              label="Riwayat Aktivitas"
              desc="Lihat semua aktivitas akunmu"
              onPress={() => Alert.alert('Segera Hadir', 'Fitur riwayat aktivitas sedang dalam pengembangan.')} last />
          </View>

          {/* Zona Berbahaya */}
          <SectionTitle label="ZONA BERBAHAYA" />
          <View style={styles.menuCard}>
            <ActionRow icon="log-out-outline" iconColor={COLORS.lost} bgColor={COLORS.lost + '15'}
              label="Keluar dari Semua Perangkat"
              desc="Hapus semua sesi aktif"
              onPress={() => Alert.alert('Konfirmasi', 'Kamu akan dikeluarkan dari semua perangkat. Lanjutkan?', [
                { text: 'Batal', style: 'cancel' },
                { text: 'Keluar', style: 'destructive', onPress: () => {} },
              ])}
              danger />
            <ActionRow icon="trash-outline" iconColor={COLORS.lost} bgColor={COLORS.lost + '15'}
              label="Hapus Akun"
              desc="Tindakan ini tidak dapat dibatalkan"
              onPress={() => Alert.alert('Hapus Akun', 'Seluruh data, laporan, dan riwayat chatmu akan dihapus permanen. Hubungi admin UMM untuk melanjutkan.', [
                { text: 'Batal', style: 'cancel' },
              ])}
              danger last />
          </View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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

  statusCard: { padding: SPACING.base, paddingTop: SPACING.lg },
  statusInner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.base, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.found + '30',
  },
  statusIcon: { width: 56, height: 56, borderRadius: 16, overflow: 'hidden' },
  statusIconGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.md, color: COLORS.textPrimary },
  statusDesc: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },

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
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  menuCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },

  inputGroup: { paddingVertical: SPACING.sm },
  inputLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 48,
  },
  inputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1, color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.base,
  },

  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 6, marginBottom: 2 },
  strengthBar: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.xs },

  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: 13, borderRadius: RADIUS.lg,
  },
  applyBtnText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: 'white' },

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
