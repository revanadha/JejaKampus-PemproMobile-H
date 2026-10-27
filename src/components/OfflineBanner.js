/**
 * OfflineBanner.js
 * Banner global yang muncul di atas layar saat perangkat offline.
 * Menampilkan tombol "Coba Lagi" dan animasi masuk/keluar.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../context/NetworkContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

const OfflineBanner = () => {
  const { isOnline, isChecking, checkNow } = useNetwork();
  const translateY = useRef(new Animated.Value(-80)).current;
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }).start();
    } else if (wasOffline.current) {
      // Kembali online: sembunyikan banner setelah jeda singkat
      setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -80,
          duration: 350,
          useNativeDriver: true,
        }).start();
        wasOffline.current = false;
      }, 1500);
    }
  }, [isOnline]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      {isOnline ? (
        // Kembali online
        <View style={styles.onlineContent}>
          <Ionicons name="checkmark-circle" size={18} color="#30D158" />
          <Text style={[styles.text, { color: '#30D158' }]}>Koneksi pulih!</Text>
        </View>
      ) : (
        // Offline
        <View style={styles.offlineContent}>
          <Ionicons name="cloud-offline-outline" size={18} color="#FFD60A" />
          <Text style={[styles.text, { color: '#FFD60A' }]}>
            Tidak ada koneksi internet
          </Text>
          <TouchableOpacity onPress={checkNow} disabled={isChecking} style={styles.retryBtn}>
            {isChecking ? (
              <ActivityIndicator size="small" color="#FFD60A" />
            ) : (
              <Text style={styles.retryText}>Coba Lagi</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

export default OfflineBanner;

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#1C2128',
    borderBottomWidth: 1,
    borderBottomColor: '#FFD60A40',
    paddingTop: 44, // Safe area top
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.base,
  },
  offlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  onlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  text: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  retryBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD60A60',
    minWidth: 72,
    alignItems: 'center',
  },
  retryText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: '#FFD60A',
  },
});
