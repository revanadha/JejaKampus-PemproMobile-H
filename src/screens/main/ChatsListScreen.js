import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { dbHelpers } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';
dayjs.extend(relativeTime);
dayjs.locale('id');

export default function ChatsListScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadChats = async () => {
      try {
        const { data, error } = await dbHelpers.getChats(user.uid);
        if (error) throw error;
        setChats(data || []);
        setLoading(false);
      } catch (e) {
        console.error('Error loading chats:', e);
        setLoading(false);
      }
    };
    loadChats();
  }, [user]);

  const renderChat = ({ item }) => {
    const otherUserId = item.user1_id === user.uid ? item.user2_id : item.user1_id;
    const otherUserName = item.user2_name && item.user1_id === user.uid ? item.user2_name : item.user1_name || 'Pengguna';
    const lastTime = item.updated_at ? dayjs(item.updated_at).fromNow() : '';

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', {
          chatId: item.id,
          reportTitle: item.reportTitle,
          otherUserId,
          otherUserName,
        })}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={COLORS.textSecondary} />
        </View>
         <View style={styles.chatInfo}>
           <View style={styles.chatTop}>
             <Text style={styles.chatName}>{otherUserName}</Text>
             <Text style={styles.chatTime}>{lastTime}</Text>
           </View>
           <Text style={styles.reportTitle} numberOfLines={1}>Re: {item.report_title}</Text>
           <Text style={styles.lastMessage} numberOfLines={1}>
             {item.last_message || 'Belum ada pesan'}
           </Text>
         </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D1F35', COLORS.background]} style={styles.header}>
        <Text style={styles.title}>💬 Pesan</Text>
        <Text style={styles.subtitle}>Chat dengan pemilik atau penemu barang</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          renderItem={renderChat}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Belum ada percakapan</Text>
              <Text style={styles.emptySubtitle}>Percakapan akan muncul setelah klaim barang diverifikasi</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.base, paddingTop: 55, paddingBottom: SPACING.lg },
  title: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: TYPOGRAPHY.sizes.xl, color: COLORS.textPrimary },
  subtitle: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chatItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  chatInfo: { flex: 1 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  chatName: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary },
  chatTime: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 11, color: COLORS.textMuted },
  reportTitle: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 11, color: COLORS.primary, marginBottom: 2 },
  lastMessage: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING['2xl'] },
  emptyTitle: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.lg, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xs },
});
