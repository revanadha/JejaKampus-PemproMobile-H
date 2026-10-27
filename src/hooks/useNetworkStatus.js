/**
 * useNetworkStatus.js
 * Hook untuk memantau status koneksi jaringan secara real-time.
 * - Di platform Web: menggunakan navigator.onLine dan window event listener
 * - Di platform Native: menggunakan fetch check
 */

import { useState, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

const CHECK_INTERVAL_MS = 10000;

export const checkConnectivity = async () => {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  }

  try {
    const res = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    return res.status === 0 || res.ok || res.status < 500;
  } catch {
    return false;
  }
};

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      return navigator.onLine !== false;
    }
    return true;
  });
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
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        setIsOnline(true);
        stopPolling();
      };
      const handleOffline = () => {
        setIsOnline(false);
        startPolling();
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      setIsOnline(navigator.onLine !== false);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        stopPolling();
      };
    }

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
