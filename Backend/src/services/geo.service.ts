import geoip from 'geoip-lite';
import requestIp from 'request-ip';
import { UAParser } from 'ua-parser-js';
import { Request } from 'express';

export interface GeoInfo {
    ip: string;
    country: string; // 'IN', 'US'
    city: string;
    region: string;
    ll: [number, number]; // Latitude, Longitude
    timezone: string;
}

// ----------------------------------------------------------------------
// ⚡ REMOVED exchangeRate property as per user request to avoid confusion.
// ----------------------------------------------------------------------
export interface CurrencyConfig {
    code: 'INR' | 'USD';
    symbol: '₹' | '$';
    // exchangeRate removed
    pricingTier?: 'LOW' | 'MEDIUM' | 'STANDARD' | 'PREMIUM';
    costMultiplier?: number;
}

export class GeoService {

    /**
     * Extracts the REAL IP address from the request, handling Nginx/Proxy headers.
     */
    static getClientIp(req: Request): string {
        // use request-ip library which checks X-Client-IP, X-Forwarded-For, etc.
        let ip = requestIp.getClientIp(req);

        // ⚠️ PRODUCTION: Uncomment for local India testing
        // Handle local development (::1) -> Default India IP for testing
        if (ip === '::1' || ip === '127.0.0.1') {
            // For VPN testing: Comment out this block and restart backend
            ip = '49.207.0.0'; // Indian IP for local testing (Hyderabad, India)
        }

        return ip || '';
    }

    /**
     * Looks up location data from the IP using internal geoip-lite DB.
     */
    static getLocation(ip: string): GeoInfo | null {
        if (!ip) return null;

        const geo = geoip.lookup(ip);
        if (!geo) return null;

        return {
            ip,
            country: geo.country,
            city: geo.city,
            region: geo.region,
            ll: geo.ll,
            timezone: geo.timezone
        };
    }

    /**
     * Identifies Device, OS, and Browser from User-Agent.
     */
    static getDeviceInfo(userAgent: string) {
        const parser = new UAParser(userAgent);
        const result = parser.getResult();

        return {
            type: result.device.type || 'desktop', // console, mobile, tablet, smarttv, wearable, embedded
            os: `${result.os.name || ''} ${result.os.version || ''}`.trim(),
            browser: `${result.browser.name || ''} ${result.browser.version || ''}`.trim()
        };
    }

