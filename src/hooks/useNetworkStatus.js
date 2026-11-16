/**
 * useNetworkStatus.js
 * Hook untuk memantau status koneksi jaringan secara real-time.
 */

import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const PRIMARY_PING_URL = 'https://clients3.google.com/generate_204';
const FALLBACK_PING_URL = 'https://www.google.com';
const CHECK_INTERVAL_MS = 10000;
const TIMEOUT_MS = 4000;

export const checkConnectivity = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(PRIMARY_PING_URL, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    clearTimeout(timeoutId);
    return res.status === 204 || res.ok;
  } catch {
    try {
      const fallbackController = new AbortController();
      const fbTimeout = setTimeout(() => fallbackController.abort(), TIMEOUT_MS);
      const res = await fetch(FALLBACK_PING_URL, {
        method: 'HEAD',
        signal: fallbackController.signal,
        headers: { 'Cache-Control': 'no-cache' },
      });
      clearTimeout(fbTimeout);
      return res.ok || res.status < 500;
    } catch {
      return false;
    }
  }
};

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const checkNow = async () => {
    setIsChecking(true);
    const online = await checkConnectivity();
    setIsOnline(online);
    setIsChecking(false);
    return online;
  };

  const startPolling = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(async () => {
      const online = await checkConnectivity();
      if (online) {
        setIsOnline(true);
        stopPolling();
      }
    }, CHECK_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    checkNow().then((online) => {
      if (!online) startPolling();
    });

    const handleAppStateChange = (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        checkNow().then((online) => {
          if (!online) startPolling();
          else stopPolling();
        });
      }
      appStateRef.current = nextState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      sub.remove();
      stopPolling();
    };
  }, []);

  return { isOnline, isChecking, checkNow };
};

export default useNetworkStatus;
