import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, CATEGORIES, CAMPUS_LOCATIONS } from '../../constants/theme';
import { getReportById, updateReportStatus } from '../../services/reportService';
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
  const [chatLoading, setChatLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      // GET dengan access token otomatis dari reportService
      const { data, error } = await getReportById(reportId);
        
      if (!error && data) {
        setReport({
          ...data,
          locationId: data.location_id,
          locationName: data.location_name,
          authorId: data.author_id,
          authorName: data.author_name,
          authorRole: data.author_role,
          verificationAnswer: data.verification_answer,
          verificationQuestion: data.verification_question,
          dropOffLocationId: data.drop_off_location_id,
          dropOffLocationName: data.drop_off_location_name,
          dropOffStatus: data.drop_off_status,
          hasDropOff: data.has_drop_off,
          claimRequests: data.claim_requests || [],
          createdAt: { toDate: () => new Date(data.created_at) }
        });
      }
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
      
      // Create chat room
      const { data: chatData, error: chatError } = await supabase.from('chats').insert([{
        report_id: reportId,
        report_title: report.title,
        participants: [user.id, report.authorId],
        participant_names: {
          [user.id]: userProfile?.display_name || 'Anonim',
          [report.authorId]: report.authorName,
        },
        last_message: '',
      }]).select().single();
      
      if (chatError) throw chatError;

      // Update report claimRequests
      const newClaim = { userId: user.id, userName: userProfile?.display_name, chatId: chatData.id, timestamp: new Date().toISOString() };
      const updatedClaims = [...(report.claimRequests || []), newClaim];
      
      // PUT dengan access token otomatis dari reportService
      const { error: updateError } = await updateReportStatus(reportId, 'claimed');
        
      if (updateError) throw new Error(updateError.message);
        
      setShowClaimModal(false);
      Alert.alert('Berhasil! ✅', 'Verifikasi berhasil. Anda bisa mulai chat dengan penemu.', [
        { text: 'Buka Chat', onPress: () => navigation.navigate('Chat', { chatId: chatData.id, reportTitle: report.title, otherUserId: report.authorId, otherUserName: report.authorName }) }
      ]);
      fetchReport(); // reload
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setClaimLoading(false); }
  };

  const openChat = async () => {
    const existingClaim = report.claimRequests?.[0];
    if (existingClaim?.chatId) {
      navigation.navigate('Chat', {
        chatId: existingClaim.chatId,
        reportTitle: report.title,
        otherUserId: existingClaim.userId,
        otherUserName: existingClaim.userName,
      });
    } else {
      openDirectChat();
    }
  };

  const openDirectChat = async () => {
    if (!user) {
      Alert.alert('Perhatian', 'Silakan login terlebih dahulu untuk mengirim pesan.');
      return;
    }
    if (isOwner) {
      Alert.alert('Info', 'Ini adalah laporan milik Anda sendiri.');
      return;
    }
    setChatLoading(true);
    try {
      // 1. Cek apakah percakapan antara user dan author untuk laporan ini sudah ada
      const { data: existingChat, error: findError } = await supabase
        .from('chats')
        .select('*')
        .contains('participants', [user.id, report.authorId])
        .eq('report_id', reportId)
        .maybeSingle();

      if (existingChat) {
        navigation.navigate('Chat', {
          chatId: existingChat.id,
          reportTitle: report.title,
          otherUserId: report.authorId,
          otherUserName: report.authorName || 'Pengguna',
        });
        return;
      }

      // 2. Jika belum ada, buat chat room baru di Supabase
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert([{
          report_id: reportId,
          report_title: report.title,
          participants: [user.id, report.authorId],
          participant_names: {
            [user.id]: userProfile?.display_name || 'Pengguna',
            [report.authorId]: report.authorName || 'Pengguna',
          },
          last_message: '',
          last_message_time: new Date().toISOString(),
        }])
        .select()
        .single();

      if (createError) throw createError;

      navigation.navigate('Chat', {
        chatId: newChat.id,
        reportTitle: report.title,
        otherUserId: report.authorId,
        otherUserName: report.authorName || 'Pengguna',
      });
    } catch (err) {
      console.error('[openDirectChat] Error:', err);
      Alert.alert('Gagal Membuka Chat', err.message || 'Terjadi kesalahan saat memulai chat.');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!report) return <View style={styles.center}><Text style={styles.errorText}>Laporan tidak ditemukan</Text></View>;

  const category = CATEGORIES.find(c => c.id === report.category);
  const location = CAMPUS_LOCATIONS.find(l => l.id === report.locationId);
  const dropOffLocation = CAMPUS_LOCATIONS.find(l => l.id === report.dropOffLocationId);
  const isOwner = user?.id === report.authorId;
  const isClaimed = report.claimRequests?.some(c => c.userId === user?.id);

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
            {!isOwner && (
              <TouchableOpacity
                style={styles.directChatBtn}
                onPress={openDirectChat}
                disabled={chatLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primary} />
                <Text style={styles.directChatText}>Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Tombol Chat untuk Barang Hilang (Lost Item) */}
      {!isOwner && report.type === 'lost' && report.status !== 'resolved' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.chatBtn} onPress={openDirectChat} disabled={chatLoading} activeOpacity={0.85}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {chatLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="chatbubbles" size={20} color="white" />
                  <Text style={styles.actionText}>Hubungi Pemilik / Chat</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

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
  directChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
  },
  directChatText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
  },
});
