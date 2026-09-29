import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

export default function LoginScreen({ navigation }) {
  const { login, loginWithGoogle, googleRequest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      const messages = {
        'auth/user-not-found': 'Akun tidak ditemukan.',
        'auth/wrong-password': 'Password salah.',
        'auth/invalid-email': 'Format email tidak valid.',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
      };
      setError(messages[e.code] || 'Login gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (e) {
      setError('Login dengan Google gagal. Coba lagi.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[COLORS.background, '#0D1F35']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo Area */}
        <View style={styles.logoArea}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            style={styles.logoCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="search" size={36} color="white" />
          </LinearGradient>
          <Text style={styles.appName}>JejaKampus</Text>
          <Text style={styles.tagline}>Temukan yang Hilang, Kembalikan yang Tersesat</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Masuk ke Akun</Text>
          <Text style={styles.cardSubtitle}>Gunakan email UMM Anda</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.lost} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="email@umm.ac.id"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Lupa Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.accent]}
              style={styles.loginGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Masuk</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Tombol Login Google */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
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
                <Text style={styles.googleBtnText}>Masuk dengan Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              Belum punya akun? <Text style={styles.registerLink}>Daftar Sekarang</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Khusus sivitas akademika UMM 🎓</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.base, paddingTop: 60, paddingBottom: 40 },
  logoArea: { alignItems: 'center', marginBottom: SPACING['2xl'] },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.sizes['3xl'],
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.sizes.xl,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,69,58,0.3)',
    borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.lost, flex: 1 },
  inputGroup: { marginBottom: SPACING.md },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: SPACING.md,
    height: 50,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1, color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.base,
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: SPACING.base },
  forgotText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
  },
  loginBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.base },
  loginGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, gap: 8,
  },
  loginBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.md, color: 'white',
  },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.base },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
  },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.border, marginBottom: SPACING.base,
  },
  googleIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
  },
  googleIconText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 14, color: '#4285F4',
  },
  googleBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.md, color: COLORS.textPrimary,
  },
  registerBtn: { alignItems: 'center' },
  registerText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary,
  },
  registerLink: { color: COLORS.primary, fontFamily: TYPOGRAPHY.fontFamily.semiBold },
  footer: {
    textAlign: 'center', marginTop: SPACING.xl,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textMuted,
  },
});
