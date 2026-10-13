import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zklprhlbxjlvrtvucyyx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprbHByaGxieGpsdnJ0dnVjeXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjYyNjgsImV4cCI6MjEwNjg0MjI2OH0.8bd5GpfCk3aVYq6Bq3HIs8xWwEswVJPlU4pD0yd4HHI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const USE_MOCK = false;
