import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Image, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
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

function InputField({ label, value, onChangeText, placeholder, icon, keyboardType, multiline, editable = true }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        focused && styles.inputWrapperFocused,
        !editable && styles.inputWrapperDisabled,
      ]}>
        <Ionicons name={icon} size={18} color={focused ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && { height: 90, textAlignVertical: 'top', paddingTop: 10 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

export default function EditProfileScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [nim, setNim] = useState(userProfile?.nim || '');
  const [prodi, setProdi] = useState(userProfile?.prodi || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [photoURI, setPhotoURI] = useState(userProfile?.photoURL || null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Akses galeri diperlukan untuk mengubah foto profil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhotoURI(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Nama wajib diisi');
      return;
    }
    setSaving(true);
    try {
      // TODO: update Firestore & Firebase Auth profile
      await new Promise(r => setTimeout(r, 1000)); // simulasi
      Alert.alert('✅ Berhasil', 'Profil berhasil diperbarui.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menyimpan perubahan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const initial = (displayName[0] || userProfile?.displayName?.[0] || '?').toUpperCase();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Header title="Edit Profil" onBack={() => navigation.goBack()} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

          {/* Avatar Picker */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.8}>
              {photoURI ? (
                <Image source={{ uri: photoURI }} style={styles.avatarImg} />
              ) : (
                <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.avatarGradient}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </LinearGradient>
              )}
              <View style={styles.avatarEditBadge}>
                <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.avatarEditGradient}>
                  <Ionicons name="camera" size={14} color="white" />
                </LinearGradient>
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Ketuk untuk ubah foto</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>INFORMASI DASAR</Text>
            <View style={styles.card}>
              <InputField label="Nama Lengkap" value={displayName} onChangeText={setDisplayName}
                placeholder="Masukkan nama lengkap" icon="person-outline" />
              <InputField label="Email" value={user?.email || ''} placeholder="email@umm.ac.id"
                icon="mail-outline" editable={false} />
              <InputField label="No. WhatsApp" value={phone} onChangeText={setPhone}
                placeholder="08xxxxxxxxxx" icon="call-outline" keyboardType="phone-pad" />
            </View>

            <Text style={styles.sectionLabel}>INFORMASI AKADEMIK</Text>
            <View style={styles.card}>
              <InputField label="NIM" value={nim} onChangeText={setNim}
                placeholder="Nomor Induk Mahasiswa" icon="card-outline" keyboardType="numeric" />
              <InputField label="Program Studi" value={prodi} onChangeText={setProdi}
                placeholder="Contoh: Teknik Informatika" icon="school-outline" />
            </View>

            <Text style={styles.sectionLabel}>TENTANG SAYA</Text>
            <View style={styles.card}>
              <InputField label="Bio" value={bio} onChangeText={setBio}
                placeholder="Ceritakan sedikit tentang dirimu..." icon="create-outline" multiline />
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.saveBtnWrap}>
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.saveBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {saving
                ? <Text style={styles.saveBtnText}>Menyimpan...</Text>
                : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                  <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
                </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
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

  avatarSection: { alignItems: 'center', paddingVertical: SPACING.xl },
  avatarWrap: { position: 'relative', marginBottom: SPACING.sm },
  avatarImg: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.primary },
  avatarGradient: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 36, color: 'white' },
  avatarEditBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: COLORS.background,
    overflow: 'hidden',
  },
  avatarEditGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  changePhotoText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.primary,
  },

  formSection: { paddingHorizontal: SPACING.base },
  sectionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textMuted,
    letterSpacing: 1, marginTop: SPACING.lg, marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    gap: 2,
  },

  inputGroup: { paddingVertical: SPACING.sm },
  inputLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  inputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  inputWrapperDisabled: { opacity: 0.5 },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1, color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.base,
  },

  saveBtnWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.base, backgroundColor: COLORS.background,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: 15, borderRadius: RADIUS.lg,
  },
  saveBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.md, color: 'white',
  },
});
