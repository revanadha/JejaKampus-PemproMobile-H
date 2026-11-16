import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();

  // Appearance State
  const [appearanceMode, setAppearanceMode] = useState('light'); // 'light' | 'dark' | 'system'

  // Notifications State
  const [pushNotifications, setPushNotifications] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [rewardUpdates, setRewardUpdates] = useState(false);

  // Preferences State
  const [language, setLanguage] = useState('Indonesia');
  const [securityActive, setSecurityActive] = useState(true);
  const [privacyActive, setPrivacyActive] = useState(false);

  const handleLanguageChange = () => {
    Alert.alert(
      'Pilih Bahasa / Language',
      'Pilih preferensi bahasa tampilan:',
      [
        { text: 'Bahasa Indonesia', onPress: () => setLanguage('Indonesia') },
        { text: 'English', onPress: () => setLanguage('English') },
        { text: 'Batal', style: 'cancel' },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Keluar Akun', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header matching Reference Screen 3 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Settings</Text>

        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => Alert.alert('QR Tag JejaKampus', 'Fitur scan QR tag barang hilang/temuan.')}
          activeOpacity={0.7}
        >
          <Ionicons name="qr-code-outline" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── SECTION 1: APPEARANCE ────────────────────────── */}
        <Text style={styles.sectionHeader}>APPEARANCE</Text>
        <View style={styles.groupCard}>
          {/* Light Mode */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => setAppearanceMode('light')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="sunny-outline" size={20} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.rowLabel}>Light Mode</Text>
            </View>
            <View style={[styles.radioCircle, appearanceMode === 'light' && styles.radioCircleActive]}>
              {appearanceMode === 'light' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Dark Mode */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => setAppearanceMode('dark')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="moon-outline" size={20} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.rowLabel}>Dark Mode</Text>
            </View>
            <View style={[styles.radioCircle, appearanceMode === 'dark' && styles.radioCircleActive]}>
              {appearanceMode === 'dark' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* System */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => setAppearanceMode('system')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="phone-portrait-outline" size={20} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.rowLabel}>System</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C4C4C8" />
          </TouchableOpacity>
        </View>

        {/* ── SECTION 2: NOTIFICATIONS ─────────────────────── */}
        <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
        <View style={styles.groupCard}>
          {/* Push Notifications */}
          <View style={styles.cardRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.rowLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#E4E4E7', true: '#FDE68A' }}
              thumbColor={pushNotifications ? COLORS.primary : '#FFFFFF'}
            />
          </View>

          <View style={styles.rowDivider} />

          {/* Match Alerts */}
          <View style={styles.cardRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="sparkles-outline" size={20} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.rowLabel}>Match Alerts</Text>
            </View>
            <Switch
              value={matchAlerts}
              onValueChange={setMatchAlerts}
              trackColor={{ false: '#E4E4E7', true: '#FDE68A' }}
              thumbColor={matchAlerts ? COLORS.primary : '#FFFFFF'}
            />
          </View>

          <View style={styles.rowDivider} />

          {/* Reward Updates */}
          <View style={styles.cardRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="gift-outline" size={20} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.rowLabel}>Reward Updates</Text>
            </View>
            <Switch
              value={rewardUpdates}
              onValueChange={setRewardUpdates}
              trackColor={{ false: '#E4E4E7', true: '#FDE68A' }}
              thumbColor={rewardUpdates ? COLORS.primary : '#FFFFFF'}
            />
          </View>
        </View>

        {/* ── SECTION 3: PREFERENCES ───────────────────────── */}
        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <View style={styles.groupCard}>
          {/* Language */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={handleLanguageChange}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="globe-outline" size={20} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.rowLabel}>Language</Text>
            </View>
            <View style={styles.rowRightWithText}>
              <Text style={styles.rightValueText}>{language}</Text>
              <Ionicons name="chevron-forward" size={16} color="#A1A1AA" />
            </View>
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Security */}
          <View style={styles.cardRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.rowLabel}>Security</Text>
            </View>
            <Switch
              value={securityActive}
              onValueChange={setSecurityActive}
              trackColor={{ false: '#E4E4E7', true: '#FDE68A' }}
              thumbColor={securityActive ? COLORS.primary : '#FFFFFF'}
            />
          </View>

          <View style={styles.rowDivider} />

          {/* Privacy */}
          <View style={styles.cardRow}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="shield-outline" size={20} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.rowLabel}>Privacy</Text>
            </View>
            <Switch
              value={privacyActive}
              onValueChange={setPrivacyActive}
              trackColor={{ false: '#E4E4E7', true: '#FDE68A' }}
              thumbColor={privacyActive ? COLORS.primary : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Logout Row */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.lost} />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 8,
  },
  sectionHeader: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.8,
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 18,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#EDEFF3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 44,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  rowRightWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightValueText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 14,
    color: '#71717A',
  },
  logoutBtn: {
    marginTop: 32,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: 14,
    color: COLORS.lost,
  },
});
