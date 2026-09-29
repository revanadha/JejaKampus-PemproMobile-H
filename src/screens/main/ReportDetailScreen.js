import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  doc, getDoc, updateDoc, arrayUnion, serverTimestamp, addDoc, collection,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, CATEGORIES, CAMPUS_LOCATIONS } from '../../constants/theme';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
dayjs.locale('id');

export default function ReportDetailScreen({ route, navigation }) {
  const { reportId } = route.params;
  const { user, userProfile } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimAnswer, setClaimAnswer] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const docRef = doc(db, 'reports', reportId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setReport({ id: docSnap.id, ...docSnap.data() });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleClaim = async () => {
    if (!claimAnswer.trim()) { Alert.alert('Jawaban diperlukan'); return; }
    setClaimLoading(true);
    try {
      const isCorrect = claimAnswer.trim().toLowerCase() === report.verificationAnswer;
      if (!isCorrect) {
        Alert.alert('Jawaban Salah ❌', 'Jawaban verifikasi tidak sesuai. Coba lagi.');
        setClaimLoading(false);
        return;
      }
      // Create chat room & notify
      const chatRef = await addDoc(collection(db, 'chats'), {
        reportId,
        reportTitle: report.title,
        participants: [user.uid, report.authorId],
        participantNames: {
          [user.uid]: userProfile?.displayName || 'Anonim',
          [report.authorId]: report.authorName,
        },
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
      });
      await updateDoc(doc(db, 'reports', reportId), {
        claimRequests: arrayUnion({ userId: user.uid, userName: userProfile?.displayName, chatId: chatRef.id, timestamp: new Date().toISOString() }),
        status: 'claimed',
      });
      setShowClaimModal(false);
      Alert.alert('Berhasil! ✅', 'Verifikasi berhasil. Anda bisa mulai chat dengan penemu.', [
        { text: 'Buka Chat', onPress: () => navigation.navigate('Chat', { chatId: chatRef.id, reportTitle: report.title, otherUserId: report.authorId, otherUserName: report.authorName }) }
      ]);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setClaimLoading(false); }
  };

  const openChat = async () => {
    // For report owner: find existing chat or create new
    const existingClaim = report.claimRequests?.[0];
    if (existingClaim?.chatId) {
      navigation.navigate('Chat', {
        chatId: existingClaim.chatId,
        reportTitle: report.title,
        otherUserId: existingClaim.userId,
        otherUserName: existingClaim.userName,
      });
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!report) return <View style={styles.center}><Text style={styles.errorText}>Laporan tidak ditemukan</Text></View>;

  const category = CATEGORIES.find(c => c.id === report.category);
  const location = CAMPUS_LOCATIONS.find(l => l.id === report.locationId);
  const dropOffLocation = CAMPUS_LOCATIONS.find(l => l.id === report.dropOffLocationId);
  const isOwner = user?.uid === report.authorId;
  const isClaimed = report.claimRequests?.some(c => c.userId === user?.uid);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {report.images?.length > 0 ? (
            <>
              <Image source={{ uri: report.images[activeImage] }} style={styles.mainImage} resizeMode="cover" />
              {report.images.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
                  {report.images.map((img, i) => (
                    <TouchableOpacity key={i} onPress={() => setActiveImage(i)}>
                      <Image source={{ uri: img }} style={[styles.thumbImg, activeImage === i && styles.thumbActive]} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.noImage}>
              <Ionicons name={category?.icon || 'image-outline'} size={60} color={COLORS.textMuted} />
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <View style={[styles.typeBadge, { backgroundColor: report.type === 'lost' ? COLORS.lost : COLORS.found }]}>
            <Ionicons name={report.type === 'lost' ? 'search-outline' : 'checkmark-circle-outline'} size={14} color="white" />
            <Text style={styles.typeBadgeText}>{report.type === 'lost' ? 'HILANG' : 'DITEMUKAN'}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Title & Status */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{report.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: report.status === 'resolved' ? COLORS.found + '30' : COLORS.pending + '30' }]}>
              <Text style={[styles.statusText, { color: report.status === 'resolved' ? COLORS.found : COLORS.pending }]}>
                {report.status === 'active' ? 'Aktif' : report.status === 'claimed' ? 'Diklaim' : 'Selesai'}
              </Text>
            </View>
          </View>

          {/* Meta info */}
          <View style={styles.metaGrid}>
            <MetaItem icon="location-outline" label="Lokasi" value={location?.name || report.locationName || '-'} color={COLORS.primary} />
            <MetaItem icon={category?.icon || 'help-outline'} label="Kategori" value={category?.name || '-'} color={category?.color || COLORS.textSecondary} />
            {report.color && <MetaItem icon="color-palette-outline" label="Warna" value={report.color} color={COLORS.accent} />}
            {report.brand && <MetaItem icon="pricetag-outline" label="Merek" value={report.brand} color={COLORS.accent} />}
            <MetaItem icon="time-outline" label="Dilaporkan" value={report.createdAt ? dayjs(report.createdAt.toDate()).format('D MMM YYYY, HH:mm') : '-'} color={COLORS.textSecondary} />
          </View>

          {/* Description */}
          {report.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Deskripsi</Text>
              <Text style={styles.description}>{report.description}</Text>
            </View>
          ) : null}

          {/* Drop-off info */}
          {report.hasDropOff && (
            <View style={styles.dropOffCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm }}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.accent} />
                <Text style={styles.dropOffTitle}>Barang di Pos Satpam</Text>
                <View style={[styles.dropOffStatusBadge, {
                  backgroundColor: report.dropOffStatus === 'confirmed' ? COLORS.found + '30' : COLORS.pending + '30'
                }]}>
                  <Text style={[styles.dropOffStatusText, { color: report.dropOffStatus === 'confirmed' ? COLORS.found : COLORS.pending }]}>
                    {report.dropOffStatus === 'confirmed' ? 'Dikonfirmasi' : report.dropOffStatus === 'received' ? 'Sudah Diterima' : 'Menunggu'}
                  </Text>
                </View>
              </View>
              <Text style={styles.dropOffLocation}>📍 {dropOffLocation?.name || report.dropOffLocationName}</Text>
              <Text style={styles.dropOffHint}>Tunjukkan laporan ini ke petugas untuk mengambil barang.</Text>
            </View>
          )}

          {/* Verification section (for found items) */}
          {report.type === 'found' && (
            <View style={styles.verifySection}>
              <Ionicons name="shield-outline" size={18} color={COLORS.accent} />
              <Text style={styles.verifySectionTitle}>Verifikasi Kepemilikan Diperlukan</Text>
              <Text style={styles.verifySectionText}>
                Untuk klaim barang ini, Anda perlu menjawab pertanyaan verifikasi dari penemu.
              </Text>
            </View>
          )}

          {/* Author */}
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Ionicons name="person" size={20} color={COLORS.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>{report.authorName || 'Anonim'}</Text>
              <Text style={styles.authorRole}>{report.authorRole || 'Pengguna'} · UMM</Text>
            </View>
            <View style={styles.reportBadge}>
              <Ionicons name="flag-outline" size={16} color={COLORS.textMuted} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      {!isOwner && report.type === 'found' && report.status !== 'resolved' && (
        <View style={styles.bottomBar}>
          {isClaimed ? (
            <TouchableOpacity style={styles.chatBtn} onPress={openChat}>
              <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="chatbubbles" size={20} color="white" />
                <Text style={styles.actionText}>Buka Chat</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.claimBtn} onPress={() => setShowClaimModal(true)}>
              <LinearGradient colors={[COLORS.found, COLORS.accent]} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="hand-right" size={20} color="white" />
                <Text style={styles.actionText}>Klaim Barang Ini</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isOwner && report.claimRequests?.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.chatBtn} onPress={openChat}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="chatbubbles" size={20} color="white" />
              <Text style={styles.actionText}>Ada {report.claimRequests.length} Klaim — Buka Chat</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Claim / Verification Modal */}
      <Modal visible={showClaimModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>🔐 Verifikasi Kepemilikan</Text>
            <Text style={styles.modalSubtitle}>Jawab pertanyaan dari penemu untuk mengklaim barang ini.</Text>
            <View style={styles.questionBox}>
              <Ionicons name="help-circle" size={18} color={COLORS.primary} />
              <Text style={styles.questionText}>{report.verificationQuestion}</Text>
            </View>
            <TextInput
              style={styles.answerInput}
              placeholder="Ketik jawaban Anda..."
              placeholderTextColor={COLORS.textMuted}
              value={claimAnswer}
              onChangeText={setClaimAnswer}
            />
            <TouchableOpacity
              style={styles.submitClaimBtn}
              onPress={handleClaim}
              disabled={claimLoading}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {claimLoading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.actionText}>Kirim Jawaban</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowClaimModal(false)}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const MetaItem = ({ icon, label, value, color }) => (
  <View style={styles.metaItem}>
    <Ionicons name={icon} size={16} color={color} />
    <View>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  imageContainer: { position: 'relative' },
  mainImage: { width: '100%', height: 280, backgroundColor: COLORS.surfaceElevated },
  noImage: { height: 200, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  thumbRow: { position: 'absolute', bottom: 8, left: 0, right: 0 },
  thumbImg: { width: 50, height: 50, borderRadius: RADIUS.sm, marginLeft: SPACING.sm, opacity: 0.7, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { opacity: 1, borderColor: 'white' },
  backBtn: { position: 'absolute', top: 50, left: SPACING.base, width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  typeBadge: { position: 'absolute', top: 50, right: SPACING.base, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full },
  typeBadgeText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 11, color: 'white', letterSpacing: 0.5 },
  content: { padding: SPACING.base },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.md },
  title: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: TYPOGRAPHY.sizes.xl, color: COLORS.textPrimary, flex: 1, marginRight: SPACING.sm },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: 11 },
  metaGrid: { gap: SPACING.sm, marginBottom: SPACING.base },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  metaLabel: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 11, color: COLORS.textMuted },
  metaValue: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textPrimary },
  section: { marginBottom: SPACING.base },
  sectionTitle: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  description: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textSecondary, lineHeight: 22 },
  dropOffCard: { backgroundColor: COLORS.accent + '15', borderRadius: RADIUS.lg, padding: SPACING.base, marginBottom: SPACING.base, borderWidth: 1, borderColor: COLORS.accent + '40' },
  dropOffTitle: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.accent, flex: 1 },
  dropOffStatusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  dropOffStatusText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: 10 },
  dropOffLocation: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  dropOffHint: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textMuted },
  verifySection: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, backgroundColor: COLORS.primary + '15', borderRadius: RADIUS.lg, padding: SPACING.base, marginBottom: SPACING.base, borderWidth: 1, borderColor: COLORS.primary + '40' },
  verifySectionTitle: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.primary },
  verifySectionText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, width: '100%' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  authorAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  authorName: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary },
  authorRole: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  reportBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: COLORS.textSecondary },
  bottomBar: { padding: SPACING.base, paddingBottom: 30, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  chatBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  claimBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  actionText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.md, color: 'white' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], padding: SPACING.xl, paddingBottom: 40, borderWidth: 1, borderColor: COLORS.border },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: TYPOGRAPHY.sizes.xl, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  modalSubtitle: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  questionBox: { flexDirection: 'row', gap: SPACING.sm, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  questionText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary, flex: 1 },
  answerInput: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 50, color: COLORS.textPrimary, fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.base, marginBottom: SPACING.md },
  submitClaimBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.sm },
  cancelBtn: { alignItems: 'center', paddingVertical: SPACING.md },
  cancelText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textSecondary },
});
