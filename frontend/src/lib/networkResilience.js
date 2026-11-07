// networkResilience.js - Device & network resilience utilities for rural / offline environments
import { useState, useEffect } from 'react';
import axios from 'axios';

// Detect whether the current device is on a weak, slow, or metered connection
export const getNetworkQuality = () => {
  if (typeof window === 'undefined') {
    return { isOnline: true, effectiveType: '4g', isWeakConnection: false, saveData: false };
  }

  const isOnline = navigator.onLine !== false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  const effectiveType = connection?.effectiveType || '4g';
  const saveData = connection?.saveData || false;
  const isWeakConnection = !isOnline || saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';

  return { isOnline, effectiveType, isWeakConnection, saveData };
};

// React hook to monitor online/offline and connection speed in real-time
export const useNetworkStatus = () => {
  const [status, setStatus] = useState(getNetworkQuality);

  useEffect(() => {
    const handleOnline = () => setStatus(getNetworkQuality());
    const handleOffline = () => setStatus(getNetworkQuality());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleOnline);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleOnline);
      }
    };
  }, []);

  return status;
};

// Local storage offline cache with safe fallback and expiration
export const offlineCache = {
  get: (key, maxAgeMs = 24 * 60 * 60 * 1000) => {
    try {
      const raw = localStorage.getItem(`fms_cache_${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > maxAgeMs) {
        return parsed.data; // Return stale data rather than nothing in rural areas
      }
      return parsed.data;
    } catch {
      return null;
    }
  },

  set: (key, data) => {
    try {
      localStorage.setItem(`fms_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch {
      // LocalStorage full or quota exceeded, fail silently
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(`fms_cache_${key}`);
    } catch {
      // Ignore storage errors
    }
  }
};

// Configure Axios with exponential backoff retry for flaky rural 2G/3G networks
export const setupNetworkResilience = () => {
  // 25s timeout allows high-latency satellite/2G cellular towers in remote villages to complete
  axios.defaults.timeout = 25000;

  // Response interceptor: automatically retry idempotent GET requests on network dropouts
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      if (!config || config.method?.toLowerCase() !== 'get') {
        return Promise.reject(error);
      }

      // Retry up to 2 times for network errors or 503/504 gateways
      config.__retryCount = config.__retryCount || 0;
      const isNetworkError = !error.response || [502, 503, 504].includes(error.response?.status);

      if (isNetworkError && config.__retryCount < 2) {
        config.__retryCount += 1;
        const delay = config.__retryCount * 1200; // 1.2s, 2.4s backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        return axios(config);
      }

      return Promise.reject(error);
    }
  );
};

