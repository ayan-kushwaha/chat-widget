"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Building2, ShoppingBag, Stethoscope } from 'lucide-react';

const INDUSTRIES = [
    {
        id: 'clinic',
        name: 'Healthcare Clinic',
        icon: Stethoscope,
        description: 'Book appointments, triage patients, and answer generic queries.',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'ecommerce',
        name: 'E-Commerce Store',
        icon: ShoppingBag,
        description: 'Recommend products, track orders, and handle returns.',
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 'real_estate',
        name: 'Real Estate Agency',
        icon: Building2,
        description: 'Qualify leads, schedule viewings, and showcase properties.',
        color: 'from-orange-500 to-yellow-500'
    },
    {
        id: 'generic', // Maps to 'custom' behavior
        name: 'Other / Custom',
        icon: Building2, // Reusing icon or imports new one
        description: 'Build your own agent triggered by custom keywords.',
        color: 'from-slate-500 to-gray-500'
    }
];


export default function OnboardingPage() {
    const [selected, setSelected] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [deploying, setDeploying] = useState(false);

    const handleDeploy = async () => {
        setDeploying(true);
        try {
            // 1. Get Org ID from localStorage (Assuming user is logged in and org is selected)
            const orgId = localStorage.getItem('cluaiz_active_org');
            const token = localStorage.getItem('token'); // Or however auth is handled

            if (!orgId) {
                alert("No active organization found. Please login again.");
                return;
            }

            // 2. Call Backend API
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'}/organizations/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-org-id': orgId
                },
                body: JSON.stringify({
                    industry: selected,
                    settings: {
                        persona: 'professional' // Default
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                // Success! Redirect to dashboard
                await new Promise(r => setTimeout(r, 1500)); // Fake delay for "Configuring..." feel
                window.location.href = "/dashboard";
            } else {
                alert("Failed to deploy: " + data.message);
                setDeploying(false);
            }

        } catch (err) {
            console.error("Deploy failed", err);
            setDeploying(false);
        }
    };


    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">

            {/* Header */}
            <div className="text-center mb-10 space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium border border-indigo-500/20"
                >
                    Start in 2 Minutes
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent"
                >
                    What kind of business is this?
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-400 text-lg max-w-2xl mx-auto"
                >
                    Cluaiz will instantly configure your AI's personality, knowledge, and workflows.
                </motion.p>
            </div>

            {/* Grid */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full">
                {INDUSTRIES.map((ind, i) => (
                    <motion.div
                        key={ind.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                    >
                        <Card
                            onClick={() => setSelected(ind.id)}
                            className={`
                                relative p-8 cursor-pointer transition-all duration-300 border-2
                                ${selected === ind.id
                                    ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 transform scale-[1.02]'
                                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                                }
                            `}
                        >
                            {selected === ind.id && (
                                <div className="absolute top-4 right-4 bg-indigo-500 text-white p-1 rounded-full">
                                    <Check size={16} />
                                </div>
                            )}

                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ind.color} flex items-center justify-center mb-6 shadow-lg`}>
                                <ind.icon className="text-white" size={28} />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{ind.name}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{ind.description}</p>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Action Bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-12 w-full max-w-md"
            >
                <Button
                    size="lg"
                    className="w-full h-14 text-lg font-medium bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/20"
                    disabled={!selected || deploying}
                    onClick={handleDeploy}
                >
                    {deploying ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Configuring AI Brain...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            Deploy {selected ? INDUSTRIES.find(i => i.id === selected)?.name : 'Agent'}
                            <ArrowRight size={20} />
                        </div>
                    )}
                </Button>
                <p className="text-center text-slate-500 text-sm mt-4">
                    Takes 30 seconds. You can customize details later.
                </p>
            </motion.div>

        </div>
    );
}
