import { useState, useEffect } from 'react';

// Use shared types (Source of Truth)
import { PlanTier } from '@/types/plan-types';

// Define types based on Backend response
export interface FeatureDefinition {
    id: string;
    type: 'boolean' | 'numeric' | 'enum';
    label: string;
    description: string;
    category: string;
    defaultValue: any;
    unit?: string;
    options?: string[];
    icon?: string;
    burn_rate?: string;
    includes?: any[]; // Sub-features
    color?: string;
    location?: string;
}

export interface SystemConfig {
    features: Record<string, FeatureDefinition>;
    planTiers: PlanTier[];
    tierDefinitions?: any[];
    maxTokenLimit: number;
    version?: string; // ✅ Version Control
}

const CACHE_KEY = 'cluaiz_sys_config_v5';

// Helper to check if config is valid structure
const validateConfig = (c: SystemConfig | null): boolean => {
    if (!c || !c.planTiers) return false;
    // Allow empty array (valid state: 'No Plans')
    if (c.planTiers.length === 0) return true;
    const hasGarbage = c.planTiers.some((p: any) => p.name?.includes('Loading') || p.id?.includes('loading_'));
    return !hasGarbage;
};

// Simple in-memory cache (Singleton)
let configCache: SystemConfig | null = null;

export function useSystemConfig() {
    // 1. Instant Load from LocalStorage/Memory
    const [config, setConfig] = useState<SystemConfig | null>(() => {
        if (configCache) return configCache;
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(CACHE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (validateConfig(parsed)) {
                        configCache = parsed;
                        return parsed;
                    }
                }
            } catch (e) { console.warn('Cache Parse Error', e); }
        }
        return null;
    });

    const [loading, setLoading] = useState(!config);

    // 2. Background Revalidation (Stale-While-Revalidate)
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/system/config`);
                const data = await response.json();

                if (data.success && validateConfig(data.data)) {
                    const newConfig = data.data;

                    // ✅ Smart Update: Only update if Version changed or No Config
                    if (!configCache || newConfig.version !== configCache.version) {
                        console.log(`♻️ Config Updated: ${configCache?.version} -> ${newConfig.version}`);
                        configCache = newConfig;
                        setConfig(newConfig);
                        if (typeof window !== 'undefined') {
                            localStorage.setItem(CACHE_KEY, JSON.stringify(newConfig));
                        }
                    } else {
                        console.log('✅ Config is up to date:', newConfig.version);
                    }
                }
            } catch (error) {
                console.error('Failed to revalidate system config', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    return { config, loading };
}
