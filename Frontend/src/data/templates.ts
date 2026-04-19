/**
 * Template Data Structure
 * All 25 templates with complete metadata for dynamic routing
 */

export interface Template {
    id: string;
    category: "booking" | "lead-gen" | "support" | "orders" | "info";
    slug: string;
    title: string;
    description: string;
    icon: string;
    demoUrl?: string;
    features: string[];
    flowSteps: string[];
    useCases: string[];
    relatedTemplates: string[];
}

export const TEMPLATE_CATEGORIES = {
    booking: {
        id: "booking",
        name: "Booking & Appointments",
        icon: "🗓️",
        description: "Schedule appointments, manage slots, send reminders",
        color: "indigo",
    },
    "lead-gen": {
        id: "lead-gen",
        name: "Lead Generation",
        icon: "🎯",
        description: "Qualify leads, capture info, sync to CRM",
        color: "purple",
    },
    support: {
        id: "support",
        name: "Support & FAQ",
        icon: "💬",
        description: "Answer questions, provide support, reduce tickets",
        color: "blue",
    },
    orders: {
        id: "orders",
        name: "Orders & Catalog",
        icon: "🛒",
        description: "Browse catalog, place orders, track delivery",
        color: "green",
    },
    info: {
        id: "info",
        name: "Info & Portfolio",
        icon: "📄",
        description: "Share information, showcase portfolio, build brand",
        color: "amber",
    },
};

