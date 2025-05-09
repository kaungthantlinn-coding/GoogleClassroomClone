/**
 * Utility to determine if the application should use real API calls
 */
import { API_BASE_URL, DEBUG } from '../config/api';

/**
 * Always returns true to force using the API
 */
export const shouldUseApi = () => {
  return true;
};

/**
 * Helper function to create consistent log messages
 */
export const logApiMode = (feature: string) => {
  if (DEBUG) {
    console.log(`Using API for ${feature}`);
  }
};

/**
 * Gets the configured API base URL
 */
export const getApiBaseUrl = () => {
  return API_BASE_URL;
}; 