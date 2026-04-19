import { encryptStorage, decryptStorage } from '@/utils/storageCrypto';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

// ... (Rest of imports or interfaces if any, but replacing the TOP of file)

interface GeoConfig {
    ip: string;
    location: {
        country: string;
        city: string;
        // 🟢 Robust Data
        region: string; // State/Province
        timezone: string;
        ll?: [number, number]; // Lat/Long
    };
    currency: {
        code: 'INR' | 'USD';
        symbol: '₹' | '$';
        pricingTier: 'LOW' | 'STANDARD';
        costMultiplier: number;
    };
    device?: {
        type: string;
        os: string;
        browser: string;
    };
    loading: boolean;
}

const DEFAULT_CONFIG: GeoConfig = {
    ip: '',
    location: { country: 'US', city: '', region: '', timezone: '' },
    currency: {
        code: 'USD',
        symbol: '$',
        pricingTier: 'STANDARD',
        costMultiplier: 0 // Waiting for Backend Config
    },
    loading: true
};

export const useGeo = () => {
    const [geo, setGeo] = useState<GeoConfig>(DEFAULT_CONFIG);
    const { data: session, status } = useSession(); // Access Session for Token

    useEffect(() => {
        const fetchGeo = async () => {
            try {
                // 1. Check Session/Local Storage (Optimistic Load)
                // We still load cache first to show *something* instantly, but we might verify it if logged in.
                const cached = sessionStorage.getItem('cluaiz_geo_config');
                const persisted = localStorage.getItem('cluaiz_geo_config');
                const savedData = cached ? decryptStorage(cached) : (persisted ? decryptStorage(persisted) : null);

                if (savedData) {
                    setGeo({ ...savedData, loading: false });
                    // If we have data, we usually return.
                    // BUT: If user just logged in (session active), we should potentially re-validate
                    // to ensure we aren't showing Guest Pricing (IP) instead of User Pricing (Billing).
                    // Logic: If session is authenticated, trigger background refresh or force it if currency mismatch?
                    // Simpler: If status is 'authenticated', ALWAYS fetch fresh config to sync with Billing.
                    if (status !== 'authenticated') {
                        return;
                    }
                }

                // 2. API Prep - Include Token if available for "Billing Override"
                const token = (session as any)?.accessToken || (session as any)?.user?.accessToken;
                const headers: any = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`; // 🔑 UNLOCKS BILLING OVERRIDE IN BACKEND
                }

                // 3. Call Backend Intelligence API
                const { data } = await axios.get('/api/geo/config', { headers });

                if (data.success) {
                    const config = { ...data.data, loading: false };

                    // Optimization: Only update state if meaningful change (Currency/Country)
                    // But for safety/sync, just update.
                    setGeo(config);

                    const encrypted = encryptStorage(config);
                    sessionStorage.setItem('cluaiz_geo_config', encrypted);
                    localStorage.setItem('cluaiz_geo_config', encrypted);
                    // console.log("🌍 Geo Config Synced via API (User Context: " + (!!token) + ")");
                } else {
                    console.error("Geo API returned success:false", data);
                    throw new Error("Geo API Success False");
                }
            } catch (error) {
                console.error("Failed to load Geo Intelligence:", error);

                // 4. Fallback (Offline/Error) - Infer from Timezone if possible & NO CACHE
                if (!geo.ip) { // Only fallback if we have absolutely nothing
                    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    const isIndia = timezone === 'Asia/Kolkata' || timezone.includes('India');

                    setGeo(prev => ({
                        ...prev,
                        loading: false,
                        location: {
                            ...prev.location,
                            timezone: timezone,
                            country: isIndia ? 'IN' : 'US' // Soft Inference
                        },
                        currency: {
                            ...prev.currency,
                            code: isIndia ? 'INR' : 'USD',
                            symbol: isIndia ? '₹' : '$',
                            // Logic derived from Billing Page (Inferred, not hardcoded dummy)
                            costMultiplier: isIndia ? 0.0004 : 0.000009 // Standardize to base rate if unknown
                        }
                    }));
                }
            }
        };

        // Trigger Fetch when:
        // 1. Component Mounts (standard)
        // 2. Session Status changes (Guest -> Authenticated) to apply Billing Override
        fetchGeo();

        // 5. Real-Time Listener for Cross-Tab Sync
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'cluaiz_geo_config' && e.newValue) {
                // console.log("🔄 Geo Config Updated in another tab");
                const data = decryptStorage(e.newValue);
                if (data) {
                    setGeo({ ...data, loading: false });
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [status, session]); // ⚡ Re-run on Login/Logout

    return geo;
};
