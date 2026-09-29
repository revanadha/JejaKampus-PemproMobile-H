import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

const ROLES = [
  { id: 'mahasiswa', label: 'Mahasiswa', icon: 'school-outline' },
  { id: 'dosen', label: 'Dosen', icon: 'person-outline' },
  { id: 'karyawan', label: 'Karyawan / Staff', icon: 'briefcase-outline' },
];

export default function RegisterScreen({ navigation }) {
  const { register, loginWithGoogle, googleRequest } = useAuth();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirmPassword: '', role: 'mahasiswa' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    if (!form.displayName || !form.email || !form.password) {
      setError('Nama, email, dan password wajib diisi.'); return;
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter.'); return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Password tidak cocok.'); return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form);
      setSuccess('Akun berhasil dibuat! Cek email Anda untuk verifikasi lalu login.');
    } catch (e) {
      const messages = {
        'auth/email-already-in-use': 'Email sudah digunakan.',
        'auth/invalid-email': 'Format email tidak valid.',
        'auth/weak-password': 'Password terlalu lemah.',
      };
      setError(messages[e.code] || 'Registrasi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (e) {
      setError('Daftar dengan Google gagal. Coba lagi.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={[COLORS.background, '#0D1F35']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.logoCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="person-add" size={30} color="white" />
          </LinearGradient>
          <Text style={styles.title}>Buat Akun</Text>
          <Text style={styles.subtitle}>Bergabung dengan komunitas JejaKampus UMM</Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.lost} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={16} color="#30D158" />
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {/* Role Selector */}
          <Text style={styles.label}>Saya adalah</Text>
          <View style={styles.roleRow}>
            {ROLES.map(role => (
              <TouchableOpacity
                key={role.id}
                style={[styles.roleBtn, form.role === role.id && styles.roleBtnActive]}
                onPress={() => update('role', role.id)}
              >
                <Ionicons name={role.icon} size={18} color={form.role === role.id ? 'white' : COLORS.textSecondary} />
                <Text style={[styles.roleBtnText, form.role === role.id && styles.roleBtnTextActive]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField label="Nama Lengkap" icon="person-outline" placeholder="John Doe" value={form.displayName} onChangeText={v => update('displayName', v)} />
          <InputField label="Email" icon="mail-outline" placeholder="email@gmail.com" value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" autoCapitalize="none" />

          <InputField label="Password" icon="lock-closed-outline" placeholder="Min. 6 karakter" value={form.password} onChangeText={v => update('password', v)} secureTextEntry={!showPassword}
            rightIcon={<TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>}
          />
          <InputField label="Konfirmasi Password" icon="lock-closed-outline" placeholder="Ulangi password" value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} secureTextEntry />

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <Text style={styles.btnText}>Daftar Sekarang</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau daftar dengan</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleRegister}
            disabled={googleLoading || !googleRequest}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleBtnText}>Daftar dengan Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>
              Sudah punya akun? <Text style={styles.loginLinkHighlight}>Masuk</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const InputField = ({ label, icon, rightIcon, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
      <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted} {...props} />
      {rightIcon}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.base, paddingTop: 50, paddingBottom: 40 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoCircle: { width: 70, height: 70, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  title: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: TYPOGRAPHY.sizes['2xl'], color: COLORS.textPrimary },
  subtitle: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,69,58,0.1)', borderWidth: 1, borderColor: 'rgba(255,69,58,0.3)', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  errorText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.lost, flex: 1 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(48,209,88,0.1)', borderWidth: 1, borderColor: 'rgba(48,209,88,0.3)', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  successText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: '#30D158', flex: 1 },
  label: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  roleRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.border },
  roleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleBtnText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 11, color: COLORS.textSecondary },
  roleBtnTextActive: { color: 'white' },
  inputGroup: { marginBottom: SPACING.md },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 50 },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, color: COLORS.textPrimary, fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.base },
  registerBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.sm, marginBottom: SPACING.md },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  btnText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.md, color: 'white' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textMuted, marginHorizontal: SPACING.sm },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.base },
  googleIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  googleIconText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 14, color: '#4285F4' },
  googleBtnText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.md, color: COLORS.textPrimary },
  loginLink: { alignItems: 'center' },
  loginLinkText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary },
  loginLinkHighlight: { color: COLORS.primary, fontFamily: TYPOGRAPHY.fontFamily.semiBold },
});
