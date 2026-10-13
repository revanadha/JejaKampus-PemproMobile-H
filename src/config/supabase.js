import { createClient } from '@supabase/supabase-js';

// Buat project gratis di https://supabase.com
// Ambil URL dan anon key dari Project Settings > API
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fungsi helper untuk operasi database
export const dbHelpers = {
  // Users
  async getUser(uid) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .single();
    return { data, error };
  },

  async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData]);
    return { data, error };
  },

  async updateUser(uid, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('uid', uid);
    return { data, error };
  },

  // Reports
  async getReports(filters = {}) {
    let query = supabase.from('reports').select('*');
    
    if (filters.authorId) {
      query = query.eq('author_id', filters.authorId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  async getReport(id) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async createReport(reportData) {
    const { data, error } = await supabase
      .from('reports')
      .insert([reportData]);
    return { data, error };
  },

  async updateReport(id, updates) {
    const { data, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id);
    return { data, error };
  },

  // Chats
  async getChats(userId) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
    return { data, error };
  },

  async getOrCreateChat(user1Id, user2Id) {
    // Cek chat sudah ada
    const { data: existing } = await supabase
      .from('chats')
      .select('*')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
      .single();

    if (existing) return { data: existing, error: null };

    // Buat chat baru
    const { data, error } = await supabase
      .from('chats')
      .insert([{ user1_id: user1Id, user2_id: user2Id }])
      .select()
      .single();
    return { data, error };
  },

  async getMessages(chatId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  async createMessage(messageData) {
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData]);
    return { data, error };
  },

  // Storage
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    return { data, error };
  },

  async getPublicUrl(bucket, path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl;
  },

  // Real-time subscriptions
  onReportsChange(callback) {
    return supabase
      .channel('reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, callback)
      .subscribe();
  },

  onMessagesChange(chatId, callback) {
    return supabase
      .channel(`messages:${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, callback)
      .subscribe();
  },
};
