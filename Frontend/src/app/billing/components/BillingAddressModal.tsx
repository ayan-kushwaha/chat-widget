'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, ShieldCheck, MapPin, Check, ChevronsUpDown, Phone, Locate, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useOrg } from '@/context/OrgContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useGeo } from "@/hooks/useGeo";

interface BillingAddressModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

interface CountryOption {
    label: string;
    value: string;
    phoneCode: string;
    flag: string;
}

interface StateOption {
    label: string;
    value: string;
}

interface CityOption {
    label: string;
    value: string;
}

// 🛠️ HOSTED HELPER COMPONENT: Searchable & Editable Select
interface SearchableSelectProps {
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    disabled?: boolean;
}


import { ScrollArea } from "@/components/ui/scroll-area";

import { useMotionTemplate, useMotionValue, motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, searchPlaceholder, disabled }) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    // Animation logic for "Glowing" effect (Matching Input component)
    const radius = 100;
    const [visible, setVisible] = useState(false);
    let mouseX = useMotionValue(0);
    let mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: any) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    // Find label for display
    const selectedLabel = options.find(opt => opt.value === value)?.label || value;

    // Filter options locally
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
                {/* Wrapped in motion.div for the glowing border effect */}
                <motion.div
                    style={{
                        background: useMotionTemplate`
                            radial-gradient(
                              ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
                              #3b82f6,
                              transparent 80%
                            )
                        `,
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setVisible(true)}
                    onMouseLeave={() => setVisible(false)}
                    className="group/input relative rounded-lg p-[2px] transition duration-300 inline-block w-full"
                >
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        // Applied exact classes from Input component + Button structure
                        className={cn(
                            "flex h-10 w-full rounded-md border-none px-3 py-2 text-sm text-neutral-900 shadow-input transition duration-400 font-normal text-left justify-between",
                            "bg-gray-50 dark:bg-zinc-800 dark:text-white dark:placeholder:text-neutral-500", // Colors
                            "focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-blue-500", // Focus
                            "group-hover/input:shadow-none disabled:cursor-not-allowed disabled:opacity-50",
                            // Button specific matching
                            "hover:bg-gray-50 dark:hover:bg-zinc-800" // prevent button default hover override
                        )}
                        disabled={disabled}
                    >
                        {value ? (
                            <span className="truncate">{selectedLabel}</span>
                        ) : (
                            <span className="text-neutral-400 dark:text-neutral-500">{placeholder}</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </motion.div>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-xl z-[60] overflow-hidden border-zinc-800 bg-zinc-900" align="start">
                <div className="flex flex-col max-h-[250px] bg-zinc-900 text-slate-200">
                    {/* Sticky Search Input */}
                    <div className="p-2 border-b border-zinc-800">
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            // Match Input style inside dropdown too? Or keep standard?
                            // User said "dropn vaj sam deign" - assuming Trigger primarily, but standard Input inside is safe.
                            // The Input component itself ALREADY has this style, so we just use <Input />.
                            // But we need to ensure local overrides don't break it. 
                            // Input component handles its own internal styling.
                            className="h-8 text-xs bg-zinc-800 border-none"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (filteredOptions.length === 0 && searchValue.trim()) {
                                        onChange(searchValue);
                                        setOpen(false);
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Scrollable List using ScrollArea */}
                    <ScrollArea
                        className="h-[200px] pointer-events-auto"
                        onWheel={(e) => e.stopPropagation()}
                    >
                        <div className="p-1">
                            {filteredOptions.length === 0 ? (
                                <div className="p-2 text-xs text-slate-500 text-center">
                                    No results.
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-1 w-full justify-start h-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 text-xs font-semibold px-2"
                                        onClick={() => {
                                            onChange(searchValue); // Set custom value
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full border border-indigo-500/50 flex items-center justify-center text-[10px]">+</span>
                                            Add "{searchValue}"
                                        </div>
                                    </Button>
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer transition-colors",
                                            "hover:bg-zinc-800 hover:text-white", // Dark theme hover
                                            value === option.value ? "bg-zinc-800 text-white font-medium" : "text-slate-400"
                                        )}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-3 w-3 flex-shrink-0",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="truncate">{option.label}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
};


export const BillingAddressModal: React.FC<BillingAddressModalProps> = ({ open, onOpenChange, onSuccess, initialData }) => {
    const { data: session } = useSession();
    const { activeOrg: organization, userProfileInActiveOrg, refreshOrgs } = useOrg();
    const geo = useGeo(); // 🌍 Use Geo Hook for Currency Guard

    const [loading, setLoading] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);


    // 🌍 Dynamic Data Lists
    const [countries, setCountries] = useState<CountryOption[]>([]);
    const [states, setStates] = useState<StateOption[]>([]);
    const [cities, setCities] = useState<CityOption[]>([]);
    const [isCompany, setIsCompany] = useState(false); // 🏢 Toggle User/Company Mode

    const [formData, setFormData] = useState({
        company_name: '', // Legal Entity Name (or Person Name if individual)
        attention_to: '', // Contact Person (Optional/Secondary)
        address_line1: '',
        city: '',
        state: '',
        state_name: '', // Full state name
        pincode: '',
        country: '',
        country_name: '', // Full country name
        phonePrefix: '+91',
        phone: '',
        tax_id: '' // Optional GST/VAT
    });

    // 💰 Pricing Tier Helper (Mirrors Backend geo.service.ts)
    const getPricingTier = (countryCode: string): string => {
        const code = countryCode?.toUpperCase();
        const LEVEL_POOR = ['PK', 'NP', 'LK', 'BD', 'AF', 'MV', 'VN', 'PH', 'ID', 'TH', 'KH', 'LA', 'MM', 'NG', 'EG', 'KE', 'GH', 'ZA', 'TZ', 'UG', 'DZ', 'MA', 'AR', 'VE', 'CO', 'UA'];
        const LEVEL_MIDDLE = ['AE', 'CN', 'BR', 'TR', 'RU', 'SA', 'MY'];
        const LEVEL_RICH = ['US', 'GB', 'CA', 'AU', 'DE', 'SG', 'FR', 'JP', 'KR', 'NL', 'SE', 'NO', 'DK', 'CH'];
        if (code === 'IN') return 'INDIA';
        if (LEVEL_POOR.includes(code)) return 'LOW';
        if (LEVEL_MIDDLE.includes(code)) return 'MIDDLE';
        if (LEVEL_RICH.includes(code)) return 'RICH';
        return 'RICH';
    };

    // 🔍 Currency Guard - Compare Pricing Tiers (NOT Country Codes)
    const detectedCountry = geo.location.country || 'IN';
    const selectedCountry = formData.country || detectedCountry;
    const isCurrencyMismatch = getPricingTier(detectedCountry) !== getPricingTier(selectedCountry);
    const newExpectedCurrency = selectedCountry === 'IN' ? 'INR' : 'USD';

    // 🚀 1. Fetch Countries on Mount
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await fetch('/api/geo/countries');
                const data = await res.json();
                setCountries(data);
            } catch (error) {
                console.error("Failed to load countries", error);
            }
        };
        fetchCountries();
    }, []);

    // 🔄 2. Reliable Auto-Fill / Data Loading
    useEffect(() => {
        if (open) {
            if (initialData && (initialData.address_line1 || initialData.country)) {
                // ✅ Check if data exists and populate (Fixes "auto fill hoke nhiaarha")
                const hasTaxId = !!initialData.tax_id;
                setIsCompany(hasTaxId);

                // Helper to strip emojis from text
                const stripEmoji = (text: string) => text.replace(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

                // Find country and state labels from loaded options
                const countryData = countries.find(c => c.value === initialData.country);
                const country_name = countryData?.label ? stripEmoji(countryData.label) : (initialData.country_name || initialData.country || '');

                setFormData(prev => ({
                    ...prev,
                    ...initialData,
                    company_name: initialData.company_name || userProfileInActiveOrg?.name || (session as any)?.user?.name || '',
                    attention_to: initialData.attention_to || userProfileInActiveOrg?.name || (session as any)?.user?.name || '',
                    country_name: country_name, // Set full country name
                    phonePrefix: initialData.phone?.includes('+') ? initialData.phone.split(' ')[0] : prev.phonePrefix,
                    phone: initialData.phone?.includes(' ') ? initialData.phone.split(' ')[1] : initialData.phone || ''
                }));

                // Fetch states for the saved country
                if (initialData.country) {
                    fetchStates(initialData.country).then(() => {
                        // After states are loaded, find state label
                        if (initialData.state) {
                            // States will be set by fetchStates, we need to wait and update in next effect
                            fetchCities(initialData.country, initialData.state);
                        }
                    });
                }
            } else if (!formData.company_name) {
                // New Entry: user hasn't typed anything yet, pre-fill Name
                const defaultName = userProfileInActiveOrg?.name || (session as any)?.user?.name || '';

                setFormData(prev => ({
                    ...prev,
                    company_name: defaultName,
                    attention_to: defaultName,
                    country: 'IN' // Default
                }));
                fetchStates('IN');
            }
        }
    }, [open, initialData, session, countries, userProfileInActiveOrg]);

    // 🔄 3. Update state_name after states are loaded
    useEffect(() => {
        if (states.length > 0 && formData.state && !formData.state_name) {
            const stateData = states.find(s => s.value === formData.state);
            if (stateData) {
                setFormData(prev => ({
                    ...prev,
                    state_name: stateData.label
                }));
            }
        }
    }, [states, formData.state]);

    const fetchStates = async (countryCode: string) => {
        try {
            // Support Custom Values: If countryCode is not in our list, states will be empty
            const exists = countries.find(c => c.value === countryCode);
            if (!exists && countries.length > 0) {
                setStates([]);
                setCities([]);
                return;
            }

            const res = await fetch(`/api/geo/states/${countryCode}`);
            const data = await res.json();
            setStates(data);
            setCities([]);
        } catch (error) {
            console.error("Failed to load states", error);
            setStates([]);
            setCities([]);
        }
    };

    const fetchCities = async (countryCode: string, stateCode: string) => {
        if (!countryCode || !stateCode) {
            setCities([]);
            return;
        }
        try {
            const res = await fetch(`/api/geo/cities/${countryCode}/${stateCode}`);
            const data = await res.json();
            setCities(data);
        } catch (error) {
            console.error("Failed to load cities", error);
            setCities([]);
        }
    };

    // 📡 3. "Detect Location" Logic (Nominatim)
    const handleAutoFill = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported by this browser.");
            return;
        }

        setFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

            try {
                const res = await fetch(url);
                const data = await res.json();
                const addr = data.address;

                // Determine Country (Try to match code, else use name)
                const detectedCountryCode = addr.country_code ? addr.country_code.toUpperCase() : 'IN';
                const countryMatch = countries.find(c => c.value === detectedCountryCode);

                // If country not found in list, use full name provided by Nominatim or Code
                const finalCountry = countryMatch ? detectedCountryCode : (addr.country || detectedCountryCode);

                // Find Phone Prefix (Sanitized)
                const newPrefix = countryMatch ? `+${countryMatch.phoneCode.replace('+', '')}` : '+91';

                // FIXED: Only Update Country & Prefix (User Requested: "ony contry sle arn ahai")
                setFormData(prev => ({
                    ...prev,
                    country: finalCountry,
                    phonePrefix: newPrefix,
                    pincode: addr.postcode || prev.pincode, // Auto-fill pincode if available
                    state: '',
                }));

                await fetchStates(finalCountry);
                toast.success("Location Detected!", { description: `${addr.country}` });

            } catch (error) {
                console.error("Auto-fill error", error);
                toast.error("Could not fetch address details.");
            } finally {
                setFetchingLocation(false);
            }
        }, (err) => {
            console.error("GPS Error", err);
            toast.error("Location access denied or failed.");
            setFetchingLocation(false);
        });
    };

    const handleCountryChange = (value: string) => {
        const countryData = countries.find(c => c.value === value);
        const newPrefix = countryData ? `+${countryData.phoneCode.replace('+', '')}` : formData.phonePrefix;

        // Strip emoji from country name
        const stripEmoji = (text: string) => text.replace(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

        setFormData(prev => ({
            ...prev,
            country: value,
            country_name: countryData?.label ? stripEmoji(countryData.label) : value, // Save full name without emoji
            phonePrefix: newPrefix,
            state: '',
            state_name: '', // Reset state name
            city: ''
        }));
        fetchStates(value);
    };

    const handleStateChange = (value: string) => {
        const stateData = states.find(s => s.value === value);
        setFormData(prev => ({
            ...prev,
            state: value,
            state_name: stateData?.label || value, // Save full name
            city: ''
        }));
        fetchCities(formData.country, value);
    };

    const [showMismatchWarning, setShowMismatchWarning] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation
        if (!formData.address_line1 || !formData.city || !formData.pincode || !formData.country || !formData.company_name) {
            toast.error("Please fill all required fields");
            return;
        }

        // 2. Mismatch Intercept
        if (isCurrencyMismatch) {
            setShowMismatchWarning(true);
            return;
        }

        // 3. Proceed if no mismatch
        await processSubmit();
    };

    const processSubmit = async () => {
        setLoading(true);

        try {
            // Re-validate just in case (though handled by handleSubmit)
            if (!formData.address_line1 || !formData.city || !formData.pincode || !formData.country || !formData.company_name) {
                setLoading(false);
                return;
            }

            const token = (session as any)?.accessToken;

            if (!token) {
                toast.error("Authentication Error", { description: "Session expired. Please refresh or login again." });
                setLoading(false);
                return;
            }
            const finalPhone = `${formData.phonePrefix} ${formData.phone}`;

            // Update user name in organization's users_access array
            const currentUserId = (session as any)?.user?.id;
            if (currentUserId && formData.company_name) {
                try {
                    // Update the user's name in organization.users_access array
                    await fetch('/api/organizations/update-user-name', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            orgId: organization?.id || organization?._id,
                            userId: currentUserId,
                            name: formData.company_name
                        })
                    });
                    console.log("✅ User name updated in organization!");
                } catch (err) {
                    console.warn("⚠️ Could not update user name in org:", err);
                }
            }

            // Save Billing Address
            const submitData = {
                ...formData,
                phone: finalPhone
                // company_name is already in formData
            };

            const res = await fetch('/api/organizations/billing-address', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    orgId: organization?.id || organization?._id || (session as any)?.user?.organizationId,
                    billing_info: submitData
                })
            });

            const data = await res.json();
            if (data.success) {
                // 🧠 DEEP SYNC: Authoritative Geo Config from Backend
                if (data.geoConfig) {
                    console.log("✅ Received Authoritative Geo Config:", data.geoConfig);

                    // 🟢 FIX: Safe JSON parse with fallback
                    let currentConfig = {};
                    try {
                        const stored = localStorage.getItem('cluaiz_geo_config');
                        if (stored) {
                            currentConfig = JSON.parse(stored);
                        }
                    } catch (err) {
                        console.warn("⚠️ Corrupted geo config in localStorage, resetting:", err);
                        localStorage.removeItem('cluaiz_geo_config'); // Clean up corrupted data
                    }

                    const newConfig = {
                        ...currentConfig,
                        location: {
                            ...(currentConfig as any).location,
                            country: formData.country, // Ensure Country Matches
                        },
                        currency: data.geoConfig // Strictly Use Backend Config
                    };
                    localStorage.setItem('cluaiz_geo_config', JSON.stringify(newConfig));
                    sessionStorage.setItem('cluaiz_geo_config', JSON.stringify(newConfig));

                    // Force Reload to apply new Pricing Tier globally
                    window.location.reload();
                }

                toast.success("Billing Details Updated", { description: "Address & Pricing synced." });
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(data.message || "Failed to save address");
            }
        } catch (error) {
            console.error("Save Error:", error);
            toast.error("Network error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                {/* Main Modal Content Layer: Fixed Height 95vh, Flex Column for Header/Scroll/Footer */}
                <DialogContent className="sm:max-w-[680px] max-h-[95vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:outline-none">
                    <DialogHeader className="px-5 pt-5 pb-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                Billing Information
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Providing correct information ensures valid tax invoices.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Scrollable Form Body */}
                    <ScrollArea className=" h-[65vh] ">
                        <div className="px-6 py-4 space-y-5">

                            {/* ⚠️ CURRENCY GUARD STRIP */}
                            {isCurrencyMismatch && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md text-xs text-amber-700 dark:text-amber-400">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Price will update to <strong>{newExpectedCurrency} ({newExpectedCurrency === 'INR' ? '₹' : '$'})</strong> for {countries.find(c => c.value === formData.country)?.label}.</span>
                                </div>
                            )}

                            <div className="space-y-4">

                                {/* 👤 ROW 1: FULL NAME (Hide if Company Mode) */}
                                {!isCompany && (
                                    <div className="space-y-1.5 animate-in fade-in duration-200">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Full Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            className="h-10 border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                                            placeholder="Your Name"
                                            value={formData.company_name}
                                            onChange={(e) => {
                                                setFormData({ ...formData, company_name: e.target.value, attention_to: e.target.value });
                                            }}
                                        />
                                    </div>
                                )}



                                {/* 🏭 ROW 1.5: COMPANY DETAILS (CONDITIONAL) */}
                                {isCompany && (
                                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Company Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                className="h-10"
                                                placeholder="Acme Corp"
                                                value={formData.company_name}
                                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GSTIN / Tax ID</Label>
                                            <Input
                                                className="h-10"
                                                placeholder="GSTIN..."
                                                value={formData.tax_id}
                                                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                                {/* 🏢 CHECKBOX TOGGLE */}
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="isCompany"
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={isCompany}
                                        onChange={(e) => setIsCompany(e.target.checked)}
                                    />
                                    <Label htmlFor="isCompany" className="text-sm cursor-pointer select-none text-slate-600 dark:text-slate-300">
                                        I am buying for a Business (GST Invoice)
                                    </Label>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 my-2" />

                                {/* 🌍 ROW 2: LOCATION (BIG) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Country <span className="text-red-500">*</span>
                                        </Label>
                                        <SearchableSelect
                                            options={countries}
                                            value={formData.country}
                                            onChange={handleCountryChange}
                                            placeholder="Select Country"
                                            searchPlaceholder="Search..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            State / Province <span className="text-red-500">*</span>
                                        </Label>
                                        <SearchableSelect
                                            options={states}
                                            value={formData.state}
                                            onChange={handleStateChange}
                                            placeholder={states.length > 0 ? "Select State" : "Enter State"}
                                            searchPlaceholder="Search state..."
                                        />
                                    </div>
                                </div>

                                {/* 🏙️ ROW 3: LOCATION (SMALL) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            City
                                        </Label>
                                        {cities.length > 0 ? (
                                            <SearchableSelect
                                                options={cities}
                                                value={formData.city}
                                                onChange={(val) => setFormData({ ...formData, city: val })}
                                                placeholder="Enter city..."
                                                searchPlaceholder="Search city..."
                                            />
                                        ) : (
                                            <Input
                                                className="h-10 border-slate-200 dark:border-zinc-800 bg-white"
                                                placeholder="Type your city..."
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-1.5 relative">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Pincode <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                className="h-10 pr-9"
                                                placeholder="110001"
                                                value={formData.pincode}
                                                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                            />
                                            {/* GPS Icon Button inside Input */}
                                            <button
                                                type="button"
                                                onClick={handleAutoFill}
                                                disabled={fetchingLocation}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                                title="Detect Location"
                                            >
                                                {fetchingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 🏠 ROW 4: STREET ADDRESS (FULL) */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Street Address <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        className="h-10"
                                        placeholder="Flat No, Building, Street Name"
                                        value={formData.address_line1}
                                        onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                                    />
                                </div>

                                {/* 📞 ROW 5: CONTACT (PHONE) */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Phone Number <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <div className="h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 text-sm font-medium flex items-center justify-center min-w-[60px] text-slate-600 dark:text-slate-300 select-none">
                                            {formData.phonePrefix}
                                        </div>
                                        <Input
                                            className="flex-1 h-10"
                                            placeholder="Enter mobile number"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                        />
                                    </div>
                                </div>



                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 z-10">
                        <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/30">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Verification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 🚨 CONFIRMATION ALERT DIALOG (Sibling, not Child) */}
            <AlertDialog open={showMismatchWarning} onOpenChange={setShowMismatchWarning}>
                <AlertDialogContent className="z-[99999]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Pricing Update</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-neutral-500 dark:text-neutral-400">
                                <p>
                                    We detected your location as <strong>{countries.find(c => c.value === geo.location.country)?.label || geo.location.country}</strong>,
                                    but you selected <strong>{countries.find(c => c.value === formData.country)?.label || formData.country}</strong>.
                                </p>
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md text-sm text-amber-800 dark:text-amber-400">
                                    According to our <a href="/policies/pricing" target="_blank" className="underline font-bold hover:text-amber-900">Fair Usage Policy</a>,
                                    your pricing will be updated to <strong>{newExpectedCurrency} ({newExpectedCurrency === 'INR' ? '₹' : '$'})</strong>.
                                </div>
                                <p className="text-xs text-slate-500">
                                    This ensures compliance with local tax regulations. Please confirm to proceed.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Wait, let me check</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                // Prevent default close logic if needed, but Action closes by default.
                                // We just need to trigger the submit.
                                processSubmit();
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Confirm & Save
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
