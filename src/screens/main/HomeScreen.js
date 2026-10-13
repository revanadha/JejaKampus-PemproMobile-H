import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, RefreshControl, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase, USE_MOCK } from '../../config/supabase';
import { getReports } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, CATEGORIES } from '../../constants/theme';
import ReportCard from '../../components/ReportCard';
import FilterModal from '../../components/FilterModal';

const TYPE_TABS = [
  { id: 'all', label: 'Semua', icon: 'apps-outline' },
  { id: 'lost', label: 'Hilang', icon: 'search-outline' },
  { id: 'found', label: 'Ditemukan', icon: 'checkmark-circle-outline' },
];

export default function HomeScreen({ navigation }) {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeType, setActiveType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ location: null, dateRange: null });

  const fetchReports = async () => {
    // GET dengan access token otomatis dari reportService
    const { data, error } = await getReports({
      type: activeType !== 'all' ? activeType : undefined,
      category: selectedCategory || undefined,
      location_id: filters.location || undefined,
      limit: 50,
    });

    if (!error && data) {
      const mappedData = data.map(d => ({
        ...d,
        locationId: d.location_id,
        locationName: d.location_name,
        authorName: d.author_name,
        authorRole: d.author_role,
        createdAt: { toDate: () => new Date(d.created_at) },
        dropOffStatus: d.drop_off_status,
        dropOffLocationName: d.drop_off_location_name,
        hasDropOff: d.has_drop_off,
      }));
      setReports(mappedData);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (USE_MOCK) {
      setReports([
        { id: '1', type: 'lost', title: 'Dompet Kulit Hitam', description: 'Hilang sekitar jam 10 pagi di Kantin.', locationId: 'kantin_a', locationName: 'Kantin Pusat (A)', category: 'dompet', createdAt: { toDate: () => new Date() }, status: 'active', authorName: 'Budi', authorRole: 'mahasiswa' },
        { id: '2', type: 'found', title: 'Kunci Motor Honda', description: 'Ditemukan di bangku panjang parkiran barat.', locationId: 'parkir_barat', locationName: 'Area Parkir Barat', category: 'kunci', createdAt: { toDate: () => new Date(Date.now() - 3600000) }, status: 'active', authorName: 'Anonim', hasDropOff: true, dropOffStatus: 'received', dropOffLocationName: 'Pos Satpam Utama' }
      ]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    fetchReports();

    const channel = supabase.channel('public:reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
         fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeType, selectedCategory, filters]);

  const filtered = reports.filter(r =>
    !searchQuery || r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = () => { 
    setRefreshing(true); 
    fetchReports();
  };

  const renderHeader = () => (
    <View>
      {/* Greeting */}
      <LinearGradient colors={['#0D1F35', COLORS.background]} style={styles.topBg}>
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingText}>Halo, {userProfile?.display_name?.split(' ')[0] || 'Pengguna'} 👋</Text>
            <Text style={styles.greetingSubtext}>Ada barang yang hilang di kampus?</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari barang hilang atau ditemukan..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={() => setShowFilter(true)}>
            <Ionicons name="options-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard icon="alert-circle" color={COLORS.lost} label="Hilang" value={reports.filter(r => r.type === 'lost').length} />
        <StatCard icon="checkmark-circle" color={COLORS.found} label="Ditemukan" value={reports.filter(r => r.type === 'found').length} />
        <StatCard icon="shield-checkmark" color={COLORS.accent} label="Selesai" value={reports.filter(r => r.status === 'resolved').length} />
      </View>

      {/* Type Tabs */}
      <View style={styles.tabs}>
        {TYPE_TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeType === tab.id && styles.tabActive]}
            onPress={() => setActiveType(tab.id)}
          >
            <Ionicons name={tab.icon} size={16} color={activeType === tab.id ? 'white' : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeType === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingHorizontal: SPACING.base, gap: SPACING.sm }}>
        <TouchableOpacity
          style={[styles.catChip, !selectedCategory && styles.catChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.catChipText, !selectedCategory && styles.catChipTextActive]}>Semua</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, selectedCategory === cat.id && { backgroundColor: cat.color + '33', borderColor: cat.color }]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <Ionicons name={cat.icon} size={14} color={selectedCategory === cat.id ? cat.color : COLORS.textSecondary} />
            <Text style={[styles.catChipText, selectedCategory === cat.id && { color: cat.color }]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filters.location && (
        <View style={styles.activeFilter}>
          <Ionicons name="location" size={14} color={COLORS.primary} />
          <Text style={styles.activeFilterText}>Filter lokasi aktif</Text>
          <TouchableOpacity onPress={() => setFilters(f => ({ ...f, location: null }))}>
            <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.listTitle}>
        {filtered.length} Laporan {activeType !== 'all' ? (activeType === 'lost' ? 'Hilang' : 'Ditemukan') : ''}
      </Text>
    </View>
  );

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ReportCard report={item} onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })} />
        )}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="file-tray-outline" size={60} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Tidak ada laporan</Text>
            <Text style={styles.emptySubtitle}>Belum ada laporan yang sesuai filter.</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateReport')}
        activeOpacity={0.85}
      >
        <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.fabGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={setFilters}
        currentFilters={filters}
      />
    </View>
  );
}

const StatCard = ({ icon, color, label, value }) => (
  <View style={[styles.statCard, { borderColor: color + '40' }]}>
    <Ionicons name={icon} size={22} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  topBg: { paddingHorizontal: SPACING.base, paddingTop: 55, paddingBottom: SPACING.lg },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.base },
  greetingText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: TYPOGRAPHY.sizes.xl, color: COLORS.textPrimary },
  greetingSubtext: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  notifBtn: { width: 42, height: 42, borderRadius: 13, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.lost, borderWidth: 1.5, borderColor: COLORS.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 48, gap: SPACING.sm },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.base },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.base, gap: SPACING.sm, marginTop: SPACING.md, marginBottom: SPACING.sm },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center', paddingVertical: SPACING.md, gap: 4 },
  statValue: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: TYPOGRAPHY.sizes.xl },
  statLabel: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 10, color: COLORS.textSecondary },
  tabs: { flexDirection: 'row', paddingHorizontal: SPACING.base, gap: SPACING.sm, marginBottom: SPACING.sm },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary },
  tabTextActive: { color: 'white' },
  categoryScroll: { marginBottom: SPACING.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  catChipActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  catChipText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 12, color: COLORS.textSecondary },
  catChipTextActive: { color: COLORS.primary },
  activeFilter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: SPACING.base, marginBottom: SPACING.sm, backgroundColor: COLORS.primary + '15', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  activeFilterText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.primary, flex: 1 },
  listTitle: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textSecondary, paddingHorizontal: SPACING.base, marginBottom: SPACING.sm },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING['2xl'] },
  emptyTitle: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.lg, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xs },
  fab: { position: 'absolute', bottom: 90, right: SPACING.base, borderRadius: RADIUS.full, overflow: 'hidden' },
  fabGradient: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
});
