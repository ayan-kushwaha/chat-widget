import { Request, Response } from 'express';
import { Country, State } from 'country-state-city';
import { GeoService } from '../../../services/geo.service';
import { Organization } from '../../core/organization/Organization';

// API 1: Get All Countries (Flag + Phone Code + Name)
// Frontend checks this on load
export const getCountries = (req: Request, res: Response) => {
    try {
        const countries = Country.getAllCountries().map(c => ({
            label: `${c.flag} ${c.name}`, // 🇮🇳 India
            value: c.isoCode,            // IN
            flag: c.flag,                // 🇮🇳
            phoneCode: c.phonecode       // 91
        }));
        res.json(countries);
    } catch (error) {
        console.error("Geo API Error (Countries):", error);
        res.status(500).json({ message: "Failed to fetch countries" });
    }
};

// API 2: Get States (Dynamic based on Country)
export const getStates = (req: Request, res: Response) => {
    try {
        const { countryCode } = req.params; // e.g., 'IN'
        if (!countryCode) {
            res.status(400).json({ message: "Country code is required" });
            return;
        }

        const states = State.getStatesOfCountry(countryCode).map(s => ({
            label: s.name,   // Uttar Pradesh
            value: s.isoCode // UP
        }));
        res.json(states);
    } catch (error) {
        console.error("Geo API Error (States):", error);
        res.status(500).json({ message: "Failed to fetch states" });
    }
};

import { City } from 'country-state-city';

// API 3: Get Cities (Dynamic based on Country + State)
export const getCities = (req: Request, res: Response) => {
    try {
        const { countryCode, stateCode } = req.params;
        if (!countryCode || !stateCode) {
            res.status(400).json({ message: "Country and State codes are required" });
            return;
        }

        const cities = City.getCitiesOfState(countryCode, stateCode).map(c => ({
            label: c.name,
            value: c.name // Cities don't use ISO codes, just names
        }));
        res.json(cities);
    } catch (error) {
        console.error("Geo API Error (Cities):", error);
        res.status(500).json({ message: "Failed to fetch cities" });
    }
};

// API 3: Get Geo Config (IP Intelligence - Enhanced)
export const getGeoConfig = async (req: Request, res: Response) => {
    try {
        // 1. Get Real IP
        const ip = GeoService.getClientIp(req);

        // 2. Get Location Data
        const location = GeoService.getLocation(ip) || { country: 'US', city: 'Unknown', region: '', ll: [0, 0], timezone: 'UTC' } as any;

        // 🛡️ BILLING OVERRIDE (User Request: "Billing Info me address save to vahi send karna hai")
        // If user is logged in (tryAuth) and has a saved country, USE IT.
        const user = (req as any).user;

        if (user && user.orgId) {
            try {
                // Fetch FRESH billing info from DB (Token payload is minimal)
                const org = await Organization.findById(user.orgId).select('billing_info');

                if (org?.billing_info?.country) {
                    const billingCountry = org.billing_info.country;

                    // Override IP Location
                    location.country = billingCountry;
                    // console.log("👮‍♂️ Geo Overridden by Billing Address:", billingCountry);
                }
            } catch (dbError) {
                console.warn("Geo Controller: Failed to fetch user organization for override", dbError);
            }
        }

        // 3. Get Device Info
        const userAgent = req.headers['user-agent'] || '';
        const device = GeoService.getDeviceInfo(userAgent);

        // 4. Get Currency & Pricing Config (Now uses Billing Country if set)
        const currency = GeoService.getCurrencyConfig(location.country);

        // 5. Build Complete Config
        const config = {
            ip,
            location: location || {
                country: 'IN', // Default
                city: 'Unknown',
                region: '',
                timezone: 'Asia/Kolkata',
                ll: [20.5937, 78.9629]
            },
            currency,
            device
        };

        // 6. Send Response (Format: { success: true, data: { ... } })
        res.json({
            success: true,
            data: config
        });

    } catch (error) {
        console.error("Geo Config Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch geo config"
        });
    }
};
