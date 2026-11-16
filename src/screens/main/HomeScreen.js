import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, RefreshControl, ScrollView,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase, USE_MOCK } from '../../config/supabase';
import { getReports } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, CATEGORIES, SHADOWS } from '../../constants/theme';
import ReportCard from '../../components/ReportCard';
import FilterModal from '../../components/FilterModal';

export default function HomeScreen({ navigation }) {
  const { userProfile } = useAuth();
  const { isOnline } = useNetwork();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [activeType, setActiveType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ location: null, dateRange: null });

  const fetchReports = async () => {
    setFetchError(null);
    const { data, error } = await getReports({
      type: activeType !== 'all' ? activeType : undefined,
      category: selectedCategory || undefined,
      location_id: filters.location || undefined,
      limit: 50,
    });

    if (error) {
      setFetchError(error.message || 'Gagal memuat laporan.');
    } else if (data) {
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
        {
          id: '1',
          type: 'lost',
          title: 'AirPods Pro Gen 2',
          description: 'Hilang sekitar jam 10 pagi di Kantin Danau UMM.',
          locationId: 'kantin_a',
          locationName: 'Kantin Danau UMM',
          category: 'elektronik',
          createdAt: { toDate: () => new Date() },
          status: 'active',
          authorName: 'Alex Morgan',
          authorRole: 'mahasiswa',
          images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80'],
        },
        {
          id: '2',
          type: 'found',
          title: 'Kunci Motor Honda',
          description: 'Ditemukan di bangku panjang parkiran barat.',
          locationId: 'parkir_barat',
          locationName: 'Area Parkir Barat',
          category: 'kunci',
          createdAt: { toDate: () => new Date(Date.now() - 3600000) },
          status: 'active',
          authorName: 'Satpam Gerbang',
          hasDropOff: true,
          dropOffStatus: 'received',
          dropOffLocationName: 'Pos Satpam Utama',
          images: ['https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&q=80'],
        },
        {
          id: '3',
          type: 'lost',
          title: 'Dompet Kulit Cokelat & KTM',
          description: 'Tertinggal di meja Perpustakaan lantai 2.',
          locationId: 'perpus_pusat',
          locationName: 'Perpustakaan Pusat UMM',
          category: 'dompet',
          createdAt: { toDate: () => new Date(Date.now() - 7200000) },
          status: 'active',
          authorName: 'Dina Safitri',
          authorRole: 'mahasiswa',
          images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80'],
        },
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

  // Kamera sensor langsung untuk foto barang temuan
  const handleDirectCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Kamera Diperlukan',
          'JejaKampus memerlukan izin akses sensor kamera agar Anda dapat memfoto barang secara langsung.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        navigation.navigate('CreateReport', {
          type: 'found',
          initialImage: result.assets[0],
        });
      }
    } catch (e) {
      Alert.alert('Error Kamera', 'Gagal membuka sensor kamera: ' + e.message);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const filtered = reports.filter(r =>
    !searchQuery || r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = () => { 
    setRefreshing(true); 
    fetchReports();
  };

  const QUICK_ACTIONS = [
    {
      id: 'report_lost',
      label: 'Lapor Hilang',
      icon: 'search',
      isDark: true,
      onPress: () => navigation.navigate('CreateReport', { type: 'lost' }),
    },
    {
      id: 'camera_capture',
      label: 'Foto Temuan',
      icon: 'camera-outline',
      isDark: false,
      onPress: handleDirectCameraCapture,
    },
    {
      id: 'drop_off',
      label: 'Pos Satpam',
      icon: 'shield-checkmark-outline',
      isDark: false,
      onPress: () => {
        setSelectedCategory(null);
        setActiveType('found');
      },
    },
    {
      id: 'status_check',
      label: 'Status Temuan',
      icon: 'checkmark-circle-outline',
      isDark: false,
      onPress: () => setActiveType('all'),
    },
    {
      id: 'map_campus',
      label: 'Peta Kampus',
      icon: 'compass-outline',
      isDark: false,
      onPress: () => navigation.navigate('Map'),
    },
  ];

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Greeting Header (Reference Screen 1) */}
      <View style={styles.topBar}>
        <View style={styles.userProfileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(userProfile?.display_name || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.userTexts}>
            <Text style={styles.greetingSubtext}>{getGreeting()}</Text>
            <Text style={styles.greetingName}>
              {userProfile?.display_name || 'Mahasiswa UMM'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      {/* Search Bar with Yellow Filter Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={19} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari barang hilang, kategori, lokasi..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="options-outline" size={20} color="#18181B" />
        </TouchableOpacity>
      </View>

      {/* Quick Action Grid (5 Horizontal Buttons) */}
      <View style={styles.quickActionsRow}>
        {QUICK_ACTIONS.map(action => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionItem}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, action.isDark ? styles.actionIconDark : styles.actionIconWhite]}>
              <Ionicons
                name={action.icon}
                size={22}
                color={action.isDark ? COLORS.primary : COLORS.textPrimary}
              />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Callout / Promo Banner (Reference Screen 1) */}
      <View style={styles.calloutBanner}>
        <View style={styles.calloutTextCol}>
          <View style={styles.calloutBadgePill}>
            <Text style={styles.calloutBadgePillText}>Info Kampus</Text>
          </View>
          <Text style={styles.calloutTitle}>Titipkan Barang Temuan</Text>
          <Text style={styles.calloutDesc}>
            Simpan temuan di Pos Satpam terdekat agar aman dan cepat terverifikasi.
          </Text>
        </View>
        <View style={styles.calloutIconBox}>
          <Ionicons name="shield-checkmark" size={26} color="#18181B" />
        </View>
      </View>

      {/* Section: Laporan Terbaru (Nearby Lost Items) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Laporan Terbaru</Text>
        <TouchableOpacity onPress={() => setActiveType('all')}>
          <Text style={styles.seeAllText}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.nearbyScroll}
      >
        {reports.slice(0, 5).map(item => (
          <TouchableOpacity
            key={`nearby-${item.id}`}
            style={styles.nearbyCard}
            onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}
            activeOpacity={0.85}
          >
            {item.images?.length > 0 ? (
              <Image source={{ uri: item.images[0] }} style={styles.nearbyImage} />
            ) : (
              <View style={styles.nearbyImageFallback}>
                <Ionicons
                  name={item.type === 'lost' ? 'search' : 'checkmark-circle'}
                  size={30}
                  color={item.type === 'lost' ? COLORS.lost : COLORS.found}
                />
              </View>
            )}
            <View style={styles.nearbyContent}>
              <Text style={styles.nearbyTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.nearbyLocRow}>
                <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.nearbyLocText} numberOfLines={1}>
                  {item.locationName || 'Kampus III UMM'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section: Kategori Populer (Trending Categories) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Kategori Populer</Text>
        <TouchableOpacity onPress={() => setSelectedCategory(null)}>
          <Text style={styles.seeAllText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        <TouchableOpacity
          style={[styles.catPill, !selectedCategory && styles.catPillActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.catPillText, !selectedCategory && styles.catPillTextActive]}>
            Semua
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, isSelected && styles.catPillActive]}
              onPress={() => setSelectedCategory(isSelected ? null : cat.id)}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={isSelected ? '#18181B' : COLORS.textSecondary}
              />
              <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Feed List Title */}
      <View style={styles.feedHeaderRow}>
        <Text style={styles.feedTitle}>
          {filtered.length} Laporan Kampus
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          fetchError ? (
            <View style={styles.empty}>
              <Ionicons
                name={isOnline ? 'cloud-offline-outline' : 'wifi-outline'}
                size={52}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>
                {isOnline ? 'Gagal memuat data' : 'Tidak ada koneksi'}
              </Text>
              <Text style={styles.emptySubtitle}>{fetchError}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => { setLoading(true); fetchReports(); }}
                disabled={!isOnline}
              >
                <Text style={styles.retryBtnText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="file-tray-outline" size={52} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Tidak ada laporan</Text>
              <Text style={styles.emptySubtitle}>Belum ada laporan yang sesuai filter.</Text>
            </View>
          )
        }
      />

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={setFilters}
        currentFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 110, // Ruang untuk dock floating tab bar
  },
  headerContainer: {
    paddingTop: 54,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.base,
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 18,
    color: COLORS.primaryDark,
  },
  userTexts: {
    justifyContent: 'center',
  },
  greetingSubtext: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  greetingName: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  notifBadge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
  },
  actionItem: {
    alignItems: 'center',
    width: 62,
    gap: 6,
  },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  actionIconDark: {
    backgroundColor: '#18181B',
  },
  actionIconWhite: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  calloutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181B',
    marginHorizontal: SPACING.base,
    borderRadius: 20,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  calloutTextCol: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  calloutBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 6,
  },
  calloutBadgePillText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 10,
    color: COLORS.primary,
  },
  calloutTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  calloutDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: '#A1A1AA',
    lineHeight: 16,
  },
  calloutIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: 12,
    color: COLORS.primaryDark,
  },
  nearbyScroll: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.md,
    paddingBottom: SPACING.base,
  },
  nearbyCard: {
    width: 175,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  nearbyImage: {
    width: '100%',
    height: 110,
    backgroundColor: COLORS.surfaceElevated,
  },
  nearbyImageFallback: {
    width: '100%',
    height: 110,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyContent: {
    padding: SPACING.sm + 2,
    gap: 4,
  },
  nearbyTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  nearbyLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  nearbyLocText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
  },
  categoryScroll: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    paddingBottom: SPACING.base,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  catPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catPillText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  catPillTextActive: {
    color: '#18181B',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  feedHeaderRow: {
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  feedTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: SPACING['2xl'],
  },
  emptyTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  retryBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  retryBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#18181B',
  },
});
