import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Animated, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';
dayjs.extend(relativeTime);
dayjs.locale('id');

// ─── Data Notifikasi Sesuai Desain Referensi ──────────────────────────────────
const DUMMY_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'match',
    icon: 'sparkles',
    iconColor: '#F59E0B',
    bgColor: '#FFFBEB',
    title: 'AI Match Ditemukan - 96%',
    body: 'Kabar baik! Kemungkinan kecocokan untuk AirPods Pro kamu ditemukan hanya berjarak 400m dari lokasi terakhir.',
    timeText: '2m lalu',
    time: dayjs().subtract(2, 'minute').toDate(),
    isRead: false,
  },
  {
    id: 'n2',
    type: 'chat',
    icon: 'chatbubble-ellipses',
    iconColor: '#8B5CF6',
    bgColor: '#F5F3FF',
    title: 'Priya Mengirimkan Pesan',
    body: 'Iya kak, barangnya masih aman di saya! Kapan dan di mana kira-kira kita bisa ketemuan?',
    timeText: '12m lalu',
    time: dayjs().subtract(12, 'minute').toDate(),
    isRead: false,
  },
  {
    id: 'n3',
    type: 'claim',
    icon: 'qr-code',
    iconColor: '#6366F1',
    bgColor: '#EEF2FF',
    title: 'QR Tag Barang Kamu Dipindai',
    body: 'QR Tag Tas Ransel kamu baru saja dipindai di dekat Perpustakaan Pusat. Ketuk untuk melihat posisi.',
    timeText: '1j lalu',
    time: dayjs().subtract(1, 'hour').toDate(),
    isRead: true,
  },
  {
    id: 'n4',
    type: 'reward',
    icon: 'gift',
    iconColor: '#D97706',
    bgColor: '#FEF3C7',
    title: 'Reward Diterima',
    body: 'Selamat! Kamu menerima apresiasi atas keberhasilan mengembalikan AirPods Pro ke pemiliknya.',
    timeText: '1h lalu',
    time: dayjs().subtract(1, 'day').toDate(),
    isRead: true,
  },
  {
    id: 'n5',
    type: 'security',
    icon: 'shield-checkmark',
    iconColor: '#EF4444',
    bgColor: '#FEF2F2',
    title: 'Peringatan Keamanan',
    body: 'Login perangkat baru terdeteksi pada akun Anda melalui Safari di macOS.',
    timeText: '2h lalu',
    time: dayjs().subtract(2, 'day').toDate(),
    isRead: true,
  },
];

// ─── Notification Item (Card berlatar putih dengan icon bulat tematik) ───────
function NotifCard({ item, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
        onPress={() => onPress(item)}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.9}
      >
        {/* Left Circular Icon Chip */}
        <View style={[styles.iconChip, { backgroundColor: item.bgColor }]}>
          <Ionicons name={item.icon} size={22} color={item.iconColor} />
        </View>

        {/* Content Column */}
        <View style={styles.contentWrap}>
          <View style={styles.topRow}>
            <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleBold]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardTime}>{item.timeText || dayjs(item.time).fromNow()}</Text>
          </View>
          <Text style={styles.cardBody} numberOfLines={3}>
            {item.body}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Notifications Screen ───────────────────────────────────────────────────
export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handlePress = (item) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    if (item.type === 'chat') {
      navigation.navigate('Chats');
    }
  };

  const handleQrPress = () => {
    Alert.alert('Scanner QR Tag', 'Fitur pemindai QR Tag JejaKampus untuk cek barang temuan.');
  };

  return (
    <View style={styles.container}>
      {/* Reference Screen 2 Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <TouchableOpacity
          style={styles.circleBtn}
          onPress={handleQrPress}
          activeOpacity={0.7}
        >
          <Ionicons name="qr-code-outline" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Unread banner / Mark read action */}
      {unreadCount > 0 && (
        <View style={styles.unreadActionRow}>
          <Text style={styles.unreadCountBadge}>{unreadCount} Belum Dibaca</Text>
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={styles.markReadText}>Tandai semua dibaca</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications Cards Feed */}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotifCard item={item} onPress={handlePress} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={40} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Tidak ada notifikasi</Text>
            <Text style={styles.emptySub}>Notifikasi aktivitas terbaru akan muncul di sini</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 16,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  unreadActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  unreadCountBadge: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  markReadText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 4,
  },
  notifCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDEFF3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  notifCardUnread: {
    borderColor: '#F59E0B40',
    backgroundColor: '#FFFFFF',
  },
  iconChip: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contentWrap: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  cardTitleBold: {
    color: '#18181B',
  },
  cardTime: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: '#A1A1AA',
    flexShrink: 0,
  },
  cardBody: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 13,
    color: '#71717A',
    lineHeight: 18,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
