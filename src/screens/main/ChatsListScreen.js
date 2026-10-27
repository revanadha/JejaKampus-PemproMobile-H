import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';
dayjs.extend(relativeTime);
dayjs.locale('id');

// ─── Avatar Component ────────────────────────────────────────────────────────
function Avatar({ initial, color, isOnline, size = 48 }) {
  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={[color, color + 'AA']}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initial}</Text>
      </LinearGradient>
      {isOnline && <View style={styles.onlineDot} />}
    </View>
  );
}

// ─── Chat Item Component ─────────────────────────────────────────────────────
function ChatItem({ item, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const lastTime = item.lastMessageTime
    ? dayjs(item.lastMessageTime).fromNow()
    : '';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.chatItem, item.unreadCount > 0 && styles.chatItemUnread]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Avatar
          initial={item.otherUserInitial}
          color={item.avatarColor}
          isOnline={item.isOnline}
        />

        <View style={styles.chatInfo}>
          <View style={styles.chatTop}>
            <Text style={[styles.chatName, item.unreadCount > 0 && styles.chatNameBold]}>
              {item.otherUserName}
            </Text>
            <Text style={styles.chatTime}>{lastTime}</Text>
          </View>

          <View style={styles.chatTagRow}>
            <View style={[
              styles.typeTag,
              { backgroundColor: item.type === 'found' ? COLORS.found + '20' : COLORS.lost + '20' },
            ]}>
              <Ionicons
                name={item.type === 'found' ? 'search-circle' : 'alert-circle'}
                size={10}
                color={item.type === 'found' ? COLORS.found : COLORS.lost}
              />
              <Text style={[
                styles.typeTagText,
                { color: item.type === 'found' ? COLORS.found : COLORS.lost },
              ]}>
                {item.reportTitle}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.lastMessage, item.unreadCount > 0 && styles.lastMessageBold]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>

        {item.unreadCount > 0 ? (
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            style={styles.badge}
          >
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </LinearGradient>
        ) : (
          <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ChatsListScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchChats = async () => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }
    
    // In PostgreSQL/Supabase we can query array contains with contains
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participants', [user.id])
      .order('last_message_time', { ascending: false });
      
    if (!error && data) {
      const mappedChats = data.map(d => {
        const otherUserId = d.participants?.find(p => p !== user.id);
        const otherUserName = d.participant_names?.[otherUserId] || 'Pengguna';
        const initial = otherUserName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        return {
          id: d.id,
          otherUserId,
          otherUserName,
          otherUserInitial: initial,
          avatarColor: COLORS.primary,
          reportTitle: d.report_title || 'Laporan',
          lastMessage: d.last_message || 'Belum ada pesan',
          lastMessageTime: d.last_message_time ? new Date(d.last_message_time) : new Date(d.created_at),
          unreadCount: 0,
          isOnline: false,
          type: 'found', // Or fetch from related report if needed
        };
      });
      setChats(mappedChats);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChats();
    
    if (user) {
      const channel = supabase.channel('public:chats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
           fetchChats();
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const filtered = chats.filter(c =>
    c.otherUserName.toLowerCase().includes(search.toLowerCase()) ||
    c.reportTitle.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0D1F35', COLORS.background]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Pesan</Text>
            <Text style={styles.subtitle}>
              {totalUnread > 0 ? `${totalUnread} pesan belum dibaca` : 'Semua pesan terbaca'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              Alert.alert(
                'Mulai Chat Baru 💬',
                'Untuk mulai chat dengan pemilik atau penemu barang, buka detail laporan barang di Beranda lalu tekan tombol Chat.',
                [
                  { text: 'Lihat Beranda', onPress: () => navigation.navigate('Home') },
                  { text: 'Tutup', style: 'cancel' },
                ]
              );
            }}
          >
            <Ionicons name="create-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari percakapan..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ChatItem
              item={item}
              onPress={() => navigation.navigate('Chat', {
                chatId: item.id,
                reportTitle: item.reportTitle,
                otherUserId: item.otherUserId || item.id,
                otherUserName: item.otherUserName,
              })}
            />
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <LinearGradient
                colors={[COLORS.primary + '20', COLORS.accent + '10']}
                style={styles.emptyIcon}
              >
                <Ionicons name="chatbubbles-outline" size={44} color={COLORS.primary} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>Belum ada percakapan</Text>
              <Text style={styles.emptySubtitle}>
                Percakapan muncul saat ada yang mengklaim atau merespons laporanmu
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: 55,
    paddingBottom: SPACING.base,
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
  headerBtn: {
    width: 40, height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.base,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 76 },

  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  chatItemUnread: {
    backgroundColor: COLORS.primary + '08',
  },

  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1, right: 1,
    width: 12, height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.found,
    borderWidth: 2,
    borderColor: COLORS.background,
  },

  chatInfo: { flex: 1 },
  chatTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  chatName: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  chatNameBold: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  chatTime: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted,
  },

  chatTagRow: { marginBottom: 3 },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  typeTagText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 10,
    maxWidth: 200,
  },

  lastMessage: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  lastMessageBold: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: COLORS.textPrimary,
  },

  badge: {
    minWidth: 22, height: 22,
    borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 11,
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
