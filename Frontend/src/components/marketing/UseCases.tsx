"use client";

import React, { useState, useEffect } from "react";
import { Building2, ShoppingBag, GraduationCap, ArrowRight, CheckCircle2, TrendingUp, Users, Calendar, Home, Plane, Dumbbell, Heart, Activity, ShoppingCart, Map, Send, CreditCard, Briefcase, Pizza, Car, Camera, Music, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Meteors } from "@/components/ui/meteors";
import { BorderBeam } from "@/components/ui/border-beam";
import { motion, AnimatePresence } from "framer-motion";

// --- ANIMATION 1: CLINICS (Health Pulse) ---
const HealthPulse = () => (
    <div className="h-40 w-full bg-blue-950/20 relative overflow-hidden rounded-xl border border-blue-500/20 flex flex-col items-center justify-center group-hover:border-blue-500/40 transition-colors">
        {/* ECG Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f61a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f61a_1px,transparent_1px)] bg-[size:16px_16px] opacity-20" />

        {/* Heart Icon */}
        <div className="relative z-10 p-3 bg-blue-500/20 rounded-full mb-3 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Heart className="w-6 h-6 text-blue-400 fill-blue-400/20 animate-pulse" />
        </div>

        {/* Moving ECG Line */}
        <svg className="absolute inset-x-0 bottom-8 h-12 w-full stroke-blue-500/50 fill-none" viewBox="0 0 300 50">
            <path d="M0 25 L30 25 L40 10 L50 40 L60 25 L300 25" vectorEffect="non-scaling-stroke" strokeWidth="2" />
            <motion.rect
                width="100%" height="100%" fill="none" strokeWidth="2" stroke="white"
                className="opacity-20"
            />
        </svg>

        {/* Notification */}
        <motion.div
            className="absolute bottom-2 bg-blue-600/90 text-white px-3 py-1 rounded-full text-[10px] flex items-center gap-1 shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
        >
            <Calendar className="w-3 h-3" /> Appt. Booked
        </motion.div>
    </div>
);

// --- ANIMATION 2: E-COMMERCE (Cart Flow) ---
const CartFlow = () => (
    <div className="h-40 w-full bg-emerald-950/20 relative overflow-hidden rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center group-hover:border-emerald-500/40 transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

        {/* Product Moving to Cart */}
        <div className="flex items-center gap-8 relative z-10">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>

            {/* Dashed Line */}
            <div className="border-t-2 border-dashed border-emerald-500/30 w-16 relative">
                <motion.div
                    className="absolute -top-1.5 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    animate={{ left: ["0%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            </div>

            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShoppingCart className="w-5 h-5 text-emerald-300" />
            </div>
        </div>

        <motion.div
            className="mt-4 bg-emerald-600/90 text-white px-3 py-1 rounded-full text-[10px] flex items-center gap-1 shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
        >
            <Activity className="w-3 h-3" /> Cart Recovered
        </motion.div>
    </div>
);

