import React, { useState } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, CAMPUS_LOCATIONS } from '../constants/theme';

export default function FilterModal({ visible, onClose, onApply, currentFilters }) {
  const [location, setLocation] = useState(currentFilters?.location || null);
  const [dateRange, setDateRange] = useState(currentFilters?.dateRange || null);

  const DATE_RANGES = [
    { id: 'today', label: 'Hari Ini' },
    { id: 'week', label: '7 Hari Terakhir' },
    { id: 'month', label: '30 Hari Terakhir' },
  ];

  const handleApply = () => {
    onApply({ location, dateRange });
    onClose();
  };

  const handleReset = () => {
    setLocation(null);
    setDateRange(null);
    onApply({ location: null, dateRange: null });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Filter Laporan</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Location Filter */}
          <Text style={styles.sectionTitle}>📍 Lokasi</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, !location && styles.chipActive]}
                onPress={() => setLocation(null)}
              >
                <Text style={[styles.chipText, !location && styles.chipTextActive]}>Semua Lokasi</Text>
              </TouchableOpacity>
              {CAMPUS_LOCATIONS.filter(l => !l.isDropOff).map(loc => (
                <TouchableOpacity
                  key={loc.id}
                  style={[styles.chip, location === loc.id && styles.chipActive]}
                  onPress={() => setLocation(location === loc.id ? null : loc.id)}
                >
                  <Ionicons name="location-outline" size={12} color={location === loc.id ? 'white' : COLORS.textSecondary} />
                  <Text style={[styles.chipText, location === loc.id && styles.chipTextActive]}>{loc.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Date Range Filter */}
          <Text style={styles.sectionTitle}>📅 Rentang Waktu</Text>
          <View style={styles.dateRow}>
            {DATE_RANGES.map(range => (
              <TouchableOpacity
                key={range.id}
                style={[styles.dateBtn, dateRange === range.id && styles.dateBtnActive]}
                onPress={() => setDateRange(dateRange === range.id ? null : range.id)}
              >
                <Text style={[styles.dateBtnText, dateRange === range.id && styles.dateBtnTextActive]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetText}>Reset Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyText}>Terapkan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], padding: SPACING.xl, paddingBottom: 40, maxHeight: '80%', borderWidth: 1, borderColor: COLORS.border },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xl },
  title: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: TYPOGRAPHY.sizes.xl, color: COLORS.textPrimary },
  sectionTitle: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary, marginBottom: SPACING.md },
  chipScroll: { marginBottom: SPACING.xl },
  chipRow: { flexDirection: 'row', gap: SPACING.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 12, color: COLORS.textSecondary },
  chipTextActive: { color: 'white' },
  dateRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl, flexWrap: 'wrap' },
  dateBtn: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.border, minWidth: 90 },
  dateBtnActive: { backgroundColor: COLORS.primary + '30', borderColor: COLORS.primary },
  dateBtnText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary },
  dateBtnTextActive: { color: COLORS.primary },
  actions: { flexDirection: 'row', gap: SPACING.sm },
  resetBtn: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  resetText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textSecondary },
  applyBtn: { flex: 2, alignItems: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary },
  applyText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: 'white' },
});
