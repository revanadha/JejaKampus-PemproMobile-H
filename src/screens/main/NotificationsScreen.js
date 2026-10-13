import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';
dayjs.extend(relativeTime);
dayjs.locale('id');

// ─── Data Dummy Notifikasi ───────────────────────────────────────────────────
const DUMMY_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'match',
    icon: 'checkmark-circle',
    iconColor: COLORS.found,
    bgColor: COLORS.found + '20',
    title: 'Barang Kamu Ditemukan! 🎉',
    body: 'Ahmad Fauzi melaporkan menemukan Dompet Hitam yang mungkin milikmu di GKB 2. Segera cek dan verifikasi.',
    time: dayjs().subtract(10, 'minute').toDate(),
    isRead: false,
    action: 'Lihat Detail',
  },
  {
    id: 'n2',
    type: 'chat',
    icon: 'chatbubble-ellipses',
    iconColor: COLORS.primary,
    bgColor: COLORS.primary + '20',
    title: 'Pesan Baru dari Siti Rahma',
    body: 'Iya kak, nanti saya cek dulu ya spesifikasinya. Bisa foto serialnya?',
    time: dayjs().subtract(1, 'hour').toDate(),
    isRead: false,
    action: 'Balas',
  },
  {
    id: 'n3',
    type: 'status',
    icon: 'refresh-circle',
    iconColor: COLORS.pending,
    bgColor: COLORS.pending + '20',
    title: 'Status Laporan Diperbarui',
    body: 'Laporan "Kunci Motor Honda Beat" kamu telah diverifikasi oleh admin dan sedang diproses.',
    time: dayjs().subtract(3, 'hour').toDate(),
    isRead: true,
    action: null,
  },
  {
    id: 'n4',
    type: 'claim',
    icon: 'hand-left',
    iconColor: COLORS.accent,
    bgColor: COLORS.accent + '20',
    title: 'Klaim Baru pada Laporanmu',
    body: 'Budi Santoso mengklaim bahwa "Earphone Sony Warna Putih" yang kamu laporkan adalah miliknya.',
    time: dayjs().subtract(5, 'hour').toDate(),
    isRead: true,
    action: 'Verifikasi',
  },
  {
    id: 'n5',
    type: 'match',
    icon: 'sparkles',
    iconColor: '#FF9F0A',
    bgColor: '#FF9F0A20',
    title: 'Potensi Kecocokan Ditemukan',
    body: 'Sistem menemukan laporan yang mungkin cocok dengan "Laptop Asus Warna Abu" yang kamu laporkan hilang.',
    time: dayjs().subtract(1, 'day').toDate(),
    isRead: true,
    action: 'Cek Sekarang',
  },
  {
    id: 'n6',
    type: 'info',
    icon: 'information-circle',
    iconColor: COLORS.textSecondary,
    bgColor: COLORS.surfaceElevated,
    title: 'Tips Keamanan Barang di Kampus',
    body: 'Jangan lupa selalu simpan KTM dan dompet di tempat aman. Laporan kehilangan di area kantin meningkat minggu ini.',
    time: dayjs().subtract(2, 'day').toDate(),
    isRead: true,
    action: null,
  },
  {
    id: 'n7',
    type: 'resolved',
    icon: 'trophy',
    iconColor: '#FFD60A',
    bgColor: '#FFD60A20',
    title: 'Laporan Berhasil Diselesaikan! 🏆',
    body: 'Laporan "KTM Hilang Area Kantin" telah ditandai selesai. Terima kasih telah menggunakan JejaKampus!',
    time: dayjs().subtract(3, 'day').toDate(),
    isRead: true,
    action: null,
  },
];

// ─── Filter Tabs ─────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'unread', label: 'Belum Dibaca' },
  { key: 'match', label: 'Kecocokan' },
  { key: 'chat', label: 'Pesan' },
  { key: 'claim', label: 'Klaim' },
];

// ─── Notification Item ───────────────────────────────────────────────────────
function NotifItem({ item, onPress, onMarkRead }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.notifItem, !item.isRead && styles.notifItemUnread]}
        onPress={() => onPress(item)}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
      >
        {/* Unread indicator */}
        {!item.isRead && <View style={styles.unreadDot} />}

        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: item.bgColor }]}>
          <Ionicons name={item.icon} size={24} color={item.iconColor} />
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
              {item.title}
            </Text>
            <Text style={styles.notifTime}>{dayjs(item.time).fromNow()}</Text>
          </View>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          {item.action && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onPress(item)}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                style={styles.actionBtnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.actionBtnText}>{item.action}</Text>
                <Ionicons name="arrow-forward" size={12} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filtered = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.isRead;
    return n.type === activeFilter;
  });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handlePress = (item) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    // TODO: navigate ke layar yang sesuai berdasarkan tipe notifikasi
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0D1F35', COLORS.background]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Notifikasi</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0 ? `${unreadCount} notifikasi baru` : 'Semua sudah dibaca'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
              <Ionicons name="checkmark-done-outline" size={14} color={COLORS.primary} />
              <Text style={styles.markAllText}>Baca Semua</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={f => f.key}
          contentContainerStyle={{ gap: SPACING.sm }}
          renderItem={({ item: filter }) => {
            const isActive = activeFilter === filter.key;
            return (
              <TouchableOpacity
                onPress={() => setActiveFilter(filter.key)}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.accent]}
                    style={styles.filterTabGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Text style={[styles.filterTabText, styles.filterTabTextActive]}>
                      {filter.label}
                    </Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.filterTabText}>{filter.label}</Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </LinearGradient>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotifItem item={item} onPress={handlePress} />
        )}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: SPACING.sm }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient
              colors={[COLORS.primary + '20', COLORS.accent + '10']}
              style={styles.emptyIcon}
            >
              <Ionicons name="notifications-off-outline" size={44} color={COLORS.primary} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Tidak ada notifikasi</Text>
            <Text style={styles.emptySubtitle}>
              Notifikasi akan muncul saat ada aktivitas pada laporanmu
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: 55,
    paddingBottom: SPACING.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary + '15',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  markAllText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
  },

  filterTab: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
  },
  filterTabActive: {
    borderColor: 'transparent',
  },
  filterTabGradient: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
  },
  filterTabText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
  },
  filterTabTextActive: {
    color: 'white',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.base + 52 + SPACING.md,
  },

  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    position: 'relative',
  },
  notifItemUnread: {
    backgroundColor: COLORS.primary + '06',
  },
  unreadDot: {
    position: 'absolute',
    left: 6,
    top: '50%',
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    transform: [{ translateY: -3 }],
  },

  iconWrap: {
    width: 52, height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  notifContent: { flex: 1 },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  notifTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  notifTitleUnread: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: COLORS.textPrimary,
  },
  notifTime: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
    flexShrink: 0,
  },
  notifBody: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },

  actionBtn: { alignSelf: 'flex-start', borderRadius: RADIUS.md, overflow: 'hidden' },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  actionBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: 'white',
  },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: SPACING['2xl'],
  },
  emptyIcon: {
    width: 88, height: 88,
    borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
