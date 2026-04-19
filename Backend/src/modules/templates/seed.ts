import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { IndustryTemplate } from './models/IndustryTemplate';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cluaiz';

const templates = [
    {
        slug: 'retail-store',
        name: 'The Retail Store',
        description: 'A complete e-commerce assistant for any retail business. Manages product showcasing, FAQs, and order status checks.',
        category: 'E-commerce',
        is_public: true,
        persona: {
            tone: 'Friendly',
            greeting_message: "Hi there! Welcome to [Your Store Name]. Looking for anything specific today?",
            system_prompt: "You are a helpful retail sales assistant."
        },
        workflows: {
            "welcome_flow": {
                id: "welcome_flow",
                name: "Welcome Flow",
                trigger_keywords: ["hi", "shop"],
                layout: {
                    type: "container",
                    variant: "vertical_stack",
                    children: [
                        {
                            type: "image",
                            url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
                            style: { borderRadius: "12px", marginBottom: "16px", height: "180px", objectFit: "cover" }
                        },
                        {
                            type: "text",
                            variant: "h2_bold",
                            content: "Welcome to Our Store!"
                        },
                        {
                            type: "text",
                            content: "Discover our latest collection. Tap a product to learn more.",
                            style: { marginBottom: "20px", color: "#666" }
                        },
                        {
                            type: "carousel",
                            items: [
                                {
                                    type: "card_product",
                                    data: {
                                        title: "Summer Collection",
                                        price: "From $29",
                                        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80"
                                    },
                                    actions: [{ label: "Browse", type: "api_call", endpoint: "/collections/summer" }]
                                },
                                {
                                    type: "card_product",
                                    data: {
                                        title: "New Arrivals",
                                        price: "Trending",
                                        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80"
                                    },
                                    actions: [{ label: "Shop New", type: "api_call", endpoint: "/collections/new" }]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    },
    {
        slug: 'restaurant-bistro',
        name: 'Urban Bistro',
        description: 'Perfect for cafes and restaurants. Handles table reservations, menu browsing, and event inquiries.',
        category: 'Restaurant',
        is_public: true,
        persona: {
            tone: 'Warm',
            greeting_message: "Welcome to Urban Bistro! 🍷 Would you like to see our menu or book a table?",
            system_prompt: "You are a restaurant host."
        },
        workflows: {
            "welcome_flow": {
                id: "welcome_flow",
                name: "Welcome Flow",
                trigger_keywords: ["menu", "book", "hi"],
                layout: {
                    type: "container",
                    variant: "vertical_stack",
                    children: [
                        {
                            type: "image",
                            url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
                            style: { borderRadius: "12px", marginBottom: "16px", height: "200px", objectFit: "cover" }
                        },
                        {
                            type: "text",
                            variant: "h2_bold",
                            content: "Taste the Experience"
                        },
                        {
                            type: "text",
                            content: "Fresh ingredients, unforgettable flavors.",
                            style: { marginBottom: "20px" }
                        },
                        {
                            type: "container",
                            style: { display: "flex", gap: "10px" },
                            children: [
                                {
                                    type: "button",
                                    content: "View Menu",
                                    variant: "primary",
                                    actions: [{ label: "Menu", type: "link", payload: "/menu" }]
                                },
                                {
                                    type: "button",
                                    content: "Reserve Table",
                                    variant: "secondary",
                                    actions: [{ label: "Book", type: "link", payload: "/reserve" }]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    },
    {
        slug: 'hotel-concierge',
        name: 'Grand Hotel Concierge',
        description: 'A 24/7 digital concierge for hotels. Assists with room service, local guides, and checkout.',
        category: 'Hospitality',
        is_public: true,
        persona: {
            tone: 'Polite',
            greeting_message: "Good day. Welcome to The Grand. How may I assist you with your stay?",
            system_prompt: "You are a luxury hotel concierge."
        },
        workflows: {
            "welcome_flow": {
                id: "welcome_flow",
                name: "Welcome Flow",
                trigger_keywords: ["hi", "room service"],
                layout: {
                    type: "container",
                    variant: "vertical_stack",
                    children: [
                        {
                            type: "image",
                            url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
                            style: { borderRadius: "12px", marginBottom: "16px", height: "180px", objectFit: "cover" }
                        },
                        {
                            type: "text",
                            variant: "h2_bold",
                            content: "At Your Service"
                        },
                        {
                            type: "carousel",
                            items: [
                                {
                                    type: "card_product",
                                    data: {
                                        title: "Room Service",
                                        price: "24/7",
                                        image: "https://images.unsplash.com/photo-1541544537156-218db7754a3c?w=800&q=80"
                                    },
                                    actions: [{ label: "Order", type: "api_call", endpoint: "/service/food" }]
                                },
                                {
                                    type: "card_product",
                                    data: {
                                        title: "Spa & Wellness",
                                        price: "Open 9-9",
                                        image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80"
                                    },
                                    actions: [{ label: "Book Spa", type: "api_call", endpoint: "/service/spa" }]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    },
    {
        slug: 'gym-fitness',
        name: 'PowerFit Gym',
        description: 'Membership and class booking bot for gyms and fitness centers.',
        category: 'Fitness',
        is_public: true,
        persona: {
            tone: 'Motivating',
            greeting_message: "Hey champ! 💪 Ready to crush your workout? I can help with class schedules and memberships.",
            system_prompt: "You are a fitness coach assistant."
        },
        workflows: {
            "welcome_flow": {
                id: "welcome_flow",
                name: "Welcome Flow",
                trigger_keywords: ["gym", "class"],
                layout: {
                    type: "container",
                    variant: "vertical_stack",
                    children: [
                        {
                            type: "image",
                            url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
                            style: { borderRadius: "12px", marginBottom: "16px", height: "180px", objectFit: "cover" }
                        },
                        {
                            type: "text",
                            variant: "h2_bold",
                            content: "Train Like a Pro"
                        },
                        {
                            type: "container",
                            style: { display: "grid", gap: "10px", gridTemplateColumns: "1fr 1fr" },
                            children: [
                                {
                                    type: "button",
                                    content: "Class Schedule",
                                    variant: "primary",
                                    actions: [{ label: "Schedule", type: "link", payload: "/classes" }]
                                },
                                {
                                    type: "button",
                                    content: "Join Now",
                                    variant: "secondary",
                                    actions: [{ label: "Join", type: "link", payload: "/join" }]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    },
    {
        slug: 'real-estate-generic',
        name: 'Prime Properties',
        description: 'Automate viewings and lead qualification for your real estate agency.',
        category: 'Real Estate',
        is_public: true,
        persona: {
            tone: 'Professional',
            greeting_message: "Welcome to Prime Properties. Are you looking to buy, sell, or rent?",
            system_prompt: "You are a real estate agent."
        },
        workflows: {
            "welcome_flow": {
                id: "welcome_flow",
                name: "Welcome Flow",
                trigger_keywords: ["hi", "start"],
                layout: {
                    type: "container",
                    variant: "vertical_stack",
                    children: [
                        {
                            type: "image",
                            url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
                            style: { borderRadius: "12px", marginBottom: "16px", height: "200px", objectFit: "cover" }
                        },
                        {
                            type: "text",
                            variant: "h2_bold",
                            content: "Luxury Living"
                        },
                        {
                            type: "carousel",
                            items: [
                                {
                                    type: "card_product",
                                    data: {
                                        title: "Downtown Condo",
                                        price: "$500k",
                                        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"
                                    },
                                    actions: [{ label: "View", type: "link", payload: "/prop/1" }]
                                },
                                {
                                    type: "card_product",
                                    data: {
                                        title: "Suburban Home",
                                        price: "$850k",
                                        image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80"
                                    },
                                    actions: [{ label: "View", type: "link", payload: "/prop/2" }]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    },
    {
        slug: 'clinic-care',
        name: 'Family Health Clinic',
        description: 'Patient booking and triage system for medical practices.',
        category: 'Healthcare',
        is_public: true,
        persona: {
            tone: 'Caring',
            greeting_message: "Hello from Family Health. How can we help you today?",
            system_prompt: "You are a medical assistant."
        },
        workflows: {
            "welcome_flow": {
                id: "welcome_flow",
                name: "Welcome Flow",
                trigger_keywords: ["hi", "doctor"],
                layout: {
                    type: "container",
                    variant: "vertical_stack",
                    children: [
                        {
                            type: "image",
                            url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
                            style: { borderRadius: "12px", marginBottom: "16px", height: "180px", objectFit: "cover" }
                        },
                        {
                            type: "text",
                            variant: "h2_bold",
                            content: "Caring for Your Health"
                        },
                        {
                            type: "container",
                            style: { display: "grid", gap: "10px", gridTemplateColumns: "1fr 1fr" },
                            children: [
                                {
                                    type: "button",
                                    content: "Book Appt",
                                    variant: "primary",
                                    actions: [{ label: "Book", type: "text", payload: "Book Appointment" }]
                                },
                                {
                                    type: "button",
                                    content: "Services",
                                    variant: "secondary",
                                    actions: [{ label: "Services", type: "text", payload: "What services do you offer?" }]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    },
    {
        slug: 'agency-consulting',
        name: 'Growth Agency',
        description: 'Lead qualification and discovery call booking for digital agencies.',
        category: 'Agency',
        is_public: true,
        persona: {
            tone: 'Expert',
            greeting_message: "Hi! Ready to scale your business? Let's see if we're a good fit.",
            system_prompt: "You are a sales rep for an agency."
        },
        workflows: {
            "welcome_flow": {
                id: "welcome_flow",
                name: "Welcome Flow",
                trigger_keywords: ["hi", "scale"],
                layout: {
                    type: "container",
                    variant: "vertical_stack",
                    children: [
                        {
                            type: "image",
                            url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
                            style: { borderRadius: "12px", marginBottom: "16px", height: "180px", objectFit: "cover" }
                        },
                        {
                            type: "text",
                            variant: "h2_bold",
                            content: "Scale With Us"
                        },
                        {
                            type: "text",
                            content: "Book a free strategy call to discuss your goals.",
                            style: { marginBottom: "16px" }
                        },
                        {
                            type: "button",
                            content: "Book Strategy Call",
                            variant: "primary",
                            actions: [{ label: "Book", type: "link", payload: "/calendar" }]
                        }
                    ]
                }
            }
        }
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        for (const template of templates) {
            await IndustryTemplate.findOneAndUpdate(
                { slug: template.slug },
                template,
                { upsert: true, new: true }
            );
            console.log(`Seeded: ${template.name}`);
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedDB();
