import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import dayjs from 'dayjs';

export default function ChatScreen({ route, navigation }) {
  const { chatId, reportTitle, otherUserName, otherUserId } = route.params;
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const flatListRef = useRef(null);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setMessages(data.map(d => ({
        id: d.id,
        text: d.text,
        senderId: d.sender_id,
        senderName: d.sender_name,
        isAnonymous: d.is_anonymous,
        createdAt: new Date(d.created_at)
      })));
    }
    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase.channel(`public:messages:${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, () => {
         fetchMessages();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    try {
      const msgData = {
        chat_id: chatId,
        text,
        sender_id: user.id,
        sender_name: isAnonymous ? 'Anonim' : userProfile?.display_name,
        is_anonymous: isAnonymous,
        type: 'text',
      };
      
      const { error: insertError } = await supabase.from('messages').insert([msgData]);
      if (insertError) throw insertError;
      
      await supabase.from('chats').update({
        last_message: text,
        last_message_time: new Date().toISOString()
      }).eq('id', chatId);
      
    } catch (e) { console.error('Send message error:', e); }
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.senderId === user.id;
    const showDate = index === 0 || !dayjs(messages[index - 1]?.createdAt).isSame(dayjs(item.createdAt), 'day');

    return (
      <View>
        {showDate && (
          <Text style={styles.dateDivider}>
            {dayjs(item.createdAt).format('D MMMM YYYY')}
          </Text>
        )}
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {!isMe && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.text}</Text>
          <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
            {item.createdAt ? dayjs(item.createdAt).format('HH:mm') : '...'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0D1F35', COLORS.background]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color={COLORS.textSecondary} />
          </View>
          <View>
            <Text style={styles.headerName}>{otherUserName}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>Re: {reportTitle}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={50} color={COLORS.textMuted} />
              <Text style={styles.emptyChatText}>Belum ada pesan</Text>
              <Text style={styles.emptyChatSubtext}>Mulai percakapan untuk koordinasi pengembalian barang</Text>
            </View>
          }
        />
      )}

      {/* Input Bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.anonBtn, isAnonymous && styles.anonBtnActive]}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <Ionicons
              name={isAnonymous ? 'eye-off' : 'eye'}
              size={18}
              color={isAnonymous ? COLORS.primary : COLORS.textMuted}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={isAnonymous ? "Pesan anonim..." : "Ketik pesan..."}
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <LinearGradient
              colors={inputText.trim() ? [COLORS.primary, COLORS.accent] : [COLORS.surfaceElevated, COLORS.surfaceElevated]}
              style={styles.sendGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="send" size={18} color={inputText.trim() ? 'white' : COLORS.textMuted} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.base, paddingTop: 55, paddingBottom: SPACING.md, gap: SPACING.md },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  headerName: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary },
  headerSub: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, maxWidth: 200 },
  menuBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { padding: SPACING.base, paddingBottom: 10 },
  messageBubble: { maxWidth: '80%', marginBottom: SPACING.sm, padding: SPACING.md, borderRadius: 18 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  senderName: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: 11, color: COLORS.accent, marginBottom: 4 },
  messageText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textSecondary },
  myMessageText: { color: 'white' },
  messageTime: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 10, color: COLORS.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },
  dateDivider: { textAlign: 'center', fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 11, color: COLORS.textMuted, marginVertical: SPACING.md, backgroundColor: COLORS.surfaceElevated, alignSelf: 'center', paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.full },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyChatText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.lg, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptyChatSubtext: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xs, paddingHorizontal: SPACING['2xl'] },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: SPACING.md, paddingBottom: 30, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm },
  anonBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  anonBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '20' },
  input: { flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.textPrimary, fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.base, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 12, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.5 },
  sendGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
