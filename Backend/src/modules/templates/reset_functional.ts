import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { IndustryTemplate } from './models/IndustryTemplate';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cluaiz';

const functionalTemplates = [
    {
        slug: 'universal-booking',
        name: 'The Booking Engine',
        description: 'A universal appointment, reservation, and scheduling system. Adapts automatically to Clinics, Gyms, Restaurants, and Salons.',
        category: 'Functional',
        default_tags: ['booking', 'scheduling', 'reservations'],
        // Meta
        version: "2.1.0",
        features: ["Smart Calendar", "Slot Triage", "Reminders", "Multi-Staff"],
        use_cases: ["Clinics", "Gyms", "Salons", "Restaurants", "Consultants"],

        is_public: true,
        persona: {
            tone: 'Helpful',
            greeting_message: "Hello! I can help you book appointments, check availability, and manage your schedule.",
            system_prompt: "You are a versatile scheduling assistant. Adapt your vocabulary to the user's specific industry context (medical, fitness, dining, etc)."
        },
        workflows: {
            "welcome_flow": {
                id: "welcome_flow",
                name: "Booking Flow",
                trigger_keywords: ["book", "schedule", "appointment", "reserve"],
                layout: {
                    type: "container",
                    variant: "vertical_stack",
                    children: [
                        {
                            type: "image",
                            url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80",
                            style: { borderRadius: "12px", marginBottom: "16px", height: "180px", objectFit: "cover" }
                        },
                        {
                            type: "text",
                            variant: "h2_bold",
                            content: "Smart Scheduling"
                        },
                        {
                            type: "text",
                            content: "I can find the perfect slot for you. What would you like to book?",
                            style: { marginBottom: "20px" }
                        },
                        {
                            type: "container",
                            style: { display: "grid", gap: "10px", gridTemplateColumns: "1fr 1fr" },
                            children: [
                                {
                                    type: "button",
                                    content: "Book Now",
                                    variant: "primary",
                                    actions: [{ label: "Book", type: "text", payload: "I want to make a booking" }]
                                },
                                {
                                    type: "button",
                                    content: "Check Hours",
                                    variant: "secondary",
                                    actions: [{ label: "Hours", type: "text", payload: "What are your opening hours?" }]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    },
    {
        slug: 'universal-commerce',
        name: 'The Commerce Engine',
        description: 'A robust product showcasing and sales assistant. Perfect for Retail, Fashion, Electronics, and Digital Goods.',
        category: 'Functional',
        default_tags: ['ecommerce', 'sales', 'products', 'catalog'],
        // Meta
        version: "3.5.0",
        features: ["Product Carousel", "Cart Management", "Order Status", "Upselling"],
        use_cases: ["Retail Stores", "Fashion Brands", "Electronics", "Groceries"],

        is_public: true,
        persona: {
            tone: 'Enthusiastic',
            greeting_message: "Welcome! Ready to explore our collection? I can help you find products and track orders.",
            system_prompt: "You are a sales expert. Promote products effectively and assist with purchase decisions."
        },
        workflows: {
            "welcome_flow": {
                id: "welcome_flow",
                name: "Storefront Flow",
                trigger_keywords: ["shop", "buy", "products", "store"],
                layout: {
                    type: "container",
                    variant: "vertical_stack",
                    children: [
                        {
                            type: "image",
                            url: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=800&q=80",
                            style: { borderRadius: "12px", marginBottom: "16px", height: "180px", objectFit: "cover" }
                        },
                        {
                            type: "text",
                            variant: "h2_bold",
                            content: "Digital Storefront"
                        },
                        {
                            type: "text",
                            content: "Browse top-rated items and new arrivals.",
                            style: { marginBottom: "20px" }
                        },
                        {
                            type: "carousel",
                            items: [
                                {
                                    type: "card_product",
                                    data: {
                                        title: "Featured Product",
                                        price: "$Best Value",
                                        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
                                    },
                                    actions: [{ label: "View", type: "api_call", endpoint: "/featured" }]
                                },
                                {
                                    type: "card_product",
                                    data: {
                                        title: "New Arrival",
                                        price: "$Just In",
                                        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
                                    },
                                    actions: [{ label: "View", type: "api_call", endpoint: "/new" }]
                                }
                            ]
                        }
                    ]
                }
            }
        }
    },
    {
        slug: 'universal-lead-gen',
        name: 'The Lead Engine',
        description: 'Capture, qualify, and convert leads. Ideal for Agencies, Real Estate, Consulting, and B2B Services.',
        category: 'Functional',
        default_tags: ['leads', 'qualification', 'b2b', 'forms'],
        // Meta
        version: "1.8.2",
        features: ["Qualifying Forms", "Smart Routing", "CRM Sync", "Follow-ups"],
        use_cases: ["Real Estate", "Agencies", "Consultants", "Law Firms"],

        is_public: true,
        persona: {
            tone: 'Professional',
            greeting_message: "Hi! I'm here to see if we're a good match. Let's discuss your goals.",
            system_prompt: "You are a lead qualification expert. Ask probing questions to determine fit."
        },
        workflows: {
            "welcome_flow": {
                id: "welcome_flow",
                name: "Lead Qualification Flow",
                trigger_keywords: ["start", "quote", "inquire"],
                layout: {
                    type: "container",
                    variant: "vertical_stack",
                    children: [
                        {
                            type: "image",
                            url: "https://images.unsplash.com/photo-1553877607-4e76a47a11bd?w=800&q=80",
                            style: { borderRadius: "12px", marginBottom: "16px", height: "180px", objectFit: "cover" }
                        },
                        {
                            type: "text",
                            variant: "h2_bold",
                            content: "Let's Grow Together"
                        },
                        {
                            type: "text",
                            content: "Answer a few questions to get a personalized quote or consultation.",
                            style: { marginBottom: "16px" }
                        },
                        {
                            type: "button",
                            content: "Get a Quote",
                            variant: "primary",
                            actions: [{ label: "Start", type: "link", payload: "/qualify" }]
                        }
                    ]
                }
            }
        }
    }
];

const resetTemplates = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for Reset");

        // 1. Delete ALL existing templates (Since user thinks they are "bevkufi"/repetitive)
        await IndustryTemplate.deleteMany({});
        console.log("Cleared old templates.");

        // 2. Insert the new Functional Blueprints
        for (const template of functionalTemplates) {
            await IndustryTemplate.findOneAndUpdate(
                { slug: template.slug },
                template,
                { upsert: true, new: true }
            );
            console.log(`Seeded Blueprint: ${template.name}`);
        }

        console.log("Reset complete!");
        process.exit(0);
    } catch (err) {
        console.error("Reset failed:", err);
        process.exit(1);
    }
};

resetTemplates();
