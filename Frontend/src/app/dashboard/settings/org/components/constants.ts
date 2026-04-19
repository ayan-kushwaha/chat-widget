export const ACCOUNT_TYPES = [
    { value: "business", label: "Business Owner", icon: "🏢" },
    { value: "individual", label: "Individual / Freelancer", icon: "👤" }
];

export const PRIMARY_GOALS = [
    { value: "increase_sales", label: "Increase Sales / Revenue", icon: "💰" },
    { value: "improve_support", label: "Improve Customer Support", icon: "🤝" },
    { value: "automate_booking", label: "Automate Appointment Booking", icon: "📅" },
    { value: "generate_leads", label: "Generate More Leads", icon: "📢" },
    { value: "reduce_costs", label: "Reduce Operational Costs", icon: "🔄" },
    { value: "team_productivity", label: "Improve Team Productivity", icon: "👥" },
    { value: "insights", label: "Better Customer Insights", icon: "📊" },
    { value: "other", label: "Other", icon: "🔧" }
];

export const BUSINESS_MODELS = [
    { value: "product", label: "Product-based", icon: "🛒" },
    { value: "service", label: "Service-based", icon: "🤝" },
    { value: "subscription", label: "Subscription", icon: "📦" },
    { value: "marketplace", label: "Marketplace / Platform", icon: "🎫" },
    { value: "hybrid", label: "Hybrid", icon: "💡" },
    { value: "other", label: "Other", icon: "🔧" }
];

export const AUDIENCES = [
    { value: "B2B", label: "B2B (Businesses)", icon: "🏢" },
    { value: "B2C", label: "B2C (Consumers)", icon: "👤" },
    { value: "B2G", label: "B2G (Government)", icon: "🏫" },
    { value: "All", label: "All of the above", icon: "🔀" },
    { value: "other", label: "Other", icon: "🔧" }
];

