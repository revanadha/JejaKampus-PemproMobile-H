/**
 * useNetworkStatus.js
 * Hook untuk memantau status koneksi jaringan secara real-time.
 */

import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const PING_URL = 'https://zklprhlbxjlvrtvucyyx.supabase.co/rest/v1/';
const CHECK_INTERVAL_MS = 10000;

export const checkConnectivity = async () => {
  try {
    const res = await fetch(PING_URL, { method: 'HEAD' });
    return res.ok || res.status < 500;
  } catch {
    return false;
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
