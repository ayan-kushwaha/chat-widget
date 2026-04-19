/**
 * Vault Service — ClickHouse Proxy Gateway
 * Cluaiz Backend | services/vault/vault.service.ts
 *
 * Proxies all ClickHouse Vault requests from Frontend → Node.js → Python AI Engine.
 */
import axios from 'axios';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000/api/v1';

export class VaultService {
  /**
   * Get overall ClickHouse storage stats and health.
   */
  async getStats() {
    const res = await axios.get(`${AI_ENGINE_URL}/ch/vault/stats`);
    return res.data;
  }

  /**
   * Search archived memories by keyword.
   */
  async searchMemory(query: string) {
    const res = await axios.get(`${AI_ENGINE_URL}/ch/vault/search`, { params: { q: query } });
    return res.data;
  }

  /**
   * Get psychology trend data for MRI.
   */
  async getPsychTrend(userId: string, days: number = 30) {
    const res = await axios.get(`${AI_ENGINE_URL}/ch/analytics/psych-trend/${userId}`, {
      params: { days },
    });
    return res.data;
  }

  /**
   * Get the hottest brain zones (Neural Heat Map).
   */
  async getHotZones(topN: number = 10) {
    const res = await axios.get(`${AI_ENGINE_URL}/ch/analytics/hot-zones`, { params: { top_n: topN } });
    return res.data;
  }
}

export const vaultService = new VaultService();
