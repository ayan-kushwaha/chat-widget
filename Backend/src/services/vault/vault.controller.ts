/**
 * Vault Controller — ClickHouse Analytics Endpoint Handler
 * Cluaiz Backend | services/vault/vault.controller.ts
 */
import { Request, Response } from 'express';
import { vaultService } from './vault.service';

export const getVaultStats = async (req: Request, res: Response) => {
  try {
    const data = await vaultService.getStats();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ status: 'error', message: e.message });
  }
};

export const searchMemory = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const data = await vaultService.searchMemory(q);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ status: 'error', message: e.message });
  }
};

export const getPsychTrend = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const data = await vaultService.getPsychTrend(userId, days);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ status: 'error', message: e.message });
  }
};

export const getHotZones = async (req: Request, res: Response) => {
  try {
    const topN = parseInt(req.query.top_n as string) || 10;
    const data = await vaultService.getHotZones(topN);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ status: 'error', message: e.message });
  }
};