    /**
     * Returns Currency & Pricing Config based on Country Code.
     * Implements Purchasing Power Parity (PPP) logic.
     */
    static getCurrencyConfig(countryCode: string | null): CurrencyConfig {
        const code = countryCode?.toUpperCase() || 'US';

        // LEVEL 2: Poor Neighbors & Developing Nations (Survival Mode)
        // In sabko $4.70 (approx ₹400) wala rate milega.
        const LEVEL_POOR = [
            // South Asia (Neighbors)
            'PK', 'NP', 'LK', 'BD', 'AF', 'MV', // Pakistan, Nepal, Sri Lanka, Bangladesh, Afghanistan, Maldives

            // Southeast Asia (Low Cost Tech Hubs)
            'VN', 'PH', 'ID', 'TH', 'KH', 'LA', 'MM', // Vietnam, Philippines, Indonesia, Thailand, Cambodia, Laos, Myanmar

            // Africa (High Volume, Low Budget)
            'NG', 'EG', 'KE', 'GH', 'ZA', 'TZ', 'UG', 'DZ', 'MA', // Nigeria, Egypt, Kenya, Ghana, South Africa, Tanzania, Uganda, Algeria, Morocco

            // South America & Others (Weak Currency)
            'AR', 'VE', 'CO', 'UA' // Argentina, Venezuela, Colombia, Ukraine (War affected, discount helps)
        ];
        // LEVEL 3: Middle Market (Growth Mode - Mid-Tier Pricing)
        // Developing economies with higher purchasing power
        const LEVEL_MIDDLE = ['AE', 'CN', 'BR', 'TR', 'RU', 'SA', 'ID', 'PH', 'VN', 'TH', 'MY'];

        // LEVEL 4: Rich Countries (Profit Mode - Premium Pricing)
        // High-income developed nations
        const LEVEL_RICH = ['US', 'GB', 'CA', 'AU', 'DE', 'SG', 'FR', 'JP', 'KR', 'NL', 'SE', 'NO', 'DK', 'CH'];

        // LEVEL 1: India (Home Base - Local Currency)
        if (code === 'IN') {
            return {
                code: 'INR',
                symbol: '₹',
                pricingTier: 'LOW',
                costMultiplier: 0.0004 // 1M Tokens = ₹399
            };
        }

        // LEVEL 2: Poor Neighbors
        if (LEVEL_POOR.includes(code)) {
            return {
                code: 'USD',
                symbol: '$',
                pricingTier: 'LOW',
                costMultiplier: 0.0000047 // 1M Tokens = $4.70
            };
        }

        // LEVEL 3: Middle Market (NEW TIER)
        if (LEVEL_MIDDLE.includes(code)) {
            return {
                code: 'USD',
                symbol: '$',
                pricingTier: 'MEDIUM',
                costMultiplier: 0.000007 // 1M Tokens = $7.00
            };
        }

        // LEVEL 4: Rich Countries (Explicit Check)
        if (LEVEL_RICH.includes(code)) {
            return {
                code: 'USD',
                symbol: '$',
                pricingTier: 'PREMIUM',
                costMultiplier: 0.000009 // 1M Tokens = $9.00
            };
        }

        // Fallback (Default to Premium/Rich for unknown to be safe)
        return {
            code: 'USD',
            symbol: '$',
            pricingTier: 'PREMIUM',
            costMultiplier: 0.000009
        };
    }
    /**
     * Returns Currency & Pricing Config, forcing a specific currency code if possible.
     * Useful when a user in India (INR defaults) explicitly requests to pay in USD.
     */
    static getCurrencyConfigByCode(requestedCode: string, countryCode: string | null): CurrencyConfig {
        const country = countryCode?.toUpperCase() || 'US';
        const code = requestedCode.toUpperCase();

        const defaultConfig = this.getCurrencyConfig(country);

        // If request matches native, return native
        if (defaultConfig.code === code) {
            return defaultConfig;
        }

        // 🟢 Handle INR -> USD Conversion Logic
        // If user is from India (Tier 1) but wants USD, map them to Tier 2 (Poor Neighbors)
        // because Tier 1 & Tier 2 are economically similar (~$4.70 vs ~$4.80)
        if (code === 'USD') {
            const LEVEL_POOR = [
                'PK', 'NP', 'LK', 'BD', 'AF', 'MV',
                'VN', 'PH', 'ID', 'TH', 'KH', 'LA', 'MM',
                'NG', 'EG', 'KE', 'GH', 'ZA', 'TZ', 'UG', 'DZ', 'MA',
                'AR', 'VE', 'CO', 'UA',
                'IN' // 👈 Include India here explicitly for USD fallback
            ];

            const LEVEL_MIDDLE = ['AE', 'CN', 'BR', 'TR', 'RU', 'SA', 'MY'];

            // Check if Country is in Poor List (or India)
            if (LEVEL_POOR.includes(country)) {
                return {
                    code: 'USD',
                    symbol: '$',
                    pricingTier: 'LOW',
                    costMultiplier: 0.0000047 // 1M Tokens = $4.70
                };
            }

            // Check Middle
            if (LEVEL_MIDDLE.includes(country)) {
                return {
                    code: 'USD',
                    symbol: '$',
                    pricingTier: 'MEDIUM',
                    costMultiplier: 0.000007 // 1M Tokens = $7.00
                };
            }

            // Default to Global/Rich
            return {
                code: 'USD',
                symbol: '$',
                pricingTier: 'PREMIUM',
                costMultiplier: 0.000009 // 1M Tokens = $9.00
            };
        }

        // If requesting INR and not in India, usually we don't support it, but fallback to default USD
        // or if we ever support other currencies, add here.

        // Final Fallback: Return what we would have returned anyway, but warn?
        // Actually, if they asked for EUR and we only have USD, we return USD.
        return defaultConfig;
    }
}
