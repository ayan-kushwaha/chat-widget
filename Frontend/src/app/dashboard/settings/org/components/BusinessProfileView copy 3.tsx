"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { ImageCropModal } from "./ImageCropModal";
import { Building2, MessageSquare, MapPin, Globe, Phone, Target, Camera, Pencil, Lock, Check, ChevronsUpDown, Locate, Loader2, Copy, Plus, Trash2, Zap, Clock, Calendar, ArrowLeft, CalendarCheck2, ChevronDown, ChevronUp, ShieldAlert, Scale, Mail, X, Eye, EyeOff, Briefcase, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMotionTemplate, useMotionValue, motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
    FaLinkedin, FaXTwitter, FaInstagram, FaFacebook, FaYoutube,
    FaWhatsapp, FaTelegram, FaGithub, FaTwitch, FaDiscord,
    FaReddit, FaPinterest, FaGlobe as FaGlobeIcon
} from "react-icons/fa6";
import { uploadOrgAsset } from "@/api/org.api";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_WEEKLY_HOURS: Record<string, { enabled: boolean; start: string; end: string }> = {
    'Monday': { enabled: true, start: "09:00", end: "18:00" },
    'Tuesday': { enabled: true, start: "09:00", end: "18:00" },
    'Wednesday': { enabled: true, start: "09:00", end: "18:00" },
    'Thursday': { enabled: true, start: "09:00", end: "18:00" },
    'Friday': { enabled: true, start: "09:00", end: "18:00" },
    'Saturday': { enabled: false, start: "10:00", end: "14:00" },
    'Sunday': { enabled: false, start: "10:00", end: "14:00" },
};

import {
    INDUSTRIES,
    BUSINESS_MODELS,
    AUDIENCES,
    PRIMARY_GOALS,
    ACCOUNT_TYPES,
    PROFILE_FORM_SCHEMA,
    INDUSTRY_TAXONOMY
} from "./profileForm.schema";

const HOURS_OPTIONS = [
    { value: "24/7", label: "24/7 Always Available" },
    { value: "business_hours", label: "Business Hours (9 AM – 6 PM)" },
    { value: "custom", label: "Custom Schedule" },
];

// Social Media Platforms
const SOCIAL_PLATFORMS = [
    { value: 'linkedin', label: 'LinkedIn', icon: FaLinkedin, color: 'text-blue-600', bg: 'bg-blue-600', placeholder: 'https://linkedin.com/in/yourbrand' },
    { value: 'twitter', label: 'X', icon: FaXTwitter, color: 'text-white', bg: 'bg-black', placeholder: 'https://x.com/yourbrand' },
    { value: 'instagram', label: 'Instagram', icon: FaInstagram, color: 'text-pink-600', bg: 'bg-pink-600', placeholder: 'https://instagram.com/yourbrand' },
    { value: 'facebook', label: 'Facebook', icon: FaFacebook, color: 'text-blue-700', bg: 'bg-blue-700', placeholder: 'https://facebook.com/yourbrand' },
    { value: 'youtube', label: 'YouTube', icon: FaYoutube, color: 'text-red-600', bg: 'bg-red-600', placeholder: 'https://youtube.com/@yourbrand' },
    { value: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, color: 'text-green-500', bg: 'bg-green-500', placeholder: 'https://wa.me/yourphone' },
    { value: 'telegram', label: 'Telegram', icon: FaTelegram, color: 'text-sky-500', bg: 'bg-sky-500', placeholder: 'https://t.me/yourbrand' },
    { value: 'github', label: 'GitHub', icon: FaGithub, color: 'text-gray-400', bg: 'bg-gray-800', placeholder: 'https://github.com/yourbrand' },
    { value: 'twitch', label: 'Twitch', icon: FaTwitch, color: 'text-purple-600', bg: 'bg-purple-600', placeholder: 'https://twitch.tv/yourbrand' },
    { value: 'discord', label: 'Discord', icon: FaDiscord, color: 'text-indigo-600', bg: 'bg-indigo-600', placeholder: 'https://discord.gg/yourinvite' },
    { value: 'reddit', label: 'Reddit', icon: FaReddit, color: 'text-orange-600', bg: 'bg-orange-600', placeholder: 'https://reddit.com/r/yourbrand' },
    { value: 'pinterest', label: 'Pinterest', icon: FaPinterest, color: 'text-red-600', bg: 'bg-red-600', placeholder: 'https://pinterest.com/yourbrand' },
    { value: 'location', label: 'Google Business Profile', icon: MapPin, color: 'text-rose-500', bg: 'bg-rose-500', placeholder: 'https://business.google.com/your-business' },
];

// Contact Types (Limited for Primary Reference)
const CONTACT_TYPES = [
    { value: 'email', label: 'Email', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-500', placeholder: 'hello@example.com' },
    { value: 'phone', label: 'Phone', icon: Phone, color: 'text-green-500', bg: 'bg-green-500', placeholder: '+1 (555) 000-0000' },
    { value: 'website', label: 'Website', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-500', placeholder: 'https://example.com' }
];

const ReadMoreText = ({ text, maxLength = 400 }: { text: string; maxLength?: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text) return null;
    if (text.length <= maxLength) return <>{text}</>;

    return (
        <span>
            {isExpanded ? text : `${text.slice(0, maxLength)}... `}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-500 hover:text-blue-600 font-black ml-1 text-xs uppercase tracking-tighter"
            >
                {isExpanded ? "Show Less" : "Read More"}
            </button>
        </span>
    );
};

// ── Auto-Resize Textarea Component ── //
function AutoResizeTextarea({
    value,
    onChange,
    placeholder,
    className,
    disabled,
    rows = 1,
    maxLength
}: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    rows?: number;
    maxLength?: number;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
                "w-full resize-none overflow-hidden ",
                className
            )}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
        />
    );
}

const PREMIUM_CONTENT_STYLE = "text-lg text-neutral-800 dark:text-neutral-100 leading-relaxed font-black tracking-tight";