// --- ANIMATION 3: EDUCATION (Grad Path) ---
const EducationPath = () => (
    <div className="h-40 w-full bg-amber-950/20 relative overflow-hidden rounded-xl border border-amber-500/20 flex flex-col items-center justify-center group-hover:border-amber-500/40 transition-colors">
        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-amber-500/20" />

        <div className="flex justify-between w-3/4 relative z-10">
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-amber-400" />
                </div>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                    <Send className="w-4 h-4 text-amber-400" />
                </div>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <GraduationCap className="w-4 h-4 text-amber-400" />
                </div>
            </div>
        </div>

        {/* Progress Dot */}
        <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full z-20 shadow-[0_0_10px_rgba(245,158,11,1)]"
            style={{ left: "20%" }}
            animate={{ left: ["20%", "80%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute bottom-3 text-[10px] text-amber-400 font-mono bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/20">
            Lead Qualified ✅
        </div>
    </div>
);

// --- ANIMATION 4: REAL ESTATE (House Scan) ---
const RealEstateScan = () => (
    <div className="h-40 w-full bg-purple-950/20 relative overflow-hidden rounded-xl border border-purple-500/20 flex flex-col items-center justify-center group-hover:border-purple-500/40 transition-colors">
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#a855f71a_1px,transparent_1px),linear-gradient(to_bottom,#a855f71a_1px,transparent_1px)] bg-[size:20px_20px]" />

        <Home className="w-16 h-16 text-purple-500/20 stroke-1" />

        {/* Scanning Bar */}
        <motion.div
            className="absolute inset-x-0 h-8 bg-purple-500/20 border-y border-purple-500/50 backdrop-blur-sm z-10"
            animate={{ top: ["10%", "80%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
            className="absolute bottom-4 bg-purple-600/90 text-white px-3 py-1 rounded text-[10px] font-bold shadow-lg z-20"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
        >
            Visit Scheduled 🏠
        </motion.div>
    </div>
);

// --- ANIMATION 5: TRAVEL (Map Flight) ---
const TravelMap = () => (
    <div className="h-40 w-full bg-cyan-950/20 relative overflow-hidden rounded-xl border border-cyan-500/20 flex flex-col items-center justify-center group-hover:border-cyan-500/40 transition-colors">
        {/* Dotted Path */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
            <path d="M20 80 Q 100 20 180 80" fill="none" stroke="rgba(6,182,212,0.2)" strokeWidth="2" strokeDasharray="4 4" />
        </svg>

        {/* Simpler Plane Animation */}
        <motion.div
            className="absolute"
            animate={{
                x: [-60, 60],
                y: [20, -20, 20],
                rotate: [45, 0, -45]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
            <Plane className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
        </motion.div>

        <div className="absolute top-3 right-3 bg-cyan-500/20 border border-cyan-500/40 rounded px-2 py-0.5 text-[10px] text-cyan-300">
            Visa Approved
        </div>
    </div>
);

// --- ANIMATION 6: GYM (Fit Bar) ---
const GymTracker = () => (
    <div className="h-40 w-full bg-rose-950/20 relative overflow-hidden rounded-xl border border-rose-500/20 flex flex-col items-center justify-center group-hover:border-rose-500/40 transition-colors p-6">
        <div className="w-full space-y-3">
            {/* Progress 1 */}
            <div className="flex justify-between text-[10px] text-rose-300 mb-1">
                <span>Sign-ups</span>
                <span>85%</span>
            </div>
            <div className="h-2 w-full bg-rose-950 rounded-full overflow-hidden">
                <motion.div className="h-full bg-rose-500" initial={{ width: 0 }} whileInView={{ width: "85%" }} transition={{ duration: 1.5 }} />
            </div>

            {/* Progress 2 */}
            <div className="flex justify-between text-[10px] text-rose-300 mb-1">
                <span>Revenue</span>
                <span>+30%</span>
            </div>
            <div className="h-2 w-full bg-rose-950 rounded-full overflow-hidden">
                <motion.div className="h-full bg-rose-500" initial={{ width: 0 }} whileInView={{ width: "60%" }} transition={{ duration: 1.5, delay: 0.2 }} />
            </div>
        </div>

        <Dumbbell className="absolute bottom-3 right-3 w-6 h-6 text-rose-500/20 -rotate-45" />
    </div>
);

// --- ANIMATION 7: UNIVERSAL ADAPT (The "Your Business" Card) ---
const UniversalAdapt = () => {
    const [iconIndex, setIconIndex] = useState(0);
    const icons = [Briefcase, Pizza, Car, Camera, Music];

    useEffect(() => {
        const interval = setInterval(() => {
            setIconIndex(prev => (prev + 1) % icons.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const CurrentIcon = icons[iconIndex];

    return (
        <div className="h-40 w-full bg-slate-900/50 relative overflow-hidden rounded-xl border border-slate-700/50 flex flex-col items-center justify-center group-hover:border-indigo-500/40 transition-colors">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 animate-pulse" />

            <div className="relative z-10 flex items-center justify-center">
                {/* Rotating Central Hub */}
                <div className="w-20 h-20 rounded-full border border-dashed border-slate-600 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                    {/* Orbiting Dots */}
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-indigo-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(99,102,241,1)]" />
                    <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-purple-500 rounded-full -translate-x-1/2 translate-y-1/2 shadow-[0_0_10px_rgba(168,85,247,1)]" />
                </div>

                {/* Changing Icon Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={iconIndex}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CurrentIcon className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <motion.div
                className="absolute bottom-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 rounded-full text-[10px] font-bold shadow-lg"
                whileHover={{ scale: 1.05 }}
            >
                Adapts to YOU ✨
            </motion.div>
        </div>
    );
};


const CASES = [
    {
        animation: HealthPulse,
        title: "Clinics & Hospitals",
        desc: "Automate appointments, answer patient FAQs about pricing, and handle emergency queries 24/7.",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "group-hover:border-blue-500/30",
        features: ["Doctor Scheduling", "Pricing FAQs", "Emergency Triage"],
        stat: "+40% Bookings"
    },
    {
        animation: CartFlow,
        title: "E-Commerce & Retail",
        desc: "Recover abandoned carts, answer 'Where is my order?', and recommend products automatically.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "group-hover:border-emerald-500/30",
        features: ["Order Tracking", "Product Upsell", "Returns Helper"],
        stat: "2x Conversion"
    },
    {
        animation: EducationPath,
        title: "Education & Coaching",
        desc: "Qualify prospective students, explain course details, and schedule counselling sessions.",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "group-hover:border-amber-500/30",
        features: ["Course Enquiry", "Fee Explainer", "Student Qualification"],
        stat: "Zero Missed Leads"
    },
    {
        animation: RealEstateScan,
        title: "Real Estate",
        desc: "Schedule property visits, send brochures, and qualify buyers before you even speak to them.",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "group-hover:border-purple-500/30",
        features: ["Visit Scheduling", "Brochure Sending", "Lead Qualification"],
        stat: "Save 20hrs/Week"
    },
    {
        animation: TravelMap,
        title: "Travel & Tourism",
        desc: "Suggest holiday packages, answer visa queries, and book dates instantly for travelers.",
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "group-hover:border-cyan-500/30",
        features: ["Package Finder", "Visa & Docs FAQ", "Instant Booking"],
        stat: "24/7 Support"
    },
    {
        animation: GymTracker,
        title: "Gyms & Fitness",
        desc: "Sign up new members, book PT sessions, and answer membership queries automatically.",
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "group-hover:border-rose-500/30",
        features: ["Membership Pricing", "Class Booking", "Diet Plan Intro"],
        stat: "+30% Signups"
    },
    // --- SPECIAL UNIVERSAL CARD ---
    {
        animation: UniversalAdapt,
        title: "Your Unique Business",
        desc: "Don't see your industry? Cluaiz adapts to ANY niche. Train it on your specific data and watch it perform.",
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "group-hover:border-indigo-500/30",
        features: ["100% Custom Data", "Adapts to Any Workflow", "Instant Setup"],
        stat: "Limitless Scale 🚀",
        span: "md:col-span-2 lg:col-span-3" // SPANS FULL WIDTH
    }
];

export function UseCases() {
    return (
        <section className="py-32 bg-[#020617] relative overflow-hidden">
            {/* Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px]" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

            <div className="container px-4 mx-auto relative z-10">

                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-indigo-500/30 bg-indigo-500/10">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Industry Specialized</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                        Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Your Industry.</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl">
                        Cluaiz isn't just a generic chatbot. It's pre-trained to handle the specific needs of your business type.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {CASES.map((item, i) => (
                        <div key={i} className={cn(
                            "group relative p-6 rounded-3xl border border-white/5 transition-all duration-500 hover:-translate-y-2 backdrop-blur-sm overflow-hidden",
                            // Glassy Background
                            "bg-slate-900/40 hover:bg-slate-900/60",
                            item.border,
                            // HANDLES SPANNING FOR THE LAST CARD
                            // @ts-ignore
                            item.span || ""
                        )}>
                            {/* Border Beam for selected cards */}
                            {(i === 0 || i === 3 || i === 6) && <BorderBeam size={300} duration={12} delay={9} borderWidth={1.5} colorFrom="#ffffff" colorTo={item.color.split("-")[1]} />}

                            {/* Hover Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.bg} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-3xl blur-xl`} />

                            {/* Meteors */}
                            <Meteors number={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative z-10 flex flex-col h-full">

                                {/* ANIMATION CONTAINER */}
                                <div className="mb-6">
                                    <item.animation />
                                </div>

                                {/* Stat Badge */}
                                <div className="flex justify-between items-center mb-4">
                                    <div className={cn("px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border flex items-center gap-1.5", item.bg, "border-white/10", item.color)}>
                                        <TrendingUp className="w-3 h-3" />
                                        {item.stat}
                                    </div>
                                </div>

                                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                                    {item.title}
                                </h3>

                                <p className="text-slate-400 leading-relaxed mb-6 flex-1 text-sm">
                                    {item.desc}
                                </p>

                                {/* Features List (Grid for the Wide Card) */}
                                <div className={cn(
                                    "pt-6 border-t border-white/5",
                                    // Make features horizontal on the wide card
                                    // @ts-ignore
                                    item.span ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "space-y-3"
                                )}>
                                    {item.features.map((feat, j) => (
                                        <div key={j} className="flex items-center gap-3">
                                            <CheckCircle2 className={cn("w-4 h-4", item.color)} />
                                            <span className="text-sm font-medium text-slate-300">{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-white opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 cursor-pointer">
                                    View Details <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
