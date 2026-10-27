/**
 * NetworkContext.js
 * Context global untuk status koneksi jaringan.
 * Wrap di App.js agar semua screen bisa akses isOnline.
 */

import React, { createContext, useContext } from 'react';
import useNetworkStatus from '../hooks/useNetworkStatus';

const NetworkContext = createContext({ isOnline: true, isChecking: false, checkNow: async () => true });

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }) => {
  const network = useNetworkStatus();
  return (
    <NetworkContext.Provider value={network}>
      {children}
    </NetworkContext.Provider>
  );
};