interface SearchableSelectProps {
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, searchPlaceholder, disabled }) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const radius = 100;
    const [visible, setVisible] = useState(false);
    let mouseX = useMotionValue(0);
    let mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: any) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const selectedLabel = options.find(opt => opt.value === value)?.label || value;
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
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
                    className="group/input relative rounded-lg p-[2px] transition duration-300 inline-block w-full cursor-pointer"
                >
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-neutral-100 px-3 py-2 text-sm text-neutral-900 shadow-input transition duration-400 font-normal text-left justify-between",
                            "bg-gray-50 dark:bg-[#0e0e0e] dark:border-white/5 dark:text-white dark:placeholder:text-neutral-500",
                            "focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-blue-500",
                            "group-hover/input:shadow-none disabled:cursor-not-allowed disabled:opacity-50",
                            "hover:bg-gray-50 dark:hover:bg-[#0e0e0e]"
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
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-xl z-[60] overflow-hidden border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" align="start">
                <div className="flex flex-col max-h-[250px] bg-white dark:bg-zinc-900 text-neutral-900 dark:text-slate-200">
                    <div className="p-2 border-b border-neutral-100 dark:border-zinc-800">
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="h-8 text-xs bg-neutral-100 dark:bg-zinc-800 border-none"
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
                                        className="mt-1 w-full justify-start h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 text-xs font-semibold px-2"
                                        onClick={() => {
                                            onChange(searchValue);
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full border border-blue-500/50 flex items-center justify-center text-[10px]">+</span>
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
                                            "hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-900 dark:hover:text-white dark:text-slate-400",
                                            value === option.value ? "bg-neutral-100 dark:bg-zinc-800 font-medium" : ""
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

function TileSelector({ options, value, onChange }: { options: { value: string; label: string; icon: string }[]; value: string; onChange: (v: string) => void; }) {
    const [isEditingList, setIsEditingList] = useState(false);

    const isKnownValue = options.some(opt => opt.value === value);
    const hasOther = options.some(opt => opt.value === "other");
    const activeValue = (!isKnownValue && value && hasOther) ? "other" : value;

    // If an option is selected and we're not explicitly editing the list, only show the selected option
    const showOnlySelected = activeValue && !isEditingList;
    const displayedOptions = showOnlySelected ? options.filter(o => o.value === activeValue) : options;

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center h-4">
                {showOnlySelected && (
                    <button
                        type="button"
                        onClick={() => setIsEditingList(true)}
                        className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors ml-auto mr-1"
                    >
                        Change Selection
                    </button>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                {displayedOptions.map(opt => {
                    const isActive = activeValue === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setIsEditingList(false);
                            }}
                            className={cn(
                                "relative flex flex-col items-center gap-4 p-8 rounded-2xl text-center transition-all duration-300 ease-out border overflow-hidden group min-h-[160px] justify-center",
                                isActive
                                    ? "bg-blue-500/5 border-blue-500/30 shadow-2xl"
                                    : "bg-[#09090b] border-white/5 hover:bg-white/5 hover:border-white/10 shadow-sm"
                            )}
                        >
                            {/* Elegant Checkmark for active state */}
                            {isActive && (
                                <div className="absolute top-4 right-4 text-blue-500 animate-in zoom-in duration-200">
                                    <Check size={18} strokeWidth={3} />
                                </div>
                            )}

                            <div className={cn(
                                "p-4 rounded-2xl transition-all duration-300 transform group-hover:scale-110",
                                isActive ? "bg-blue-500/10 text-white scale-110 ring-2 ring-blue-500/20" : "bg-white/5 text-zinc-500 grayscale group-hover:grayscale-0 group-hover:text-zinc-300"
                            )}>
                                <span className="text-3xl">{opt.icon}</span>
                            </div>

                            <span className={cn(
                                "text-sm font-bold tracking-tight mt-2 transition-colors duration-300 uppercase",
                                isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                            )}>
                                {opt.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function OTPInput({ value, onChange, disabled }: { value: string; onChange: (val: string) => void; disabled?: boolean }) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const otpArray = value.split("").concat(Array(6).fill("")).slice(0, 6);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) return;

        const newOtp = [...otpArray];
        newOtp[index] = val.slice(-1);
        const combined = newOtp.join("");
        onChange(combined);

        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !otpArray[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
        if (pastedData.every(char => /^\d$/.test(char))) {
            onChange(pastedData.join(""));
            inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
        }
    };

    return (
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {Array(6).fill(0).map((_, i) => (
                <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otpArray[i]}
                    onChange={e => handleInput(e, i)}
                    onKeyDown={e => handleKeyDown(e, i)}
                    disabled={disabled}
                    className={cn(
                        "w-9 h-11 text-center text-lg font-bold rounded-lg border bg-white dark:bg-zinc-900 transition-all duration-200",
                        "border-neutral-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none",
                        "disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 dark:text-white"
                    )}
                />
            ))}
        </div>
    );
}

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

const INDUSTRY_GRADIENTS: Record<string, string> = {
    healthcare: "from-emerald-600 to-teal-500",
    saas: "from-blue-600 to-indigo-500",
    ecommerce: "from-orange-500 to-pink-500",
    finance: "from-slate-700 to-slate-500",
    education: "from-violet-600 to-purple-500",
    food: "from-amber-500 to-orange-400",
    fitness: "from-red-500 to-pink-500",
    creative: "from-fuchsia-500 to-pink-400",
    real_estate: "from-green-600 to-emerald-400",
    default: "from-blue-600 to-purple-600",
};

export function BusinessProfileView({
    org,
    user,
    isEditing = false,
    onUserChange,
    onOrgChange
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

    // Local state for password expansion
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [passwords, setPasswords] = useState({ current: user?.password_hash || "", new: "", confirm: "" });
    const [savingPrimPass, setSavingPrimPass] = useState(false);
    const [showCurrentPasswordPrim, setShowCurrentPasswordPrim] = useState(false);
    const [showNewPasswordPrim, setShowNewPasswordPrim] = useState(false);
    const [showConfirmPasswordPrim, setShowConfirmPasswordPrim] = useState(false);

    // Local state for secondary email linking
    const [showEmailLink, setShowEmailLink] = useState(false);
    const [linkEmail, setLinkEmail] = useState("");
    const [linkOtp, setLinkOtp] = useState("");

    // Secondary Password Flow State
    const [secondaryPassDraft, setSecondaryPassDraft] = useState({ current: "", new: "", confirm: "", otp: "" });
    const [savingSecPass, setSavingSecPass] = useState(false);
    const [secPassResetMode, setSecPassResetMode] = useState(false); // true when inline OTP is active
    const [sendingSecOtp, setSendingSecOtp] = useState(false);

    const [showSecondaryPasswordFields, setShowSecondaryPasswordFields] = useState(false);
    const [showCurrentPasswordSec, setShowCurrentPasswordSec] = useState(false);
    const [showNewPasswordSec, setShowNewPasswordSec] = useState(false);
    const [showConfirmPasswordSec, setShowConfirmPasswordSec] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [linking, setLinking] = useState(false);

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
            {/* Image Crop Modal */}
            <ImageCropModal
                open={cropModal.open}
                onClose={() => setCropModal(prev => ({ ...prev, open: false }))}
                imageSrc={cropModal.src}
                cropShape={cropModal.type === "logo" ? "round" : "rect"}
                aspect={cropModal.type === "logo" ? 1 : 4}
                title={cropModal.type === "logo" ? "Crop Logo" : "Crop Cover Banner"}
                onCropComplete={async (dataUrl) => {
                    const assetType = cropModal.type === "logo" ? "logo" : "banner";
                    const tid = toast.loading(`Uploading ${assetType}...`);
                    try {
                        const permanentUrl = await uploadOrgAsset(dataUrl, assetType);
                        if (onOrgChange) {
                            onOrgChange(cropModal.type === "logo" ? "logo" : "bannerImage", permanentUrl);
                        }
                        toast.success(`${assetType === 'logo' ? 'Logo' : 'Banner'} uploaded! ✅`, { id: tid });
                    } catch (err) {
                        console.error("Asset upload error:", err);
                        toast.error("Upload failed — please try again", { id: tid });
                    }
                }}
            />
            {/* ── Cover Banner ── */}
            <div
                className={cn("relative w-full bg-gradient-to-r transition-all duration-300", gradient)}
                style={{
                    aspectRatio: "4",
                    ...(org.bannerImage ? { backgroundImage: `url(${org.bannerImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {})
                }}
            >
                <div className="absolute inset-0 opacity-20 transition-opacity duration-500"
                    style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 60%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }}
                />
                {!isEditing && (
                    <div className="absolute bottom-3 right-4 text-white/30 text-4xl font-black select-none max-w-[60%] tracking-tighter mix-blend-overlay">
                        {org.name || "Your Business"}
                    </div>
                )}
                {isEditing && (
                    <>
                        <div
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group"
                            onClick={() => bannerInputRef.current?.click()}
                        >
                            <div className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 group-hover:scale-105 transition-transform">
                                <Camera className="w-4 h-4" />
                                <span className="text-sm font-medium">Change Cover</span>
                            </div>
                        </div>
                        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            e.target.value = "";
                            const url = URL.createObjectURL(file);
                            setCropModal({ open: true, src: url, type: "banner" });
                        }} />
                    </>
                )}
            </div>

            {/* ── Logo & User Info Header ── */}
            <div className="px-6 sm:px-8 relative flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4">
                {/* Org Logo overlapping banner */}
                <div className="relative -mt-12 sm:-mt-16 z-10 group">
                    <Avatar className={cn(
                        "h-24 w-24 sm:h-32 sm:w-32 border-4 border-white dark:border-[#09090b] shadow-xl transition-transform",
                        isEditing && "cursor-pointer group-hover:scale-105"
                    )} onClick={() => isEditing && logoInputRef.current?.click()}>
                        <AvatarImage src={org.logo} className="object-cover bg-white dark:bg-neutral-900" />
                        <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white font-bold text-3xl sm:text-4xl shadow-inner`}>
                            {org.name?.charAt(0)?.toUpperCase() || <Building2 className="h-10 w-10 sm:h-12 sm:w-12 opacity-80" />}
                        </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                        <>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer pointer-events-none border-4 border-transparent backdrop-blur-sm">
                                <Pencil className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-md" />
                            </div>
                            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                e.target.value = "";
                                const url = URL.createObjectURL(file);
                                setCropModal({ open: true, src: url, type: "logo" });
                            }} />
                        </>
                    )}
                </div>

                {/* Org Name beside logo */}
                <div className="flex-1 flex flex-col justify-end pb-2 mt-2 sm:mt-0 min-w-0">
                    {isEditing ? (
                        <input
                            value={org.name || ""}
                            onChange={e => onOrgChange?.("name", e.target.value)}
                            placeholder="Organization Name"
                            className="bg-transparent text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-0 border-b-2 border-blue-400 focus:outline-none focus:border-blue-500 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 pb-1 min-w-0 w-full max-w-sm transition-colors"
                        />
                    ) : (
                        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            {org.name || "Your Business"}
                        </h2>
                    )}
                    {org.tagline && !isEditing && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{org.tagline}</p>
                    )}
                </div>
            </div>

            {/* ── Account Card: always visible (view + edit) ── */}
            {user && (
                <div className="px-6 sm:px-8 pb-4 mx-2">
                    <div className="rounded-xl border border-neutral-100 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.03] p-4">
                        {/* Google Account row */}
                        <div className="flex items-center justify-between">
                            {/* Left: Google icon + user name/email/avatar */}
                            <div className="flex items-center gap-3">
                                {/* Google avatar or placeholder */}
                                {user.hasGoogle ? (
                                    <Avatar className="h-10 w-10 border-2 border-blue-300 dark:border-blue-400/40 shadow-sm shrink-0">
                                        <AvatarImage src={user.avatar} className="object-cover" referrerPolicy="no-referrer" />
                                        <AvatarFallback className="bg-neutral-200 dark:bg-neutral-800 text-sm font-bold">
                                            {user.name?.charAt(0)?.toUpperCase() || "G"}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 opacity-40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{user.name || "Owner"}</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
                                </div>
                            </div>
                            {/* Right: Linked badge or Google Account info */}
                            {user.hasGoogle ? (
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/25">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                        Linked with Google
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xs text-neutral-400 italic">No Google Account</span>
                            )}
                        </div>

                        {/* Secondary Linked Email */}
                        {user.secondaryEmail?.email && (
                            <div className="flex flex-col gap-3 pt-3 mt-3 border-t border-neutral-200 dark:border-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                            <Mail className="w-4 h-4 text-neutral-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">Secondary Email</p>
                                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{user.secondaryEmail.email}</p>
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-3 text-[10px] font-bold tracking-tight border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all active:scale-95 flex items-center gap-1.5"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this secondary email connection?")) {
                                                    onUserChange?.("unlinkEmail", user.secondaryEmail?.email);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </Button>
                                    )}
                                </div>

                                {/* Secondary Password Section (Unified UI) */}
                                {isEditing && user.secondaryEmail && (
                                    <div className="mt-4 p-3 rounded-lg bg-neutral-100/50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-3.5 h-3.5 text-blue-500" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Secondary Security</p>
                                                    <p className="text-[9px] text-neutral-500">
                                                        {user.secondaryEmail.hasPassword ? "Change secondary password" : "Set a secondary password"}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant={showSecondaryPasswordFields ? "secondary" : "outline"}
                                                size="sm"
                                                className="h-7 px-2.5 text-[10px] font-bold"
                                                onClick={() => {
                                                    setShowSecondaryPasswordFields(!showSecondaryPasswordFields);
                                                    setSecondaryPassDraft({ current: "", new: "", confirm: "", otp: "" });
                                                }}
                                            >
                                                {showSecondaryPasswordFields ? "Cancel" : (user.secondaryEmail.hasPassword ? "Change Password" : "Set Password")}
                                            </Button>
                                        </div>

                                        {showSecondaryPasswordFields && (
                                            <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-white/10 animate-in fade-in slide-in-from-top-1">
                                                {user.secondaryEmail.hasPassword && (
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold ml-1 uppercase tracking-tight">Current Password</Label>
                                                        {secPassResetMode ? (
                                                            <Input
                                                                type="text"
                                                                placeholder="Enter 6-digit OTP"
                                                                value={secondaryPassDraft.otp}
                                                                onChange={e => setSecondaryPassDraft({ ...secondaryPassDraft, otp: e.target.value })}
                                                                maxLength={6}
                                                            />
                                                        ) : (
                                                            <div className="relative group/pass">
                                                                <Input
                                                                    type={showCurrentPasswordSec ? "text" : "password"}
                                                                    placeholder="Enter your current password"
                                                                    className="h-10 text-sm bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 pr-10 focus:ring-2 focus:ring-blue-500/20 w-full"
                                                                    value={secondaryPassDraft.current}
                                                                    onChange={e => setSecondaryPassDraft({ ...secondaryPassDraft, current: e.target.value })}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowCurrentPasswordSec(!showCurrentPasswordSec)}
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                                                >
                                                                    {showCurrentPasswordSec ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold ml-1 uppercase tracking-tight">New Password</Label>
                                                    <div className="relative group/pass">
                                                        <Input
                                                            type={showNewPasswordSec ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            className="h-10 text-sm bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 pr-10"
                                                            value={secondaryPassDraft.new}
                                                            onChange={e => setSecondaryPassDraft({ ...secondaryPassDraft, new: e.target.value })}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewPasswordSec(!showNewPasswordSec)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                                        >
                                                            {showNewPasswordSec ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold ml-1 uppercase tracking-tight">Confirm Password</Label>
                                                    <div className="relative group/pass">
                                                        <Input
                                                            type={showConfirmPasswordSec ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            className="h-10 text-sm bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 pr-10"
                                                            value={secondaryPassDraft.confirm}
                                                            onChange={e => setSecondaryPassDraft({ ...secondaryPassDraft, confirm: e.target.value })}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPasswordSec(!showConfirmPasswordSec)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                                        >
                                                            {showConfirmPasswordSec ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center gap-2 mt-2">
                                                    {user.secondaryEmail.hasPassword && !secPassResetMode && (
                                                        <button
                                                            type="button"
                                                            disabled={sendingSecOtp}
                                                            onClick={async () => {
                                                                setSendingSecOtp(true);
                                                                try {
                                                                    await onUserChange?.("sendSecondaryResetOtp", null);
                                                                    setSecPassResetMode(true);
                                                                    setSecondaryPassDraft(s => ({ ...s, current: "", otp: "" })); // Clear current password and otp
                                                                } finally {
                                                                    setSendingSecOtp(false);
                                                                }
                                                            }}
                                                            className="text-[10px] text-blue-500 hover:text-blue-400 font-semibold transition-colors disabled:opacity-50"
                                                        >
                                                            {sendingSecOtp ? "Sending OTP..." : "Forgot password? Get OTP via Email"}
                                                        </button>
                                                    )}
                                                    {secPassResetMode && (
                                                        <span className="text-[10px] text-neutral-500 mr-auto">OTP sent to {user.secondaryEmail.email}</span>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        className="h-10 text-xs font-bold px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 rounded-lg active:scale-95 transition-all ml-auto"
                                                        disabled={
                                                            savingSecPass ||
                                                            !secondaryPassDraft.new ||
                                                            secondaryPassDraft.new.length < 6 ||
                                                            secondaryPassDraft.new !== secondaryPassDraft.confirm ||
                                                            (secPassResetMode ? secondaryPassDraft.otp.length !== 6 : false)
                                                        }
                                                        onClick={async () => {
                                                            setSavingSecPass(true);
                                                            try {
                                                                if (secPassResetMode) {
                                                                    await onUserChange?.("resetSecondaryWithOtp", {
                                                                        otp: secondaryPassDraft.otp,
                                                                        new: secondaryPassDraft.new
                                                                    });
                                                                } else {
                                                                    await onUserChange?.("setSecondaryPassword", {
                                                                        current: secondaryPassDraft.current,
                                                                        new: secondaryPassDraft.new
                                                                    });
                                                                }
                                                                setSecondaryPassDraft({ current: "", new: "", confirm: "", otp: "" });
                                                                setSecPassResetMode(false);
                                                                setShowSecondaryPasswordFields(false);
                                                                setShowCurrentPasswordSec(false);
                                                            } catch (e) { } finally {
                                                                setSavingSecPass(false);
                                                            }
                                                        }}
                                                    >
                                                        {savingSecPass ? "Saving..." : "Update Password"}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {!showSecondaryPasswordFields && (
                                            <p className="mt-1.5 text-[9px] text-neutral-400 italic">Login directly using <span className="text-neutral-300 font-medium">{user.secondaryEmail.email}</span></p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Add Secondary Email Form - Limited to 1 email */}
                        {isEditing && !user.secondaryEmail && (
                            <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-white/5 space-y-3">
                                {!showEmailLink ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 w-full justify-start gap-2.5 rounded-lg border border-dashed border-blue-200 dark:border-blue-500/20"
                                        onClick={() => setShowEmailLink(true)}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Link a Secondary Account (Login via OTP)
                                    </Button>
                                ) : (
                                    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-lg p-3 space-y-3 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Link Secondary Email</p>
                                            <button
                                                onClick={() => { setShowEmailLink(false); setOtpSent(false); setLinkEmail(""); setLinkOtp(""); }}
                                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {!otpSent ? (
                                            <div className="space-y-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <Label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold ml-1">Secondary Email Address</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="e.g. personal@email.com"
                                                            type="email"
                                                            className="h-10 flex-1 w-[320px] text-sm bg-neutral-50 dark:bg-zinc-800/50 border-neutral-200 dark:border-zinc-800 transition-all focus:ring-2 focus:ring-blue-500/20"
                                                            value={linkEmail}
                                                            onChange={(e) => setLinkEmail(e.target.value)}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            className="h-10 px-4 mt-[1px] bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20"
                                                            disabled={!linkEmail.includes("@") || linking}
                                                            onClick={async () => {
                                                                setLinking(true);
                                                                try {
                                                                    await onUserChange?.("sendLinkOtp", linkEmail);
                                                                    setOtpSent(true);
                                                                } finally {
                                                                    setLinking(false);
                                                                }
                                                            }}
                                                        >
                                                            {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 py-2">
                                                <div className="text-center space-y-1">
                                                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">Verification Required</p>
                                                    <p className="text-[11px] text-neutral-500">We've sent a 6-digit code to <span className="text-blue-500 font-semibold">{linkEmail}</span></p>
                                                </div>

                                                <OTPInput
                                                    value={linkOtp}
                                                    onChange={setLinkOtp}
                                                    disabled={linking}
                                                />

                                                <div className="flex flex-col gap-2 pt-2">
                                                    <Button
                                                        className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-lg shadow-green-500/20"
                                                        disabled={linkOtp.length < 6 || linking}
                                                        onClick={async () => {
                                                            setLinking(true);
                                                            try {
                                                                await onUserChange?.("verifyLinkOtp", { email: linkEmail, otp: linkOtp });
                                                                setShowEmailLink(false);
                                                                setOtpSent(false);
                                                                setLinkEmail("");
                                                                setLinkOtp("");
                                                            } finally {
                                                                setLinking(false);
                                                            }
                                                        }}
                                                    >
                                                        {linking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                                        {linking ? "Verifying..." : "Verify & Link Account"}
                                                    </Button>

                                                    <button
                                                        onClick={() => setOtpSent(false)}
                                                        className="text-[11px] text-neutral-500 hover:text-blue-500 transition-colors py-1"
                                                    >
                                                        Didn't receive code? <span className="font-semibold underline">Edit email or Resend</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* 🔐 Password Section — Edit Mode Only */}
            {isEditing && user && (
                <div className="px-6 sm:px-8 pb-4 mx-2">
                    <div className="rounded-xl border border-neutral-100 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-neutral-500" />
                                <div>
                                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Password</p>
                                    <p className="text-xs text-neutral-500">
                                        {user.hasPassword ? "Change your password" : "Set a password for email login"}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={showPasswordFields ? "secondary" : "outline"}
                                size="sm"
                                className="h-8 text-xs font-medium"
                                onClick={() => {
                                    setShowPasswordFields(!showPasswordFields);
                                    if (!showPasswordFields) {
                                        setPasswords({ current: "", new: "", confirm: "" });
                                    }
                                }}
                            >
                                {showPasswordFields ? "Cancel" : (user.hasPassword ? "Change Password" : "Set Password")}
                            </Button>
                        </div>
                        {showPasswordFields && (
                            <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-white/10 animate-in fade-in slide-in-from-top-1">
                                {user.hasPassword && (
                                    <div className="space-y-1.5 w-full">
                                        <Label className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold ml-1 uppercase tracking-tight">Current Password</Label>
                                        <div className="relative group/pass">
                                            <Input
                                                type={showCurrentPasswordPrim ? "text" : "password"}
                                                placeholder="Enter your current password"
                                                className="h-10 text-sm bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 pr-10 focus:ring-2 focus:ring-blue-500/20 w-full"
                                                value={passwords.current}
                                                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPasswordPrim(!showCurrentPasswordPrim)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                            >
                                                {showCurrentPasswordPrim ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1.5 w-full">
                                    <Label className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold ml-1 uppercase tracking-tight">New Password</Label>
                                    <div className="relative group/pass">
                                        <Input
                                            type={showNewPasswordPrim ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="h-10 text-sm bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 w-full pr-10"
                                            value={passwords.new}
                                            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPasswordPrim(!showNewPasswordPrim)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                        >
                                            {showNewPasswordPrim ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5 w-full">
                                    <Label className="text-[10px] text-neutral-600 dark:text-neutral-400 font-bold ml-1 uppercase tracking-tight">Confirm Password</Label>
                                    <div className="relative group/pass">
                                        <Input
                                            type={showConfirmPasswordPrim ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="h-10 text-sm bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 w-full pr-10"
                                            value={passwords.confirm}
                                            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPasswordPrim(!showConfirmPasswordPrim)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                        >
                                            {showConfirmPasswordPrim ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <Button
                                        size="sm"
                                        className="h-10 text-xs font-bold px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 rounded-lg active:scale-95 transition-all"
                                        disabled={
                                            savingPrimPass ||
                                            !passwords.new ||
                                            passwords.new.length < 6 ||
                                            passwords.new !== passwords.confirm
                                        }
                                        onClick={async () => {
                                            setSavingPrimPass(true);
                                            try {
                                                await onUserChange?.("setPrimaryPassword", passwords);
                                                setShowPasswordFields(false);
                                                setShowCurrentPasswordPrim(false);
                                            } catch (e) {
                                                // error shown by parent
                                            } finally {
                                                setSavingPrimPass(false);
                                            }
                                        }}
                                    >
                                        {savingPrimPass ? "Saving..." : (user.hasPassword ? "Update Password" : "Set Password")}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Info Section ── */}
            <div className="p-6 sm:p-8 space-y-8">
                {isEditing ? (
                    // EDIT MODE FORM FIELDS
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* 1. Business Overview */}
                        <CollapsibleSection
                            id="identity"
                            title="Business Overview"
                            icon={Building2}
                            isOpen={openSections.identity}
                            onToggle={toggleSection}
                        >
                            <div className="grid sm:grid-cols-2 gap-4 pb-4 px-1">
                                <div className="sm:col-span-2 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Business Tagline</Label>
                                        <span className="text-[10px] text-zinc-400">{(org.tagline || "").length}/140</span>
                                    </div>
                                    <AutoResizeTextarea
                                        maxLength={140}
                                        value={org.tagline || ""}
                                        onChange={val => onOrgChange?.("tagline", val)}
                                        placeholder="e.g. Revolutionizing AI workspace productivity"
                                        className="min-h-[40px]"
                                    />
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Company Overview</Label>
                                        <span className="text-[10px] text-zinc-400">{(org.businessDescription || "").length}/1200</span>
                                    </div>
                                    <AutoResizeTextarea
                                        maxLength={1200}
                                        value={org.businessDescription || ""}
                                        onChange={val => onOrgChange?.("businessDescription", val)}
                                        placeholder="Briefly explain what your business does, who you serve, and the problem you solve. This helps our AI represent you better."
                                        rows={4}
                                        className="min-h-[100px] px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* 2. Classification Section (Dynamic from Schema) */}
                        <CollapsibleSection
                            id="classification"
                            title="Classification & Strategy"
                            icon={Target}
                            isOpen={openSections.classification}
                            onToggle={toggleSection}
                        >
                            <div className="grid gap-6 pb-4">
                                {PROFILE_FORM_SCHEMA.classification.map((field: any) => {
                                    if (!showField("classification", field.id)) return null;

                                    return (
                                        <div key={field.id} className="space-y-2 mx-1">
                                            <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                                                {field.label}
                                            </Label>

                                            {field.type === "tile" && (
                                                <>
                                                    <TileSelector
                                                        options={
                                                            field.id === "subCategory" ? subCategoryOptions :
                                                                field.id === "businessModel" ? businessModelOptions :
                                                                    field.id === "targetAudience" ? targetAudienceOptions :
                                                                        field.options
                                                        }
                                                        value={(org as any)[field.id] || ""}
                                                        onChange={v => {
                                                            if (v === 'other') {
                                                                setCustomInputs(prev => ({ ...prev, [field.id]: '' }));
                                                                onOrgChange?.(field.id, 'other');
                                                            } else {
                                                                onOrgChange?.(field.id, v);
                                                            }
                                                            if (field.id === "industry") onOrgChange?.("subCategory", "");
                                                        }}
                                                    />

                                                    {/* Custom 'Other' Input */}
                                                    {((field.id === "industry" && !INDUSTRIES.some(i => i.value === org.industry) && org.industry) ||
                                                        (field.id === "subCategory" && !subCategoryOptions.some(i => i.value === org.subCategory) && org.subCategory) ||
                                                        (field.id === "businessModel" && !businessModelOptions.some(i => i.value === org.businessModel) && org.businessModel) ||
                                                        (field.id === "targetAudience" && !targetAudienceOptions.some(i => i.value === org.targetAudience) && org.targetAudience) ||
                                                        (org as any)[field.id] === "other") && (
                                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 transition-all opacity-100 mt-2 space-y-1">
                                                                <div className="flex justify-end pr-1">
                                                                    <span className="text-[10px] text-zinc-400">
                                                                        {(customInputs[field.id as keyof typeof customInputs] ||
                                                                            ((org as any)[field.id] !== 'other' ? (org as any)[field.id] as string : "") || "").length}/60
                                                                    </span>
                                                                </div>
                                                                <Input
                                                                    maxLength={60}
                                                                    placeholder={`Please specify your ${field.label.toLowerCase()}...`}
                                                                    value={customInputs[field.id as keyof typeof customInputs] ||
                                                                        ((org as any)[field.id] !== 'other' ? (org as any)[field.id] : "")}
                                                                    onChange={e => {
                                                                        setCustomInputs(prev => ({ ...prev, [field.id]: e.target.value }));
                                                                        onOrgChange?.(field.id, e.target.value || 'other');
                                                                    }}
                                                                    className="h-10 text-sm bg-neutral-50 dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800 transition-all focus:ring-2 focus:ring-blue-500/20"
                                                                />
                                                            </div>
                                                        )}
                                                </>
                                            )}

                                            {field.type === "slider" && (
                                                <div className="space-y-4 pt-2">
                                                    <div className="flex justify-between items-center">
                                                        <Badge variant="secondary" className="bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 ml-auto">
                                                            {parseInt((org as any)[field.id] || "1", 10) === 1000 ? '1000+' : ((org as any)[field.id] || "1")}
                                                        </Badge>
                                                    </div>
                                                    <Slider
                                                        min={field.min}
                                                        max={field.max}
                                                        step={1}
                                                        value={[parseInt((org as any)[field.id] || "1", 10)]}
                                                        onValueChange={(vals) => onOrgChange?.(field.id, vals[0].toString())}
                                                        className="py-2"
                                                    />
                                                </div>
                                            )}

                                            {field.type === "date" && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal border-neutral-200 bg-gray-50 dark:border-white/5 dark:bg-[#0e0e0e]",
                                                                !(org as any)[field.id] && "text-neutral-400"
                                                            )}
                                                        >
                                                            <Calendar className="mr-2 h-4 w-4" />
                                                            {(org as any)[field.id] ? format(new Date((org as any)[field.id]), "PPP") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <CalendarUI
                                                            mode="single"
                                                            selected={(org as any)[field.id] ? new Date((org as any)[field.id]) : undefined}
                                                            onSelect={(date) => onOrgChange?.(field.id, date ? date.toISOString() : "")}
                                                            initialFocus
                                                            disabled={(date) => date > new Date() || date < new Date("1800-01-01")}
                                                            captionLayout="dropdown"
                                                            startMonth={new Date("1800-01-01")}
                                                            endMonth={new Date()}
                                                            defaultMonth={(org as any)[field.id] ? new Date((org as any)[field.id]) : new Date()}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            )}

                                            {field.type === "textarea" && (
                                                <div className="space-y-1">
                                                    <div className="flex justify-end pr-1">
                                                        <span className="text-[10px] text-zinc-400">
                                                            {((org as any)[field.id] || "").length}/{field.maxLength || 800}
                                                        </span>
                                                    </div>
                                                    <AutoResizeTextarea
                                                        maxLength={field.maxLength || 800}
                                                        value={(org as any)[field.id] || ""}
                                                        onChange={val => onOrgChange?.(field.id, val)}
                                                        placeholder={field.placeholder}
                                                        rows={3}
                                                        className="min-h-[80px] "
                                                    />
                                                </div>
                                            )}

                                            {field.type === "text" && (
                                                <Input
                                                    value={(org as any)[field.id] || ""}
                                                    onChange={e => onOrgChange?.(field.id, e.target.value)}
                                                    placeholder={field.placeholder}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CollapsibleSection>



                        {/* 6. Contact Info */}
                        <CollapsibleSection
                            id="contact"
                            title="Contact Channels"
                            icon={Phone}
                            isOpen={openSections.contact}
                            onToggle={toggleSection}
                        >
                            <div className="space-y-6 pb-4">
                                {/* Base Primary Contacts */}
                                <div className="space-y-4 border-b border-neutral-100 dark:border-white/5 pb-6">
                                    <Label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mb-2 block">Primary Channels</Label>

                                    {/* Primary Phone */}
                                    <div className="flex items-center gap-3 bg-[#0e0e0e]/40 p-3 rounded-[1.25rem] border border-neutral-100 dark:border-white/5 group">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-500/10 border border-green-500/20">
                                            <Phone className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 ml-1">Primary Phone</div>
                                            <Input
                                                value={org.contactPhone || ""}
                                                onChange={e => onOrgChange?.("contactPhone", e.target.value)}
                                                placeholder="+1 (555) 000-0000"
                                                className="h-9 bg-[#0e0e0e]/40 dark:bg-zinc-900/40 text-sm border-white/5"
                                            />
                                        </div>
                                    </div>

                                    {/* Primary Email */}
                                    <div className="flex items-center gap-3 bg-[#0e0e0e]/40 p-3 rounded-[1.25rem] border border-neutral-100 dark:border-white/5 group">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500/10 border border-blue-500/20">
                                            <Mail className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 ml-1">Primary Email</div>
                                            <Input
                                                value={org.contactEmail || ""}
                                                onChange={e => onOrgChange?.("contactEmail", e.target.value)}
                                                placeholder="contact@business.com"
                                                className="h-9 bg-[#0e0e0e]/40 dark:bg-zinc-900/40 text-sm border-white/5"
                                            />
                                        </div>
                                    </div>

                                    {/* Main Website */}
                                    <div className="flex items-center gap-3 bg-[#0e0e0e]/40 p-3 rounded-[1.25rem] border border-neutral-100 dark:border-white/5 group">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-500/10 border border-purple-500/20">
                                            <Globe className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 ml-1">Main Website</div>
                                            <Input
                                                value={org.website || ""}
                                                onChange={e => onOrgChange?.("website", e.target.value)}
                                                placeholder="https://yourbusiness.com"
                                                className="h-9 bg-[#0e0e0e]/40 dark:bg-zinc-900/40 text-sm border-white/5"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Contact Channels */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mr-2">Social Profiles</Label>
                                        <DropdownMenuUI>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 border-dashed border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5">
                                                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                    Add Social
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/10 scrollbar-hide">
                                                {SOCIAL_PLATFORMS.map((platform) => {
                                                    const isSelected = (org.socialLinks || []).some((s: any) => s.platform === platform.value);
                                                    return (
                                                        <DropdownMenuItem
                                                            key={platform.value}
                                                            onClick={() => {
                                                                if (isSelected) return;
                                                                const newLink = {
                                                                    id: Date.now().toString(),
                                                                    platform: platform.value,
                                                                    url: '',
                                                                    enabled: true
                                                                };
                                                                onOrgChange?.("socialLinks", [...(org.socialLinks || []), newLink]);
                                                            }}
                                                            className="flex items-center justify-between gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-white/5"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <platform.icon className={cn("w-4 h-4", platform.value === 'twitter' ? 'text-neutral-900 dark:text-white' : platform.color)} />
                                                                <span>{platform.label}</span>
                                                            </div>
                                                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-500" />}
                                                        </DropdownMenuItem>
                                                    );
                                                })}
                                            </DropdownMenuContent>
                                        </DropdownMenuUI>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Render Dynamic Contact Items (If any left) */}
                                        {(org.contactChannels || []).map((item: any) => {
                                            const typeDef = CONTACT_TYPES.find(t => t.value === item.type);
                                            const Icon = typeDef?.icon || MapPin;
                                            return (
                                                <div key={item.id} className="flex items-center gap-3 bg-[#0e0e0e]/40 p-3 rounded-[1.25rem] border border-neutral-100 dark:border-white/5 group">
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10 shadow-sm", typeDef?.color)}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 ml-1">{typeDef?.label}</div>
                                                        <Input
                                                            value={item.value}
                                                            onChange={(e) => {
                                                                const newChannels = (org.contactChannels || []).map((c: any) => c.id === item.id ? { ...c, value: e.target.value } : c);
                                                                onOrgChange?.("contactChannels", newChannels);
                                                            }}
                                                            placeholder={typeDef?.placeholder}
                                                            className="h-9 bg-[#0e0e0e]/40 dark:bg-zinc-900/40 text-sm border-white/5"
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onOrgChange?.("contactChannels", (org.contactChannels || []).filter((c: any) => c.id !== item.id))}
                                                        className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}

                                        {/* Render Social Links */}
                                        {(org.socialLinks || []).map((link: any) => {
                                            const platform = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
                                            const Icon = platform?.icon || Globe;
                                            return (
                                                <div key={link.id} className="flex items-center gap-3 bg-[#0e0e0e]/40 p-3 rounded-[1.25rem] border border-neutral-100 dark:border-white/5 group">
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10 shadow-sm", link.platform === 'twitter' ? 'text-neutral-900 dark:text-white' : platform?.color)}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 ml-1">{platform?.label}</div>
                                                        <Input
                                                            value={link.url}
                                                            onChange={(e) => {
                                                                const newSocials = (org.socialLinks || []).map((s: any) => s.id === link.id ? { ...s, url: e.target.value } : s);
                                                                onOrgChange?.("socialLinks", newSocials);
                                                            }}
                                                            placeholder={platform?.placeholder}
                                                            className="h-9 bg-[#0e0e0e]/40 dark:bg-zinc-900/40 text-sm border-white/5"
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onOrgChange?.("socialLinks", (org.socialLinks || []).filter((s: any) => s.id !== link.id))}
                                                        className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}

                                        {(org.contactChannels?.length === 0 && org.socialLinks?.length === 0) && (
                                            <div className="text-center py-6 text-neutral-400 text-xs italic bg-[#0e0e0e]/40 rounded-2xl border border-dashed border-neutral-200 dark:border-white/10">
                                                No additional channels added yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* 5. Business Hours */}
                        <CollapsibleSection
                            id="hours"
                            title="Business Hours"
                            icon={Clock}
                            isOpen={openSections.hours}
                            onToggle={toggleSection}
                        >
                            <div className="space-y-6 pb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <SectionHeader title="Operating Timeline" icon={Calendar} />
                                    <div className="flex items-center gap-3">
                                        <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Enable Hours</Label>
                                        <Switch
                                            checked={org.operatingHours?.enabled ?? true}
                                            onCheckedChange={toggleAllHours}
                                            className="data-[state=checked]:bg-blue-600"
                                        />
                                    </div>
                                </div>
                                {(org.operatingHours?.enabled ?? true) && (
                                    <div className="grid gap-4 border border-white/5 rounded-3xl p-4 bg-black/10">
                                        {DAYS.map((day) => (
                                            <DayTimelineCard
                                                key={day}
                                                day={day}
                                                enabled={weeklyHours[day]?.enabled}
                                                start={weeklyHours[day]?.start}
                                                end={weeklyHours[day]?.end}
                                                onToggle={() => toggleDay(day)}
                                                onRangeChange={(vals: number[]) => updateTimeRange(day, vals)}
                                                timeToValue={timeToValue}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>

                        {/* 6. Address */}
                        <CollapsibleSection
                            id="address"
                            title="Physical Address"
                            icon={MapPin}
                            isOpen={openSections.address}
                            onToggle={toggleSection}
                        >
                            <div className="grid sm:grid-cols-2 gap-4 pb-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Country</Label>
                                    <SearchableSelect
                                        options={countries}
                                        value={org.businessAddress?.country || ""}
                                        onChange={handleCountryChange}
                                        placeholder="Select Country"
                                        searchPlaceholder="Search country..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">State / Province</Label>
                                    <SearchableSelect
                                        options={states}
                                        value={org.businessAddress?.state || ""}
                                        onChange={handleStateChange}
                                        placeholder={states.length > 0 ? "Select State" : "Enter State"}
                                        searchPlaceholder="Search state..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">City</Label>
                                    {cities.length > 0 ? (
                                        <SearchableSelect
                                            options={cities}
                                            value={org.businessAddress?.city || ""}
                                            onChange={(val) => handleAddressChange("city", val)}
                                            placeholder="Enter city..."
                                            searchPlaceholder="Search city..."
                                        />
                                    ) : (
                                        <Input
                                            value={org.businessAddress?.city || ""}
                                            onChange={e => handleAddressChange("city", e.target.value)}
                                            placeholder="Type your city..."
                                        />
                                    )}
                                </div>
                                <div className="space-y-2 relative">
                                    <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Postal Code</Label>
                                    <div className="relative">
                                        <Input
                                            value={org.businessAddress?.pincode || ""}
                                            onChange={e => handleAddressChange("pincode", e.target.value)}
                                            placeholder="110001"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAutoFill}
                                            disabled={fetchingLocation}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-neutral-400 hover:text-blue-500 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors z-10"
                                            title="Detect Location"
                                        >
                                            {fetchingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Street Address</Label>
                                    <Input
                                        value={org.businessAddress?.street || ""}
                                        onChange={e => handleAddressChange("street", e.target.value)}
                                        placeholder="Flat No, Building, Street Name"
                                    />
                                </div>
                            </div>
                        </CollapsibleSection>
                    </div>
                ) : (
                    /* VIEW MODE UI — Final Restructured Layout */
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">

                        {/* ── 1. Company Overview (First) ── */}
                        <section className="space-y-4 px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Company Overview</h3>
                            </div>
                            <div className="rounded-[1.5rem] p-6 border border-neutral-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/20 backdrop-blur-xl shadow-xl">
                                <p className={PREMIUM_CONTENT_STYLE}>
                                    <ReadMoreText text={org.businessDescription || "Every great company starts with a dream. Tell yours here..."} />
                                </p>
                            </div>
                        </section>

                        {/* ── 2. Core Product/Service (Second) ── */}
                        {org.heroOffering && (
                            <section className="space-y-4 px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Core Product/Service ⭐</h3>
                                </div>
                                <div className="relative overflow-hidden rounded-[1.5rem] p-6 border-2 border-blue-500/10 bg-gradient-to-br from-blue-50 to-white dark:from-blue-500/5 dark:to-zinc-900/50 shadow-xl shadow-blue-500/5">
                                    <div className="flex items-start gap-6 relative z-10">
                                        <div className="space-y-2">
                                            <p className={PREMIUM_CONTENT_STYLE}>
                                                <ReadMoreText text={org.heroOffering} />
                                            </p>
                                        </div>
                                    </div>
                                    <Zap className="absolute -right-8 -bottom-8 w-48 h-48 text-blue-500/5 rotate-12" />
                                </div>
                            </section>
                        )}

                        {/* ── 3. Classification & Strategy (Third) ── */}
                        <section className="space-y-4 px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Classification & Strategy</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { icon: Building2, label: "Account Type", value: org.accountType ? ACCOUNT_TYPES.find(t => t.value === org.accountType)?.label : null, color: "text-blue-500", bg: "bg-blue-500/10" },
                                    { icon: Briefcase, label: "Industry", value: org.industry ? INDUSTRIES.find(i => i.value === org.industry)?.label : null, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                    { icon: Locate, label: "Sub-Category", value: org.subCategory ? (subCategoryOptions.find(s => s.value === org.subCategory)?.label || org.subCategory) : null, color: "text-rose-500", bg: "bg-rose-500/10" },
                                    { icon: Target, label: "Target Audience", value: org.targetAudience ? (AUDIENCES.find(a => a.value === org.targetAudience)?.label || org.targetAudience) : null, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                                    { icon: Scale, label: "Business Model", value: org.businessModel ? (BUSINESS_MODELS.find(m => m.value === org.businessModel)?.label || org.businessModel) : null, color: "text-amber-500", bg: "bg-amber-500/10" },
                                    { icon: Building2, label: "Company Size", value: org.companySize ? `${org.companySize}+ Experts` : null, color: "text-orange-500", bg: "bg-orange-500/10" },
                                    { icon: ShieldCheck, label: "Primary Goal", value: org.primaryGoal ? (PRIMARY_GOALS.find(g => g.value === org.primaryGoal)?.label || org.primaryGoal) : null, color: "text-purple-500", bg: "bg-purple-500/10" }
                                ].filter(item => item.value).map((item, idx) => (
                                    <div key={idx} className="group p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-white dark:bg-zinc-900/40 shadow-sm transition-all hover:shadow-lg ">
                                        <div className={cn("inline-flex p-3 rounded-xl mb-4 transition-transform group-hover:rotate-12", item.bg, item.color)}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{item.label}</p>
                                            <p className="text-base font-black text-neutral-900 dark:text-neutral-100">
                                                {item.value!.toString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ── 4. Contact Channels (Fourth) ── */}
                        <section className="space-y-4 px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Contact Channels</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {org.contactPhone && (
                                    <div className="p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-[#0e0e0e]/40 flex items-center gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-sm text-green-500 shrink-0">
                                            <Phone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">PRIMARY PHONE</p>
                                            <p className="text-xl font-black text-neutral-900 dark:text-neutral-100">{org.contactPhone}</p>
                                        </div>
                                    </div>
                                )}
                                {org.contactEmail && (
                                    <div className="p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-[#0e0e0e]/40 flex items-center gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-sm text-blue-500 shrink-0">
                                            <Mail className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">BUSINESS EMAIL</p>
                                            <p className="text-xl font-black text-neutral-900 dark:text-neutral-100 truncate">{org.contactEmail}</p>
                                        </div>
                                    </div>
                                )}
                                {org.website && (
                                    <div className="p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-[#0e0e0e]/40 flex items-center gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-sm text-purple-500 shrink-0">
                                            <Globe className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">OFFICIAL WEBSITE</p>
                                            <a
                                                href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xl font-black text-neutral-900 dark:text-neutral-100 truncate hover:text-blue-500 transition-colors block"
                                            >
                                                {org.website.replace(/^https?:\/\//, '')}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Render Additional Contact Channels */}
                                {(org.contactChannels || []).map((item: any) => {
                                    const typeDef = CONTACT_TYPES.find(t => t.value === item.type);
                                    const Icon = typeDef?.icon || MapPin;
                                    if (!item.value) return null;
                                    return (
                                        <div key={item.id} className="p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-[#0e0e0e]/40 flex items-center gap-4">
                                            <div className={cn("p-4 bg-white/5 rounded-2xl border border-white/10 shadow-sm shrink-0", typeDef?.color)}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{typeDef?.label.toUpperCase()}</p>
                                                {item.type === 'email' ? (
                                                    <p className="text-xl font-black text-neutral-900 dark:text-neutral-100 truncate">{item.value}</p>
                                                ) : item.type === 'phone' ? (
                                                    <p className="text-xl font-black text-neutral-900 dark:text-neutral-100 truncate">{item.value}</p>
                                                ) : (
                                                    <a
                                                        href={item.value.startsWith('http') ? item.value : `https://${item.value}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xl font-black text-neutral-900 dark:text-neutral-100 truncate hover:text-blue-500 transition-colors block"
                                                    >
                                                        {item.value.replace(/^https?:\/\//, '')}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Render Social Links */}
                                {(org.socialLinks || []).map((link: any) => {
                                    const platform = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
                                    const Icon = platform?.icon || Globe;
                                    if (!link.url) return null;
                                    return (
                                        <div key={link.id} className="p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-[#0e0e0e]/40 flex items-center gap-4">
                                            <div className={cn("p-4 bg-white/5 rounded-2xl border border-white/10 shadow-sm shrink-0", link.platform === 'twitter' ? 'text-neutral-900 dark:text-white' : platform?.color)}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{platform?.label.toUpperCase()}</p>
                                                <a
                                                    href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xl font-black text-neutral-900 dark:text-neutral-100 truncate hover:text-blue-500 transition-colors block"
                                                >
                                                    {link.url.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* ── 5. Operating Hours (Fifth) ── */}
                        {(org.operatingHours?.enabled ?? true) && (
                            <section className="space-y-4 px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Operating Hours</h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                                    {DAYS.map(day => {
                                        const dayConfig = weeklyHours[day];
                                        return (
                                            <div key={day} className={cn(
                                                "p-4 rounded-[1.5rem] border transition-all text-center",
                                                dayConfig?.enabled
                                                    ? "border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 shadow-inner"
                                                    : "border-neutral-100 dark:border-white/5 opacity-50 grayscale"
                                            )}>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">{day.slice(0, 3)}</p>
                                                {dayConfig?.enabled ? (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black text-blue-600 dark:text-blue-400">{dayConfig.start}</p>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-200 dark:bg-blue-500/20 mx-auto" />
                                                        <p className="text-xs font-black text-blue-600 dark:text-blue-400">{dayConfig.end}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] font-bold text-neutral-300 dark:text-neutral-700 uppercase mt-2">Closed</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* ── 6. Business Location (Sixth) ── */}
                        {org.businessAddress?.city && (
                            <section className="space-y-4 px-2 pb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Business Location</h3>
                                </div>
                                <div className="p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-zinc-900/40 flex items-center gap-6">
                                    <div className="p-4 bg-white dark:bg-white/5 rounded-2xl shadow-sm text-amber-500 shrink-0">
                                        <MapPin className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                                            {(countries.find(c => c.value === org.businessAddress?.country)?.label || org.businessAddress?.country || "").replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "").trim()}
                                            {org.businessAddress?.state ? `, ${states.find(s => s.value === org.businessAddress?.state)?.label || org.businessAddress.state}` : ""}
                                            {org.businessAddress?.city ? `, ${org.businessAddress.city}` : ""}
                                        </h4>
                                        <p className="text-neutral-500 font-bold text-sm">{org.businessAddress?.street}</p>
                                    </div>
                                </div>
                            </section>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
}
const CollapsibleSection = ({ id, title, icon, isOpen, onToggle, children }: { id: string, title: string, icon: any, isOpen: boolean, onToggle: (id: string) => void, children: React.ReactNode }) => (
    <div className="space-y-4 border-b border-neutral-100 dark:border-white/5 pb-6 last:border-0 last:pb-0">
        <button
            type="button"
            onClick={() => onToggle(id)}
            className="flex items-center justify-between w-full group"
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isOpen ? "bg-blue-500/10 text-blue-500" : "bg-neutral-100 dark:bg-white/5 text-neutral-500"
                )}>
                    {React.createElement(icon, { size: 18 })}
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">{title}</h3>
            </div>
            <div className={cn(
                "p-1.5 rounded-full transition-all duration-300",
                isOpen ? "bg-blue-500/10 text-blue-500 rotate-180" : "bg-neutral-100 dark:bg-white/5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200"
            )}>
                <ChevronDown size={16} />
            </div>
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="pt-2">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

// --- Chronos Engine Sub-components ---
const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-3 border-b border-white/5 pb-4 shrink-0">
        <div className="p-2.5 bg-blue-600/10 rounded-xl border border-blue-600/20">
            <Icon size={16} className="text-blue-500" />
        </div>
        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">{title}</h3>
    </div>
);

const DayTimelineCard = ({ day, enabled, start, end, onToggle, onRangeChange, timeToValue }: any) => {
    const valStart = timeToValue(start);
    const valEnd = timeToValue(end);

    return (
        <div className={cn(
            "p-6 rounded-3xl border transition-all duration-500 flex flex-col gap-6",
            enabled
                ? "bg-white/[0.02] border-blue-500/20 shadow-lg shadow-blue-500/5 text-white"
                : "bg-black/20 border-white/5 opacity-50 grayscale text-zinc-500"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Switch checked={enabled} onCheckedChange={onToggle} className="data-[state=checked]:bg-blue-600" />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">{day}</span>
                </div>
                {enabled && (
                    <div className="px-3 py-1.5 bg-[#0a0f18] border border-blue-500/30 rounded-xl">
                        <span className="text-[10px] font-black text-blue-400 tracking-tighter">{start} — {end}</span>
                    </div>
                )}
            </div>

            {enabled && (
                <div className="px-2 pt-2 cursor-pointer">
                    <Slider
                        defaultValue={[valStart, valEnd]}
                        max={24}
                        step={0.25}
                        onValueChange={(vals: number[]) => onRangeChange(vals)}
                        className="py-4"
                    />
                </div>
            )}
        </div>
    );
};
