import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook for handling async data fetching with offline support
 * Reduces code duplication across teacher components
 * 
 * @param {Function} fetchFn - Async function that performs the API call
 * @param {Array} dependencies - Dependency array for useEffect
 * @param {Object} options - Configuration options
 * @param {string} options.cacheKey - LocalStorage key for caching data
 * @param {number} options.timeout - Request timeout in milliseconds (default: 3000)
 * @param {boolean} options.useCache - Whether to use localStorage caching (default: true)
 * 
 * @returns {Object} - { data, isLoading, isServerOffline, isRetrying, retry, clearCache }
 */
export const useAsyncData = (
  fetchFn,
  dependencies = [],
  options = {}
) => {
  const {
    cacheKey = null,
    timeout = 3000,
    useCache = true,
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerOffline, setIsServerOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Attempt to load from cache on mount
  const loadFromCache = useCallback(() => {
    if (!useCache || !cacheKey) return null;
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.warn(`Cache read error for ${cacheKey}:`, err);
      return null;
    }
  }, [cacheKey, useCache]);

  // Save to cache with error handling
  const saveToCache = useCallback((value) => {
    if (!useCache || !cacheKey) return;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(value));
    } catch (err) {
      console.warn(`Cache write error for ${cacheKey}:`, err);
    }
  }, [cacheKey, useCache]);

  // Main fetch logic
  const fetch = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsRetrying(true);

    // Try cache first
    const cachedData = loadFromCache();
    if (cachedData && !isRetrying) {
      setData(cachedData);
      if (showLoading) setIsLoading(false);
    }

    try {
      // Call the provided fetch function with timeout
      const result = await Promise.race([
        fetchFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        ),
      ]);

      setData(result);
      saveToCache(result);
      setIsServerOffline(false);
    } catch (error) {
      console.error('Async data fetch error:', error);
      setIsServerOffline(true);

      // Use cached data as fallback if available
      if (!cachedData) {
        setData(null);
      }
    } finally {
      if (showLoading) setIsLoading(false);
      setTimeout(() => setIsRetrying(false), 800);
    }
  }, [fetchFn, timeout, loadFromCache, saveToCache, isRetrying]);

  // Clear cache
  const clearCache = useCallback(() => {
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
      setData(null);
    }
  }, [cacheKey]);

  // Auto-fetch on mount or dependency change
  useEffect(() => {
    fetch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    isLoading,
    isServerOffline,
    isRetrying,
    retry: () => fetch(false),
    clearCache,
  };
};

/**
 * Wrapper for axios calls with authorization header
 * Ensures consistent token management across the app
 * 
 * @param {string} apiBaseUrl - Base URL for API
 * @returns {Object} - Axios instance with pre-configured auth header
 */
export const createAuthAxios = (apiBaseUrl) => {
  const token = localStorage.getItem('sms_token') || '';
  
  return axios.create({
    baseURL: apiBaseUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 3000,
  });
};