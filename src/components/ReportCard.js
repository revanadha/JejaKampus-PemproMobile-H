import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, CATEGORIES } from '../constants/theme';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';
dayjs.extend(relativeTime);
dayjs.locale('id');

export default function ReportCard({ report, onPress, onLongPress }) {
  const category = CATEGORIES.find(c => c.id === report.category);
  const isLost = report.type === 'lost';
  const timeAgo = report.createdAt?.toDate ? dayjs(report.createdAt.toDate()).fromNow() : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.85}>
      <View style={styles.content}>
        {/* Top row */}
        <View style={styles.topRow}>
          {/* Type badge — clean, non-capsule (R-09) */}
          <View style={[styles.typeBadge, { backgroundColor: isLost ? COLORS.lost + '18' : COLORS.found + '18' }]}>
            <Ionicons
              name={isLost ? 'search-outline' : 'checkmark-circle-outline'}
              size={12}
              color={isLost ? COLORS.lost : COLORS.found}
            />
            <Text style={[styles.typeText, { color: isLost ? COLORS.lost : COLORS.found }]}>
              {isLost ? 'Hilang' : 'Ditemukan'}
            </Text>
          </View>

          {/* Category chip */}
          {category && (
            <View style={[styles.catChip, { backgroundColor: category.color + '15' }]}>
              <Ionicons name={category.icon} size={11} color={category.color} />
              <Text style={[styles.catText, { color: category.color }]}>{category.name}</Text>
            </View>
          )}

          <Text style={styles.time}>{timeAgo}</Text>
        </View>

        {/* Image + info */}
        <View style={styles.mainRow}>
          {report.images?.length > 0 ? (
            <Image source={{ uri: report.images[0] }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.noImageThumb, { backgroundColor: category?.color + '15' || COLORS.surfaceElevated }]}>
              <Ionicons name={category?.icon || 'help-outline'} size={24} color={category?.color || COLORS.textMuted} />
            </View>
          )}

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>{report.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.location} numberOfLines={1}>{report.locationName || 'Lokasi tidak diketahui'}</Text>
            </View>
            {report.description ? (
              <Text style={styles.description} numberOfLines={2}>{report.description}</Text>
            ) : null}
          </View>
        </View>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <View style={styles.authorInfo}>
            <View style={styles.authorDot} />
            <Text style={styles.authorName}>{report.authorName || 'Anonim'}</Text>
            {report.authorRole && (
              <Text style={styles.authorRole}>· {report.authorRole}</Text>
            )}
          </View>

          <View style={styles.badges}>
            {report.hasDropOff && (
              <View style={styles.dropOffBadge}>
                <Ionicons name="shield-checkmark" size={11} color={COLORS.accent} />
                <Text style={styles.dropOffText}>Di Pos Satpam</Text>
              </View>
            )}
            {report.status === 'resolved' && (
              <View style={styles.resolvedBadge}>
                <Ionicons name="checkmark-circle" size={11} color={COLORS.found} />
                <Text style={styles.resolvedText}>Selesai</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  content: { padding: SPACING.base },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm, flexWrap: 'wrap' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm },
  typeText: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: 11 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.sm },
  catText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 11 },
  time: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' },
  mainRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  thumbnail: { width: 72, height: 72, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceElevated },
  noImageThumb: { width: 72, height: 72, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  location: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textMuted, flex: 1 },
  description: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, lineHeight: 18 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 },
  authorInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  authorDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.textMuted },
  authorName: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 11, color: COLORS.textSecondary },
  authorRole: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 11, color: COLORS.textMuted, textTransform: 'capitalize' },
  badges: { flexDirection: 'row', gap: SPACING.xs },
  dropOffBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.accent + '18', paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.sm },
  dropOffText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 10, color: COLORS.accent },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.found + '18', paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.sm },
  resolvedText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 10, color: COLORS.found },
});
