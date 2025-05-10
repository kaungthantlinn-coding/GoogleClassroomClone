/**
 * Utility functions for checking and handling in-memory storage
 */

/**
 * In-memory storage replacement for localStorage
 * This completely removes the usage of localStorage and uses in-memory storage instead
 */

// In-memory storage object
const memoryStorage: Record<string, string> = {};

/**
 * Memory storage API that mimics localStorage interface
 */
export const memoryStorageAPI = {
  getItem: (key: string): string | null => {
    return key in memoryStorage ? memoryStorage[key] : null;
  },
  
  setItem: (key: string, value: string): void => {
    memoryStorage[key] = value;
  },
  
  removeItem: (key: string): void => {
    delete memoryStorage[key];
  },
  
  clear: (): void => {
    Object.keys(memoryStorage).forEach(key => {
      delete memoryStorage[key];
    });
  },
  
  key: (index: number): string | null => {
    const keys = Object.keys(memoryStorage);
    return index < keys.length ? keys[index] : null;
  },
  
  get length(): number {
    return Object.keys(memoryStorage).length;
  }
};

/**
 * Override global localStorage - this is a global replacement
 * that removes all localStorage usage and replaces it with in-memory storage
 */
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: memoryStorageAPI,
    writable: false,
    configurable: true
  });
}

/**
 * Check if storage is available
 * @returns {boolean} always true for in-memory storage
 */
export const isLocalStorageAvailable = (): boolean => {
  return true;
};

/**
 * Check if storage has quota issues
 * @returns {boolean} always false for in-memory storage
 */
export const hasStorageQuotaIssue = (): boolean => {
  return false;
};

/**
 * Get the approximate used storage space
 * @returns {number} approximate size in bytes
 */
export const getLocalStorageUsage = (): number => {
  return Object.entries(memoryStorage).reduce((total, [key, value]) => {
    return total + (key.length + value.length) * 2; // UTF-16 uses 2 bytes per char
  }, 0);
};

/**
 * Clear all data from storage
 */
export const clearLocalStorage = (): void => {
  memoryStorageAPI.clear();
};

/**
 * Get a list of all keys in storage
 * @returns {string[]} list of keys
 */
export const getLocalStorageKeys = (): string[] => {
  return Object.keys(memoryStorage);
};