export const INDUSTRY_TAXONOMY: Record<string, { label: string; icon: string; subCategories: { id: string; label: string; icon: string }[]; validModels: string[]; validAudiences: string[] }> = {
    ecommerce: {
        label: "E-commerce / Retail",
        icon: "🛍️",
        subCategories: [
            { id: "d2c", label: "Direct-to-Consumer (D2C Brand)", icon: "🏷️" },
            { id: "marketplace", label: "Amazon/Flipkart Seller", icon: "📦" },
            { id: "dropshipping", label: "Dropshipping", icon: "🚚" },
            { id: "local_retail", label: "Local Physical Store", icon: "🏪" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["product", "subscription", "marketplace", "hybrid", "other"],
        validAudiences: ["B2C", "B2B", "All", "other"]
    },
    saas: {
        label: "Software & IT",
        icon: "💻",
        subCategories: [
            { id: "b2b_saas", label: "B2B SaaS Platform", icon: "🏢" },
            { id: "b2c_saas", label: "B2C Web App", icon: "🌐" },
            { id: "app_dev", label: "Mobile App Development", icon: "📱" },
            { id: "it_services", label: "IT Support Services", icon: "🛠️" },
            { id: "enterprise_sw", label: "Enterprise Software", icon: "🖥️" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["subscription", "service", "product", "hybrid", "other"],
        validAudiences: ["B2B", "B2G", "B2C", "All", "other"]
    },
    real_estate: {
        label: "Real Estate & Property",
        icon: "🏠",
        subCategories: [
            { id: "brokerage", label: "Real Estate Brokerage", icon: "🏠" },
            { id: "property_mgmt", label: "Property Management", icon: "🔑" },
            { id: "construction", label: "Construction & Builders", icon: "🏗️" },
            { id: "coworking", label: "Co-working Spaces", icon: "🪑" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["service", "marketplace", "hybrid", "other"],
        validAudiences: ["B2C", "B2B", "All", "other"]
    },
    healthcare: {
        label: "Healthcare & Wellness",
        icon: "🏥",
        subCategories: [
            { id: "clinic", label: "Clinic / Hospital", icon: "🏥" },
            { id: "telehealth", label: "Telehealth / Digital Health", icon: "💊" },
            { id: "pharmacy", label: "Pharmacy", icon: "💉" },
            { id: "mental_health", label: "Mental Health Services", icon: "🧠" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["service", "product", "subscription", "other"],
        validAudiences: ["B2C", "B2B", "All", "other"]
    },
    education: {
        label: "Education & EdTech",
        icon: "🎓",
        subCategories: [
            { id: "k12", label: "K-12 School / Institute", icon: "🏫" },
            { id: "edtech", label: "EdTech Platform", icon: "💡" },
            { id: "tutoring", label: "Tutoring / Coaching Center", icon: "📚" },
            { id: "online_courses", label: "Online Course Creator", icon: "🎓" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["subscription", "service", "product", "hybrid", "other"],
        validAudiences: ["B2C", "B2B", "All", "other"]
    },
    agencies: {
        label: "Creative & Marketing Agencies",
        icon: "🎨",
        subCategories: [
            { id: "digital_marketing", label: "Digital Marketing / SEO", icon: "📈" },
            { id: "design", label: "Design & UX/UI Agency", icon: "🎨" },
            { id: "pr", label: "Public Relations (PR)", icon: "📣" },
            { id: "video_prod", label: "Video Production", icon: "🎬" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["service", "subscription", "hybrid", "other"],
        validAudiences: ["B2B", "All", "other"]
    },
    food: {
        label: "Food & Beverage",
        icon: "🍔",
        subCategories: [
            { id: "restaurant", label: "Restaurant / Cafe", icon: "🍽️" },
            { id: "cloud_kitchen", label: "Cloud Kitchen", icon: "👨‍🍳" },
            { id: "fmcg", label: "FMCG Brand", icon: "🛒" },
            { id: "catering", label: "Catering Services", icon: "🍱" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["product", "service", "hybrid", "other"],
        validAudiences: ["B2C", "B2B", "All", "other"]
    },
    finance: {
        label: "Finance & Insurance",
        icon: "💰",
        subCategories: [
            { id: "fintech", label: "Fintech Startup", icon: "💳" },
            { id: "accounting", label: "Accounting / CA Firm", icon: "📊" },
            { id: "insurance", label: "Insurance Broker", icon: "🛡️" },
            { id: "wealth_mgmt", label: "Wealth Management", icon: "💹" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["service", "subscription", "product", "other"],
        validAudiences: ["B2C", "B2B", "All", "other"]
    },
    fitness: {
        label: "Gym & Fitness",
        icon: "🏋️",
        subCategories: [
            { id: "gym", label: "Gym / Fitness Studio", icon: "🏋️" },
            { id: "personal_trainer", label: "Personal Trainer", icon: "🤸" },
            { id: "fitness_app", label: "Fitness App / Platform", icon: "📲" },
            { id: "sports", label: "Sports Academy", icon: "⚽" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["subscription", "service", "product", "other"],
        validAudiences: ["B2C", "All", "other"]
    },
    manufacturing: {
        label: "Manufacturing & Logistics",
        icon: "🏭",
        subCategories: [
            { id: "factory", label: "Factory / Production", icon: "🏭" },
            { id: "supply_chain", label: "Logistics & Supply Chain", icon: "🚛" },
            { id: "wholesale", label: "Wholesale Distribution", icon: "📦" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["product", "service", "other"],
        validAudiences: ["B2B", "All", "other"]
    },
    hospitality: {
        label: "Hospitality & Travel",
        icon: "🏨",
        subCategories: [
            { id: "hotel", label: "Hotel / Resort", icon: "🏨" },
            { id: "travel_agency", label: "Travel Agency", icon: "✈️" },
            { id: "events", label: "Event Management", icon: "🎉" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["service", "hybrid", "product", "other"],
        validAudiences: ["B2C", "B2B", "All", "other"]
    },
    consulting: {
        label: "Professional Consulting",
        icon: "💼",
        subCategories: [
            { id: "management", label: "Management Consulting", icon: "📋" },
            { id: "hr", label: "HR & Recruitment", icon: "👥" },
            { id: "legal", label: "Legal Services / Law Firm", icon: "⚖️" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["service", "subscription", "other"],
        validAudiences: ["B2B", "B2C", "All", "other"]
    },
    creators: {
        label: "Creators & Influencers",
        icon: "📸",
        subCategories: [
            { id: "content_creator", label: "YouTuber / Content Creator", icon: "🎥" },
            { id: "community", label: "Community Builder", icon: "🌐" },
            { id: "podcaster", label: "Podcaster", icon: "🎙️" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["product", "subscription", "service", "hybrid", "other"],
        validAudiences: ["B2C", "B2B", "All", "other"]
    },
    automotive: {
        label: "Automotive",
        icon: "🚗",
        subCategories: [
            { id: "dealership", label: "Car Dealership", icon: "🚗" },
            { id: "repair", label: "Auto Repair / Service", icon: "🔧" },
            { id: "rentals", label: "Car Rentals", icon: "🚕" },
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["product", "service", "hybrid", "other"],
        validAudiences: ["B2C", "B2B", "All", "other"]
    },
    other: {
        label: "Other",
        icon: "🔧",
        subCategories: [
            { id: "other", label: "Other", icon: "🔧" }
        ],
        validModels: ["product", "service", "subscription", "marketplace", "hybrid", "other"],
        validAudiences: ["B2C", "B2B", "B2G", "All", "other"]
    }
};

export const INDUSTRIES = Object.entries(INDUSTRY_TAXONOMY).map(([key, value]) => ({
    value: key,
    label: value.label,
    icon: value.icon
}));
import {
    FaLinkedin, FaXTwitter, FaInstagram, FaFacebook, FaYoutube,
    FaWhatsapp, FaTelegram, FaGithub, FaTwitch, FaDiscord,
    FaReddit, FaPinterest
} from "react-icons/fa6";
import { Mail, Phone, Globe, MapPin } from "lucide-react";

export const HOURS_OPTIONS = [
    { value: "24/7", label: "24/7 Always Available" },
    { value: "business_hours", label: "Business Hours (9 AM – 6 PM)" },
    { value: "custom", label: "Custom Schedule" },
];

export const SOCIAL_PLATFORMS = [
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

export const CONTACT_TYPES = [
    { value: 'email', label: 'Email', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-500', placeholder: 'hello@example.com' },
    { value: 'phone', label: 'Phone', icon: Phone, color: 'text-green-500', bg: 'bg-green-500', placeholder: '+1 (555) 000-0000' },
    { value: 'website', label: 'Website', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-500', placeholder: 'https://example.com' }
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DEFAULT_WEEKLY_HOURS: Record<string, { enabled: boolean; start: string; end: string }> = {
    'Monday': { enabled: true, start: "09:00", end: "18:00" },
    'Tuesday': { enabled: true, start: "09:00", end: "18:00" },
    'Wednesday': { enabled: true, start: "09:00", end: "18:00" },
    'Thursday': { enabled: true, start: "09:00", end: "18:00" },
    'Friday': { enabled: true, start: "09:00", end: "18:00" },
    'Saturday': { enabled: false, start: "10:00", end: "14:00" },
    'Sunday': { enabled: false, start: "10:00", end: "14:00" },
};

export const INDUSTRY_GRADIENTS: Record<string, string> = {
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
