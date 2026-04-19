"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { ImageCropModal } from "./ImageCropModal";
import { Building2, MapPin, Globe, Phone, Target, Camera, Pencil, Lock, Check, Locate, Loader2, Plus, Trash2, Clock, Calendar, ChevronDown, ShieldAlert, Mail, X, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMotionTemplate, useMotionValue, motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
    DropdownMenu as DropdownMenuUI,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { uploadOrgAsset } from "@/api/org.api";
import { CollapsibleSection } from "./shared/CollapsibleSection";
import { SectionHeader, DayTimelineCard } from "./shared/DayTimelineCard";
import { ProfileViewMode } from "./sections/ProfileViewMode";
import { ProfileAddressEdit } from "./sections/ProfileAddressEdit";
import { ProfileContactEdit } from "./sections/ProfileContactEdit";
import { ProfileHoursEdit } from "./sections/ProfileHoursEdit";
import { ProfileClassificationEdit } from "./sections/ProfileClassificationEdit";
import { ProfileIdentityEdit } from "./sections/ProfileIdentityEdit";
import { ProfileImageHero } from "./sections/ProfileImageHero";
import { ProfileAccountEdit } from "./sections/ProfileAccountEdit";

// ── Extracted Components ──
import { ReadMoreText } from "./ReadMoreText";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { SearchableSelect } from "./SearchableSelect";
import { TileSelector } from "./TileSelector";
import { OTPInput } from "./OTPInput";

// ── Constants from shared file ──
import {
    DAYS,
    DEFAULT_WEEKLY_HOURS,
    HOURS_OPTIONS,
    SOCIAL_PLATFORMS,
    CONTACT_TYPES,
    INDUSTRY_GRADIENTS,
} from "./constants";

import {
    INDUSTRIES,
    BUSINESS_MODELS,
    AUDIENCES,
    PRIMARY_GOALS,
    PROFILE_FORM_SCHEMA,
    INDUSTRY_TAXONOMY
} from "./profileForm.schema";

const PREMIUM_CONTENT_STYLE = "text-lg text-neutral-800 dark:text-neutral-100 leading-relaxed font-black tracking-tight";

interface OrgProfile {
    name?: string;
    industry?: string;
    subCategory?: string;
    accountType?: string;
    tagline?: string;
    businessDescription?: string;
    businessModel?: string;
    targetAudience?: string;
    primaryGoal?: string;
    heroOffering?: string;
    companySize?: string;
    foundedYear?: string;
    contactPhone?: string;
    contactEmail?: string;
    website?: string;
    logo?: string;
    bannerImage?: string;
    operatingHours?: {
        type?: string;
        enabled?: boolean;
        weeklyHours?: Record<string, { enabled: boolean; start: string; end: string }>;
    };
    businessAddress?: { street?: string; city?: string; state?: string; country?: string; pincode?: string };
    contactChannels: { id: string; type: string; value: string; enabled: boolean }[];
    socialLinks: { id: string; platform: string; url: string; enabled: boolean }[];
    onboardingCompleted?: boolean;
}


export function BusinessProfileView({
    org,
    user,
    isEditing = false,
    onUserChange,
    onOrgChange,
    onStrategyGenerated
}: {
    org: OrgProfile;
    user?: {
        name: string,
        email: string,
        avatar: string,
        hasGoogle: boolean,
        hasPassword?: boolean,
        password_hash?: string,
        secondaryEmail?: {
            email: string,
            linkedAt: string,
            hasPassword?: boolean,
            password_hash?: string
        }
    };
    isEditing?: boolean;
    onUserChange?: (key: string, value: any) => void;
    onOrgChange?: (key: string, value: any) => void;
    onStrategyGenerated?: (strategy: any) => void; // Added for strategy generator
}) {
    const gradient = INDUSTRY_GRADIENTS[org.industry || "default"] || INDUSTRY_GRADIENTS.default;
    const location = [org.businessAddress?.city, org.businessAddress?.state, org.businessAddress?.country]
        .filter(Boolean).join(", ");

    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Crop modal state
    const [cropModal, setCropModal] = useState<{
        open: boolean;
        src: string;
        type: "logo" | "banner";
    }>({ open: false, src: "", type: "logo" });

    // Helper function for schema rules
    const showField = (section: keyof typeof PROFILE_FORM_SCHEMA, id: string) => {
        const field = PROFILE_FORM_SCHEMA[section].find(f => f.id === id);
        return field ? field.showIf(org) : true;
    };

    // Track which sections are open (default all closed)
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        identity: false,
        classification: false,
        strategy: false,
        contact: false,
        hours: false,
        address: false
    });

    // Cleaned up hash sync since passwords are not returned anymore
    // useEffect(() => { ... })

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Dynamic Address Lists
    const [countries, setCountries] = useState<{ label: string, value: string, phoneCode: string }[]>([]);
    const [states, setStates] = useState<{ label: string, value: string }[]>([]);
    const [cities, setCities] = useState<{ label: string, value: string }[]>([]);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    const [customInputs, setCustomInputs] = useState({
        industry: "",
        subCategory: "",
        businessModel: "",
        targetAudience: ""
    });

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

    const fetchStates = async (countryCode: string) => {
        try {
            const exists = countries.find(c => c.value === countryCode);
            if (!exists && countries.length > 0) {
                setStates([]); setCities([]); return;
            }
            const res = await fetch(`/api/geo/states/${countryCode}`);
            const data = await res.json();
            setStates(data);
            setCities([]);
        } catch (error) {
            setStates([]); setCities([]);
        }
    };

    const fetchCities = async (countryCode: string, stateCode: string) => {
        if (!countryCode || !stateCode) { setCities([]); return; }
        try {
            const res = await fetch(`/api/geo/cities/${countryCode}/${stateCode}`);
            const data = await res.json();
            setCities(data);
        } catch (error) {
            setCities([]);
        }
    };

    useEffect(() => {
        if (org.businessAddress?.country && countries.length > 0) {
            fetchStates(org.businessAddress.country);
        }
    }, [org.businessAddress?.country, countries]);

    useEffect(() => {
        if (org.businessAddress?.country && org.businessAddress?.state && states.length > 0) {
            fetchCities(org.businessAddress.country, org.businessAddress.state);
        }
    }, [org.businessAddress?.country, org.businessAddress?.state, states]);

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
                const detectedCountryCode = addr.country_code ? addr.country_code.toUpperCase() : 'IN';
                const countryMatch = countries.find(c => c.value === detectedCountryCode);
                const finalCountry = countryMatch ? detectedCountryCode : (addr.country || detectedCountryCode);

                if (onOrgChange) {
                    onOrgChange("businessAddress", {
                        ...org.businessAddress,
                        country: finalCountry,
                        pincode: addr.postcode || org.businessAddress?.pincode || "",
                        state: "",
                        city: ""
                    });
                    if (countryMatch) {
                        const newPrefix = `+${countryMatch.phoneCode.replace('+', '')}`;
                        if (!org.contactPhone?.startsWith('+')) {
                            onOrgChange("contactPhone", `${newPrefix} ${org.contactPhone || ''}`.trim());
                        }
                    }
                }
                toast.success("Location Detected!", { description: `${addr.country}` });
            } catch (error) {
                toast.error("Could not fetch address details.");
            } finally {
                setFetchingLocation(false);
            }
        }, (err) => {
            toast.error("Location access denied or failed.");
            setFetchingLocation(false);
        });
    };

    const handleCountryChange = (value: string) => {
        if (onOrgChange) {
            onOrgChange("businessAddress", { ...org.businessAddress, country: value, state: "", city: "" });
        }
    };

    const handleStateChange = (value: string) => {
        if (onOrgChange) {
            onOrgChange("businessAddress", { ...org.businessAddress, state: value, city: "" });
        }
    };

    // Handle nested org updates
    const handleAddressChange = (key: string, val: string) => {
        if (onOrgChange) {
            onOrgChange("businessAddress", { ...(org.businessAddress || {}), [key]: val });
        }
    };

    // --- Operating Hours Logic ---
    const timeToValue = (time: string) => {
        if (!time) return 9; // Default 9 AM
        const [h, m] = time.split(':').map(Number);
        return h + m / 60;
    };

    const valueToTime = (val: number) => {
        const h = Math.floor(val);
        const m = Math.round((val % 1) * 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const updateTimeRange = (day: string, values: number[]) => {
        const start = valueToTime(values[0]);
        const end = valueToTime(values[1]);
        const currentHours = org.operatingHours?.weeklyHours || DEFAULT_WEEKLY_HOURS;

        onOrgChange?.("operatingHours", {
            ...org.operatingHours,
            weeklyHours: {
                ...currentHours,
                [day]: { ...currentHours[day], start, end }
            }
        });
    };

    const toggleDay = (day: string) => {
        const currentHours = org.operatingHours?.weeklyHours || DEFAULT_WEEKLY_HOURS;
        onOrgChange?.("operatingHours", {
            ...org.operatingHours,
            weeklyHours: {
                ...currentHours,
                [day]: { ...currentHours[day], enabled: !currentHours[day].enabled }
            }
        });
    };

    const toggleAllHours = () => {
        onOrgChange?.("operatingHours", {
            ...org.operatingHours,
            enabled: !(org.operatingHours?.enabled ?? true)
        });
    };

    const weeklyHours = org.operatingHours?.weeklyHours || DEFAULT_WEEKLY_HOURS;

    const activeIndustryKey = INDUSTRIES.some(i => i.value === org.industry)
        ? org.industry
        : (org.industry ? "other" : "generic");

    const taxonomyData = INDUSTRY_TAXONOMY[activeIndustryKey as keyof typeof INDUSTRY_TAXONOMY] || INDUSTRY_TAXONOMY.other;

    const subCategoryOptions = taxonomyData.subCategories.map(s => ({ value: s.id, label: s.label, icon: s.icon }));
    const businessModelOptions = BUSINESS_MODELS.filter(m => taxonomyData.validModels.includes(m.value));
    const targetAudienceOptions = AUDIENCES.filter(a => taxonomyData.validAudiences.includes(a.value));

    return (
        <div className={cn(
            "rounded-2xl overflow-hidden border shadow-sm transition-colors duration-300",
            isEditing
                ? "border-blue-500/30 dark:border-blue-500/20 bg-white dark:bg-[#09090b] shadow-[0_0_30px_rgba(59,130,246,0.05)]"
                : "border-neutral-200 dark:border-white/10 bg-white dark:bg-[#09090b]"
        )}>
            <ProfileImageHero
                org={org}
                isEditing={isEditing}
                gradient={gradient}
                onOrgChange={onOrgChange!}
                cropModal={cropModal}
                setCropModal={setCropModal}
            />

            {/* ── Account Card: always visible (view + edit) ── */}
            <ProfileAccountEdit
                user={user}
                isEditing={isEditing}
                onUserChange={onUserChange as (field: string, value: any) => Promise<void>}
            />

            {/* ── Info Section ── */}
            <div className="p-6 sm:p-8 space-y-8">
                {isEditing ? (
                    // EDIT MODE FORM FIELDS
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* 1. Business Overview */}
                        <ProfileIdentityEdit
                            org={org}
                            isOpen={openSections.identity}
                            onToggle={toggleSection}
                            onOrgChange={onOrgChange!}
                        />

                        {/* 2. Classification Section (Dynamic from Schema) */}
                        <ProfileClassificationEdit
                            org={org as any}
                            isOpen={openSections.classification}
                            onToggle={toggleSection}
                            onOrgChange={onOrgChange!}
                            showField={showField}
                            customInputs={customInputs}
                            setCustomInputs={setCustomInputs}
                            subCategoryOptions={subCategoryOptions}
                            businessModelOptions={businessModelOptions}
                            targetAudienceOptions={targetAudienceOptions}
                        />

                        {/* 6. Contact Info */}
                        <ProfileContactEdit
                            org={org}
                            isOpen={openSections.contact}
                            onToggle={toggleSection}
                            onOrgChange={onOrgChange!}
                        />

                        {/* 5. Business Hours */}
                        <ProfileHoursEdit
                            org={org as any}
                            weeklyHours={weeklyHours}
                            isOpen={openSections.hours}
                            onToggle={toggleSection}
                            toggleAllHours={toggleAllHours}
                            toggleDay={toggleDay}
                            updateTimeRange={updateTimeRange}
                            timeToValue={timeToValue}
                        />

                        {/* 6. Address */}
                        <ProfileAddressEdit
                            businessAddress={org.businessAddress}
                            countries={countries}
                            states={states}
                            cities={cities}
                            fetchingLocation={fetchingLocation}
                            isOpen={openSections.address}
                            onToggle={toggleSection}
                            handleCountryChange={handleCountryChange}
                            handleStateChange={handleStateChange}
                            handleAddressChange={handleAddressChange}
                            handleAutoFill={handleAutoFill}
                        />
                    </div>
                ) : (
                    <ProfileViewMode
                        org={org}
                        subCategoryOptions={subCategoryOptions}
                        countries={countries}
                        states={states}
                        weeklyHours={weeklyHours}
                    />
                )}

            </div>
        </div>
    );
}


