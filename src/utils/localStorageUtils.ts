/**
 * Utility functions for checking and handling localStorage
 */

/**
 * Check if localStorage is available in the browser
 * @returns {boolean} true if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__test_key__';
    localStorage.setItem(testKey, testKey);
    const result = localStorage.getItem(testKey) === testKey;
    localStorage.removeItem(testKey);
    return result;
  } catch (e) {
    return false;
  }
};

/**
 * Check if localStorage has quota issues
 * @returns {boolean} true if storage limit is a problem
 */
export const hasStorageQuotaIssue = (): boolean => {
  try {
    const testKey = '__quota_test__';
    // Try to store a large string (approximately 5MB)
    const largeString = new Array(5 * 1024 * 1024).join('a');
    
    try {
      localStorage.setItem(testKey, largeString);
      localStorage.removeItem(testKey);
      return false;
    } catch (e) {
      return true;
    }
  } catch (e) {
    return true;
  }
};

/**
 * Get the approximate used storage space in localStorage
 * @returns {number} approximate size in bytes
 */
export const getLocalStorageUsage = (): number => {
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      totalSize += key.length + value.length;
    }
  }
  
  return totalSize * 2; // UTF-16 characters are 2 bytes each
};

/**
 * Clear all data from localStorage
 */
export const clearLocalStorage = (): void => {
  localStorage.clear();
};

/**
 * Get a list of all keys in localStorage
 * @returns {string[]} list of keys
 */
export const getLocalStorageKeys = (): string[] => {
  const keys: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      keys.push(key);
    }
  }
  
  return keys;
}; 