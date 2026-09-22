import axios from 'axios';

// Base API configuration using Vite proxy or direct port 5001/5002
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000 // Increased from 30s to 60s to prevent AI scan timeouts
});

/**
 * Checks connectivity and system diagnostics of the backend
 */
export async function checkHealth() {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('[Shield API] Health check failed:', error);
    throw new Error(error.response?.data?.error || error.message || 'Shield Backend is Offline');
  }
}

/**
 * Sends text or URL payload to the Deflector Engine for inspection
 * @param {string} payload 
 */
export async function analyzePayload(payload) {
  try {
    const response = await apiClient.post('/analyze', { payload });
    return response.data;
  } catch (error) {
    console.error('[Shield API] Analyze payload failed:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to inspect payload');
  }
}

/**
 * Retrieves past deflection records from the SQLite Vault
 * @param {number} limit 
 */
export async function getVaultHistory(limit = 25) {
  try {
    const response = await apiClient.get('/vault', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('[Shield API] Failed to fetch Vault history:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to retrieve Vault history');
  }
}

/**
 * Purges deflection records from the Vault database
 */
export async function clearVaultHistory() {
  try {
    const response = await apiClient.delete('/vault');
    return response.data;
  } catch (error) {
    console.error('[Shield API] Failed to purge Vault:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to purge Vault');
  }
}

export default {
  checkHealth,
  analyzePayload,
  getVaultHistory,
  clearVaultHistory
};