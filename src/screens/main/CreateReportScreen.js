import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert, Switch, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, CATEGORIES, CAMPUS_LOCATIONS } from '../../constants/theme';

export default function CreateReportScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const [type, setType] = useState('lost');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    locationId: '',
    color: '',
    brand: '',
    hiddenDetails: '',
    verificationQuestion: '',
    verificationAnswer: '',
  });
  const [images, setImages] = useState([]);
  const [useDropOff, setUseDropOff] = useState(false);
  const [dropOffLocationId, setDropOffLocationId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: basic info, 2: details, 3: verification

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Izin diperlukan', 'Aplikasi butuh akses galeri foto.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 4,
    });
    if (!result.canceled) setImages(prev => [...prev, ...result.assets].slice(0, 4));
  };

  const uploadImages = async () => {
    const urls = [];
    for (const img of images) {
      const response = await fetch(img.uri);
      const blob = await response.blob();
      const imgRef = ref(storage, `reports/${user.uid}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      await uploadBytes(imgRef, blob);
      const url = await getDownloadURL(imgRef);
      urls.push(url);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!form.title || !form.category || !form.locationId) {
      Alert.alert('Lengkapi Data', 'Judul, kategori, dan lokasi wajib diisi.'); return;
    }
    if (type === 'found' && (!form.verificationQuestion || !form.verificationAnswer)) {
      Alert.alert('Verifikasi Diperlukan', 'Buat pertanyaan dan jawaban verifikasi untuk barang temuan.'); return;
    }
    setLoading(true);
    try {
      const imageUrls = images.length > 0 ? await uploadImages() : [];
      const reportData = {
        type,
        title: form.title,
        description: form.description,
        category: form.category,
        locationId: form.locationId,
        locationName: CAMPUS_LOCATIONS.find(l => l.id === form.locationId)?.name || '',
        color: form.color,
        brand: form.brand,
        images: imageUrls,
        isAnonymous,
        authorId: user.uid,
        authorName: isAnonymous ? 'Anonim' : userProfile?.displayName,
        authorRole: userProfile?.role,
        status: 'active',
        claimRequests: [],
        // For 'found' items
        hiddenDetails: type === 'found' ? form.hiddenDetails : '',
        verificationQuestion: type === 'found' ? form.verificationQuestion : '',
        verificationAnswer: type === 'found' ? form.verificationAnswer.toLowerCase().trim() : '',
        // Drop-off point
        hasDropOff: type === 'found' && useDropOff,
        dropOffLocationId: useDropOff ? dropOffLocationId : null,
        dropOffLocationName: useDropOff ? CAMPUS_LOCATIONS.find(l => l.id === dropOffLocationId)?.name : null,
        dropOffStatus: useDropOff ? 'pending' : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'reports'), reportData);
      Alert.alert('Berhasil! 🎉', 'Laporan Anda telah dipublikasikan.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Gagal membuat laporan: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const dropOffLocations = CAMPUS_LOCATIONS.filter(l => l.isDropOff);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.background, '#0D1F35']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Laporan</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Type Toggle */}
      <View style={styles.typeToggle}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'lost' && styles.typeBtnLost]}
          onPress={() => setType('lost')}
        >
          <Ionicons name="search-outline" size={18} color={type === 'lost' ? 'white' : COLORS.textSecondary} />
          <Text style={[styles.typeBtnText, type === 'lost' && { color: 'white' }]}>Barang Hilang</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'found' && styles.typeBtnFound]}
          onPress={() => setType('found')}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color={type === 'found' ? 'white' : COLORS.textSecondary} />
          <Text style={[styles.typeBtnText, type === 'found' && { color: 'white' }]}>Barang Ditemukan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image Picker */}
        <Text style={styles.sectionTitle}>📷 Foto Barang</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.base }}>
          <View style={{ flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.base }}>
            {images.map((img, i) => (
              <View key={i} style={styles.imageThumb}>
                <Image source={{ uri: img.uri }} style={styles.thumbImg} />
                <TouchableOpacity style={styles.removeImg} onPress={() => setImages(prev => prev.filter((_, idx) => idx !== i))}>
                  <Ionicons name="close-circle" size={20} color={COLORS.lost} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 4 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Ionicons name="camera-outline" size={28} color={COLORS.textMuted} />
                <Text style={styles.addImageText}>Tambah Foto</Text>
                <Text style={styles.addImageHint}>{images.length}/4</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Basic Info */}
        <Text style={styles.sectionTitle}>📋 Informasi Dasar</Text>
        <InputField label="Judul Singkat *" placeholder="cth: HP Samsung Galaxy A54 warna hitam" value={form.title} onChangeText={v => update('title', v)} />
        <TextAreaField label="Deskripsi Lengkap" placeholder="Deskripsikan barang secara detail..." value={form.description} onChangeText={v => update('description', v)} />

        {/* Category */}
        <Text style={styles.label}>Kategori *</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catCard, form.category === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '20' }]}
              onPress={() => update('category', cat.id)}
            >
              <Ionicons name={cat.icon} size={22} color={form.category === cat.id ? cat.color : COLORS.textSecondary} />
              <Text style={[styles.catCardText, form.category === cat.id && { color: cat.color }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location */}
        <Text style={styles.label}>Lokasi Terakhir Terlihat *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.base }}>
          <View style={{ flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.base }}>
            {CAMPUS_LOCATIONS.filter(l => !l.isDropOff).map(loc => (
              <TouchableOpacity
                key={loc.id}
                style={[styles.locChip, form.locationId === loc.id && styles.locChipActive]}
                onPress={() => update('locationId', loc.id)}
              >
                <Ionicons name="location-outline" size={14} color={form.locationId === loc.id ? 'white' : COLORS.textSecondary} />
                <Text style={[styles.locChipText, form.locationId === loc.id && { color: 'white' }]}>{loc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Color & Brand */}
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <View style={{ flex: 1 }}>
            <InputField label="Warna" placeholder="cth: Hitam" value={form.color} onChangeText={v => update('color', v)} />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="Merek" placeholder="cth: Samsung" value={form.brand} onChangeText={v => update('brand', v)} />
          </View>
        </View>

        {/* Found-specific fields */}
        {type === 'found' && (
          <>
            <View style={styles.infoBox}>
              <Ionicons name="shield-outline" size={16} color={COLORS.accent} />
              <Text style={styles.infoBoxText}>Detail tersembunyi dan pertanyaan verifikasi membantu memastikan klaim dari pemilik asli.</Text>
            </View>

            <TextAreaField
              label="Detail Tersembunyi (hanya Anda yang tahu)"
              placeholder="cth: Ada stiker merah di belakang HP, isi dompet ada kartu BCA..."
              value={form.hiddenDetails}
              onChangeText={v => update('hiddenDetails', v)}
            />
            <InputField
              label="Pertanyaan Verifikasi *"
              placeholder="cth: Apa warna casing HP ini?"
              value={form.verificationQuestion}
              onChangeText={v => update('verificationQuestion', v)}
            />
            <InputField
              label="Jawaban (rahasia, tidak ditampilkan)"
              placeholder="cth: hitam matte"
              value={form.verificationAnswer}
              onChangeText={v => update('verificationAnswer', v)}
            />

            {/* Drop-off toggle */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Titipkan ke Pos Satpam?</Text>
                <Text style={styles.switchSub}>Barang akan disimpan di pos keamanan kampus</Text>
              </View>
              <Switch
                value={useDropOff}
                onValueChange={setUseDropOff}
                trackColor={{ true: COLORS.accent }}
                thumbColor="white"
              />
            </View>

            {useDropOff && (
              <View style={{ marginBottom: SPACING.base }}>
                <Text style={styles.label}>Pilih Pos Satpam</Text>
                {dropOffLocations.map(loc => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[styles.dropOffOption, dropOffLocationId === loc.id && styles.dropOffOptionActive]}
                    onPress={() => setDropOffLocationId(loc.id)}
                  >
                    <Ionicons name="shield-checkmark-outline" size={18} color={dropOffLocationId === loc.id ? COLORS.accent : COLORS.textSecondary} />
                    <Text style={[styles.dropOffText, dropOffLocationId === loc.id && { color: COLORS.accent }]}>{loc.name}</Text>
                    {dropOffLocationId === loc.id && <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Anonymous toggle */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Posting Anonim</Text>
            <Text style={styles.switchSub}>Nama Anda tidak akan ditampilkan</Text>
          </View>
          <Switch value={isAnonymous} onValueChange={setIsAnonymous} trackColor={{ true: COLORS.primary }} thumbColor="white" />
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          <LinearGradient
            colors={type === 'lost' ? [COLORS.lost, '#FF8C00'] : [COLORS.found, COLORS.accent]}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="send" size={18} color="white" />
                <Text style={styles.submitText}>Publikasikan Laporan</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const InputField = ({ label, ...props }) => (
  <View style={styles.inputGroup}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={styles.inputWrapper}>
      <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted} {...props} />
    </View>
  </View>
);

const TextAreaField = ({ label, ...props }) => (
  <View style={styles.inputGroup}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingVertical: SPACING.sm }]}>
      <TextInput style={[styles.input, { height: 80 }]} placeholderTextColor={COLORS.textMuted} multiline {...props} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.base, paddingTop: 55, paddingBottom: SPACING.md },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.lg, color: COLORS.textPrimary },
  typeToggle: { flexDirection: 'row', marginHorizontal: SPACING.base, marginBottom: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  typeBtnLost: { backgroundColor: COLORS.lost },
  typeBtnFound: { backgroundColor: COLORS.found },
  typeBtnText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary },
  scroll: { paddingHorizontal: SPACING.base, paddingBottom: 50 },
  sectionTitle: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  imageThumb: { width: 90, height: 90, borderRadius: RADIUS.md, overflow: 'visible' },
  thumbImg: { width: 90, height: 90, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceElevated },
  removeImg: { position: 'absolute', top: -8, right: -8, backgroundColor: COLORS.background, borderRadius: 10 },
  addImageBtn: { width: 90, height: 90, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  addImageText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  addImageHint: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 10, color: COLORS.textMuted },
  label: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  inputGroup: { marginBottom: SPACING.md },
  inputWrapper: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 50, justifyContent: 'center' },
  input: { color: COLORS.textPrimary, fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.base },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  catCard: { width: '22%', alignItems: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  catCardText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 9, color: COLORS.textSecondary, textAlign: 'center' },
  locChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  locChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  locChipText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 12, color: COLORS.textSecondary, maxWidth: 120 },
  infoBox: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.accent + '15', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, alignItems: 'flex-start' },
  infoBoxText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.accent, flex: 1 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  switchLabel: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary },
  switchSub: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary },
  dropOffOption: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceElevated, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  dropOffOptionActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accent + '15' },
  dropOffText: { flex: 1, fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary },
  submitBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.md },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  submitText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.md, color: 'white' },
});