export const TEMPLATES: Template[] = [
    // BOOKING TEMPLATES
    {
        id: "booking-gym",
        category: "booking",
        slug: "gym",
        title: "Gym Trial Booking",
        description: "Auto-book gym trial sessions with smart slot selection and fitness goal capture",
        icon: "💪",
        features: [
            "Smart slot management",
            "Fitness goal questionnaire",
            "Auto-reminders via SMS/Email",
            "Calendar sync (Google, iCal)",
            "Member preferences tracking",
        ],
        flowSteps: [
            "Welcome message",
            "Ask fitness goals (weight loss, muscle gain, etc.)",
            "Show available trial slots",
            "Collect user info (name, phone, email)",
            "Confirm booking & send reminder",
        ],
        useCases: ["Gyms", "Fitness studios", "Personal trainers", "CrossFit boxes"],
        relatedTemplates: ["booking-yoga", "booking-salon", "booking-consultant"],
    },
    {
        id: "booking-doctor",
        category: "booking",
        slug: "doctor",
        title: "Doctor Appointment",
        description: "Healthcare appointment scheduling with patient info collection and slot management",
        icon: "🩺",
        features: [
            "Patient information collection",
            "Symptom pre-screening",
            "Doctor/specialist selection",
            "Appointment reminders",
            "COVID-19 questionnaire",
        ],
        flowSteps: [
            "Welcome & symptom inquiry",
            "Select doctor/specialist",
            "Choose appointment slot",
            "Collect patient details",
            "Confirm booking & send details",
        ],
        useCases: ["Clinics", "Hospitals", "Dentists", "Specialist doctors"],
        relatedTemplates: ["booking-law-firm", "booking-consultant", "booking-gym"],
    },
    {
        id: "booking-salon",
        category: "booking",
        slug: "salon",
        title: "Hair Salon Booking",
        description: "Beauty salon appointment booking with service selection and stylist preference",
        icon: "💇",
        features: [
            "Service catalog (haircut, coloring, spa)",
            "Stylist selection",
            "Price display",
            "Before/after photo gallery",
            "Loyalty program integration",
        ],
        flowSteps: [
            "Welcome & service selection",
            "Choose preferred stylist",
            "Select time slot",
            "Collect contact info",
            "Booking confirmation",
        ],
        useCases: ["Hair salons", "Beauty parlors", "Spas", "Nail studios"],
        relatedTemplates: ["booking-gym", "booking-yoga", "booking-doctor"],
    },
    {
        id: "booking-yoga",
        category: "booking",
        slug: "yoga",
        title: "Yoga Studio Booking",
        description: "Yoga class scheduling with class type selection and package deals",
        icon: "🧘",
        features: [
            "Class type selection (Hatha, Vinyasa, etc.)",
            "Instructor profiles",
            "Package/membership options",
            "Experience level matching",
            "Virtual class support",
        ],
        flowSteps: [
            "Welcome message",
            "Ask experience level",
            "Show class types & schedule",
            "Select class & time",
            "Book & send confirmation",
        ],
        useCases: ["Yoga studios", "Meditation centers", "Wellness centers"],
        relatedTemplates: ["booking-gym", "booking-salon", "booking-consultant"],
    },
    {
        id: "booking-law-firm",
        category: "booking",
        slug: "law-firm",
        title: "Legal Consultation",
        description: "Law firm consultation scheduling with case type screening and confidentiality",
        icon: "⚖️",
        features: [
            "Case type classification",
            "Lawyer expertise matching",
            "Confidentiality assurance",
            "Document upload",
            "Free consultation option",
        ],
        flowSteps: [
            "Welcome & case type inquiry",
            "Match with lawyer",
            "Schedule consultation",
            "Collect case details",
            "Send confirmation & prep docs",
        ],
        useCases: ["Law firms", "Legal consultants", "Immigration lawyers"],
        relatedTemplates: ["booking-consultant", "booking-doctor", "lead-gen-immigration"],
    },
    {
        id: "booking-consultant",
        category: "booking",
        slug: "consultant",
        title: "Business Consultant",
        description: "Professional consultation scheduling with service type and expertise matching",
        icon: "💼",
        features: [
            "Service catalog",
            "Expertise areas",
            "Hourly/package pricing",
            "Virtual meeting links",
            "Pre-call questionnaire",
        ],
        flowSteps: [
            "Service selection",
            "Choose consultant",
            "Pick time slot",
            "Business details collection",
            "Meeting confirmation",
        ],
        useCases: ["Business consultants", "Career coaches", "Financial advisors"],
        relatedTemplates: ["booking-law-firm", "lead-gen-digital-agency", "booking-doctor"],
    },

    // LEAD GEN TEMPLATES
    {
        id: "lead-gen-real-estate",
        category: "lead-gen",
        slug: "real-estate",
        title: "Real Estate Leads",
        description: "Qualify property buyers/sellers with budget screening and location preference",
        icon: "🏠",
        features: [
            "Buyer/seller qualification",
            "Budget range collection",
            "Location preferences",
            "Property type (apartment, villa, etc.)",
            "CRM auto-sync",
        ],
        flowSteps: [
            "Welcome & intent (buy/sell/rent)",
            "Budget & location",
            "Property preferences",
            "Contact details",
            "Send property listings",
        ],
        useCases: ["Real estate agents", "Property dealers", "Brokers"],
        relatedTemplates: ["lead-gen-interior-design", "lead-gen-insurance", "lead-gen-immigration"],
    },
    {
        id: "lead-gen-digital-agency",
        category: "lead-gen",
        slug: "digital-agency",
        title: "Digital Agency Leads",
        description: "Agency lead qualification with service needs and budget range capture",
        icon: "🎨",
        features: [
            "Service selection (SEO, Ads, Design)",
            "Budget estimation",
            "Project timeline",
            "Competitor analysis",
            "Proposal auto-send",
        ],
        flowSteps: [
            "Service needs inquiry",
            "Budget & timeline",
            "Current marketing status",
            "Company details",
            "Schedule strategy call",
        ],
        useCases: ["Marketing agencies", "Web design studios", "SEO agencies"],
        relatedTemplates: ["lead-gen-interior-design", "booking-consultant", "lead-gen-education"],
    },
    {
        id: "lead-gen-interior-design",
        category: "lead-gen",
        slug: "interior-design",
        title: "Interior Design Quotes",
        description: "Interior design inquiry handling with style preference and room details",
        icon: "🛋️",
        features: [
            "Style preference quiz",
            "Room dimensions",
            "Budget range",
            "Timeline expectations",
            "Portfolio showcase",
        ],
        flowSteps: [
            "Project type (residential/commercial)",
            "Style preferences",
            "Room/space details",
            "Budget discussion",
            "Quote & portfolio send",
        ],
        useCases: ["Interior designers", "Architects", "Home decor studios"],
        relatedTemplates: ["lead-gen-real-estate", "lead-gen-digital-agency", "booking-consultant"],
    },
    {
        id: "lead-gen-immigration",
        category: "lead-gen",
        slug: "immigration",
        title: "Immigration Consultation",
        description: "Visa consultation lead capture with country preference and documentation screening",
        icon: "✈️",
        features: [
            "Country & visa type selection",
            "Eligibility screening",
            "Document checklist",
            "Processing timeline",
            "Success rate display",
        ],
        flowSteps: [
            "Destination country",
            "Visa category",
            "Background check",
            "Contact details",
            "Send eligibility report",
        ],
        useCases: ["Immigration consultants", "Study abroad agencies", "visa services"],
        relatedTemplates: ["lead-gen-education", "booking-law-firm", "lead-gen-real-estate"],
    },
    {
        id: "lead-gen-insurance",
        category: "lead-gen",
        slug: "insurance",
        title: "Insurance Quotes",
        description: "Insurance lead generation with coverage type and premium range",
        icon: "🛡️",
        features: [
            "Policy type selection",
            "Coverage calculator",
            "Premium estimates",
            "Claim process info",
            "Policy comparison",
        ],
        flowSteps: [
            "Insurance type needed",
            "Coverage amount",
            "Personal details",
            "Premium calculation",
            "Send quote & policy options",
        ],
        useCases: ["Insurance agents", "Policy advisors", "Insurance companies"],
        relatedTemplates: ["lead-gen-real-estate", "booking-consultant", "lead-gen-digital-agency"],
    },
    {
        id: "lead-gen-education",
        category: "lead-gen",
        slug: "education",
        title: "Course Enrollment",
        description: "Education lead capture with course interest and background check",
        icon: "🎓",
        features: [
            "Course catalog browsing",
            "Eligibility check",
            "Fee structure display",
            "Scholarship info",
            "Application form",
        ],
        flowSteps: [
            "Course interest",
            "Educational background",
            "Career goals",
            "Contact details",
            "Send prospectus & apply link",
        ],
        useCases: ["Coaching centers", "Online courses", "Universities", "Training institutes"],
        relatedTemplates: ["lead-gen-immigration", "lead-gen-digital-agency", "support-school"],
    },

    // SUPPORT TEMPLATES
    {
        id: "support-ecommerce",
        category: "support",
        slug: "ecommerce",
        title: "E-commerce Support",
        description: "Online store support with order tracking and product info",
        icon: "🛍️",
        features: [
            "Order status tracking",
            "Return/refund process",
            "Product recommendations",
            "Size/fit guide",
            "Live agent handoff",
        ],
        flowSteps: [
            "Inquiry type (order, product, return)",
            "Search FAQ knowledge base",
            "Provide instant answer",
            "Escalate if needed",
            "Collect feedback",
        ],
        useCases: ["Online stores", "Marketplaces", "D2C brands"],
        relatedTemplates: ["orders-restaurant", "support-retail", "orders-grocery"],
    },
    {
        id: "support-saas",
        category: "support",
        slug: "saas",
        title: "SaaS Product Support",
        description: "Software support automation with feature guidance and troubleshooting",
        icon: "💻",
        features: [
            "Feature tutorials",
            "Troubleshooting guides",
            "API documentation links",
            "Ticket creation",
            "Bug reporting",
        ],
        flowSteps: [
            "Issue category",
            "Search knowledge base",
            "Step-by-step solution",
            "Create support ticket",
            "Track resolution",
        ],
        useCases: ["SaaS companies", "Software products", "Tech platforms"],
        relatedTemplates: ["support-ecommerce", "support-school", "booking-consultant"],
    },
    {
        id: "support-school",
        category: "support",
        slug: "school",
        title: "School Information",
        description: "School inquiry handling with admission info and program details",
        icon: "🏫",
        features: [
            "Admission process",
            "Fee structure",
            "Program details",
            "Facility tours",
            "Parent meetings",
        ],
        flowSteps: [
            "Inquiry type",
            "Grade/program interest",
            "Provide information",
            "Schedule visit",
            "Send brochure",
        ],
        useCases: ["Schools", "Colleges", "Coaching centers", "Kindergartens"],
        relatedTemplates: ["lead-gen-education", "support-saas", "booking-consultant"],
    },
    {
        id: "support-hotel",
        category: "support",
        slug: "hotel",
        title: "Hotel Inquiries",
        description: "Hotel booking assistance with room availability and amenities info",
        icon: "🏨",
        features: [
            "Room availability",
            "Amenities list",
            "Pricing & packages",
            "Booking link",
            "Local attractions",
        ],
        flowSteps: [
            "Check-in dates",
            "Room preferences",
            "Show availability & prices",
            "Amenities overview",
            "Booking confirmation",
        ],
        useCases: ["Hotels", "Resorts", "Guest houses", "Homestays"],
        relatedTemplates: ["booking-salon", "support-retail", "orders-restaurant"],
    },
    {
        id: "support-retail",
        category: "support",
        slug: "retail",
        title: "Retail Store Support",
        description: "Retail customer service with product availability and store info",
        icon: "🏬",
        features: [
            "Product availability",
            "Store hours & location",
            "Promotions & offers",
            "Warranty info",
            "Store navigation",
        ],
        flowSteps: [
            "Product inquiry",
            "Check availability",
            "Provide details",
            "Store directions",
            "Reserve if needed",
        ],
        useCases: ["Retail stores", "Showrooms", "Local shops"],
        relatedTemplates: ["support-ecommerce", "orders-grocery", "support-hotel"],
    },

    // ORDERS TEMPLATES
    {
        id: "orders-restaurant",
        category: "orders",
        slug: "restaurant",
        title: "Restaurant Menu",
        description: "Food ordering automation with menu browsing and customization",
        icon: "🍕",
        features: [
            "Digital menu with images",
            "Customization options",
            "Delivery/pickup choice",
            "Order tracking",
            "Payment integration",
        ],
        flowSteps: [
            "Delivery or pickup",
            "Browse menu categories",
            "Add items to cart",
            "Customize order",
            "Confirm & checkout",
        ],
        useCases: ["Restaurants", "Cloud kitchens", "Food trucks", "Cafes"],
        relatedTemplates: ["orders-bakery", "orders-cake-shop", "orders-grocery"],
    },
    {
        id: "orders-cake-shop",
        category: "orders",
        slug: "cake-shop",
        title: "Custom Cake Orders",
        description: "Cake shop ordering with custom designs and delivery scheduling",
        icon: "🎂",
        features: [
            "Cake gallery",
            "Custom design requests",
            "Flavor selection",
            "Size & tiers",
            "Delivery scheduling",
        ],
        flowSteps: [
            "Occasion selection",
            "Design preferences",
            "Flavor & size",
            "Delivery date & address",
            "Order confirmation",
        ],
        useCases: ["Cake shops", "Bakeries", "Pastry studios"],
        relatedTemplates: ["orders-bakery", "orders-restaurant", "booking-salon"],
    },
    {
        id: "orders-grocery",
        category: "orders",
        slug: "grocery",
        title: "Grocery Catalog",
        description: "Local grocery product catalog with home delivery",
        icon: "🥬",
        features: [
            "Product categories",
            "Price display",
            "Cart management",
            "Delivery slots",
            "Payment options",
        ],
        flowSteps: [
            "Browse categories",
            "Add to cart",
            "Review cart",
            "Select delivery slot",
            "Place order",
        ],
        useCases: ["Grocery stores", "Supermarkets", "Local kirana"],
        relatedTemplates: ["orders-pharmacy", "orders-restaurant", "support-retail"],
    },
    {
        id: "orders-pharmacy",
        category: "orders",
        slug: "pharmacy",
        title: "Medicine Ordering",
        description: "Pharmacy order automation with prescription upload and delivery",
        icon: "💊",
        features: [
            "Medicine search",
            "Prescription upload",
            "Substitutes suggestion",
            "Dosage info",
            "Home delivery",
        ],
        flowSteps: [
            "Search medicine or upload Rx",
            "Show availability & price",
            "Add to cart",
            "Delivery address",
            "Order confirmation",
        ],
        useCases: ["Pharmacies", "Medical stores", "Online medicine delivery"],
        relatedTemplates: ["orders-grocery", "support-ecommerce", "booking-doctor"],
    },
    {
        id: "orders-bakery",
        category: "orders",
        slug: "bakery",
        title: "Bakery Pre-Orders",
        description: "Bakery pre-ordering with special orders and pickup scheduling",
        icon: "🥐",
        features: [
            "Daily menu",
            "Special orders",
            "Pickup time selection",
            "Bulk orders",
            "Loyalty rewards",
        ],
        flowSteps: [
            "Browse items",
            "Select products",
            "Pickup time",
            "Special requests",
            "Confirm order",
        ],
        useCases: ["Bakeries", "Patisseries", "Bread shops"],
        relatedTemplates: ["orders-cake-shop", "orders-restaurant", "orders-grocery"],
    },

    // INFO TEMPLATES
    {
        id: "info-personal-brand",
        category: "info",
        slug: "personal-brand",
        title: "Personal Branding",
        description: "Personal brand assistant with bio, services, and contact info",
        icon: "👤",
        features: [
            "About me section",
            "Services showcase",
            "Portfolio links",
            "Social media",
            "Contact form",
        ],
        flowSteps: [
            "Welcome message",
            "Ask what user needs",
            "Show relevant info",
            "Provide links",
            "Collect inquiry",
        ],
        useCases: ["Freelancers", "Influencers", "Consultants", "Creators"],
        relatedTemplates: ["info-startup", "booking-consultant", "info-ngo"],
    },
    {
        id: "info-startup",
        category: "info",
        slug: "startup",
        title: "Startup Pitch Agent",
        description: "Startup information agent with product demo and investor info",
        icon: "🚀",
        features: [
            "Product overview",
            "Pitch deck link",
            "Demo video",
            "Team info",
            "Investor contact",
        ],
        flowSteps: [
            "Welcome & intent check",
            "Show product demo",
            "Share pitch deck",
            "Investor inquiry",
            "Schedule meeting",
        ],
        useCases: ["Startups", "New products", "Innovations"],
        relatedTemplates: ["info-personal-brand", "lead-gen-digital-agency", "info-ngo"],
    },
    {
        id: "info-ngo",
        category: "info",
        slug: "ngo",
        title: "NGO Information",
        description: "Non-profit information with causes, donations, and volunteer signup",
        icon: "🤝",
        features: [
            "Cause information",
            "Impact stories",
            "Donation link",
            "Volunteer signup",
            "Event updates",
        ],
        flowSteps: [
            "Welcome message",
            "User interest (donate/volunteer/learn)",
            "Show relevant info",
            "Provide links/forms",
            "Thank you message",
        ],
        useCases: ["NGOs", "Charities", "Social causes", "Nonprofits"],
        relatedTemplates: ["info-startup", "info-personal-brand", "support-school"],
    },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string) {
    return TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get template by slug
 */
export function getTemplateBySlug(category: string, slug: string) {
    return TEMPLATES.find((t) => t.category === category && t.slug === slug);
}

/**
 * Get related templates
 */
export function getRelatedTemplates(templateId: string, limit = 3) {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return [];

    return template.relatedTemplates
        .map((id) => TEMPLATES.find((t) => t.id === id))
        .filter(Boolean)
        .slice(0, limit);
}
