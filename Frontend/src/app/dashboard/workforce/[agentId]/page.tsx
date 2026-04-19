'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    Zap,
    ChevronLeft,
    Settings,
    Activity,
    Database,
    Shield,
    Clock,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    FileText,
    Dna
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BorderBeam } from '@/components/ui/border-beam';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AgentCommandCenter() {
    const params = useParams();
    const agentId = params.agentId as string;
    const [activeTab, setActiveTab] = useState('brain');

    // Mock agent data
    const agent = {
        id: agentId,
        name: agentId.includes('EXEC') ? 'Karan' : 'Rocky',
        role: agentId.includes('EXEC') ? 'Senior Recruiter' : 'Sales Closer',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${agentId}`,
        status: 'active',
        synchronization: 94,
        uptime: '14d 6h 22m',
        memory_usage: '1.2 GB / 4.0 GB',
        neural_version: 'cluaiz-core-v2.5-pro'
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="z-20 flex items-center justify-between p-6 border-b border-gray-900 bg-black/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/workforce">
                        <Button variant="ghost" size="icon" className="hover:bg-gray-900 text-gray-400">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center">
                            <img src={agent.avatar} alt={agent.name} className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                {agent.name}
                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                    LIVE
                                </Badge>
                            </h2>
                            <p className="text-xs text-gray-500 font-mono">{agent.id} • {agent.role}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-6 px-4 py-2 bg-gray-900/30 rounded-xl border border-gray-800 text-xs font-mono">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-emerald-400" />
                            <span className="text-gray-500">SYNC:</span>
                            <span className="text-emerald-400">{agent.synchronization}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span className="text-gray-500">UPTIME:</span>
                            <span className="text-blue-400">{agent.uptime}</span>
                        </div>
                    </div>
                    <Button className="bg-emerald-500 text-black hover:bg-emerald-600 font-bold px-6 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Talk to Agent
                    </Button>
                    <Button variant="outline" size="icon" className="border-gray-800 hover:bg-gray-900">
                        <Settings className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row p-6 gap-6 relative z-10 overflow-hidden">

                {/* Left Panel: Persona Overview */}
                <div className="w-full md:w-80 flex flex-col gap-6">
                    <Card className="bg-gray-900/20 border-gray-800 p-6 rounded-3xl space-y-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-3xl bg-gray-800 border-2 border-gray-700 overflow-hidden">
                                    <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-xl border-4 border-black">
                                    <Shield className="w-4 h-4 text-black" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{agent.name}</h3>
                                <p className="text-sm text-gray-500">Neural Executive</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-800">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">CORE MODEL</span>
                                <span className="font-mono text-emerald-400 text-xs">v2.5 PRO</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">MEMORY</span>
                                <span className="font-mono text-blue-400 text-xs">{agent.memory_usage}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">PROTOCOL</span>
                                <span className="font-mono text-purple-400 text-xs">STRICT-ROI</span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full border-gray-800 rounded-xl hover:bg-gray-900 group">
                            Rebuild Persona
                            <Zap className="w-4 h-4 ml-2 group-hover:text-yellow-400" />
                        </Button>
                    </Card>

                    <Card className="bg-emerald-500/5 border-emerald-500/20 p-6 rounded-3xl">
                        <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4" />
                            ROI ANALYTICS
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <p className="text-2xl font-bold">142h</p>
                                <p className="text-xs text-gray-500">Hours saved this month</p>
                            </div>
                            <div className="h-1 w-full bg-emerald-500/20 rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-emerald-500" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Panel: Tabs System */}
                <div className="flex-1 flex flex-col min-w-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                        <TabsList className="bg-gray-900/40 border border-gray-800 p-1 h-14 rounded-2xl w-fit mb-6">
                            <TabsTrigger value="brain" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:text-black transition-all">
                                <Brain className="w-4 h-4 mr-2" />
                                Brain (Memory)
                            </TabsTrigger>
                            <TabsTrigger value="skills" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:text-black transition-all">
                                <Zap className="w-4 h-4 mr-2" />
                                Skills & KPIs
                            </TabsTrigger>
                            <TabsTrigger value="evolution" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:text-black transition-all">
                                <Dna className="w-4 h-4 mr-2" />
                                Evolution
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                            <AnimatePresence mode="wait">
                                <TabsContent key="brain" value="brain" className="m-0 focus-visible:ring-0 outline-none">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <Card className="bg-gray-900/20 border-gray-800 p-6 rounded-3xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <Database className="w-24 h-24" />
                                                </div>
                                                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                    <Database className="w-5 h-5 text-blue-400" />
                                                    Knowledge Index
                                                </h4>
                                                <div className="space-y-4">
                                                    {[
                                                        { name: 'Pricing_Policy.pdf', type: 'PDF', confidence: 98 },
                                                        { name: 'Customer_Feedback_Q4.json', type: 'API', confidence: 92 },
                                                        { name: 'Cluaiz_Brand_Guidelines.web', type: 'URL', confidence: 100 }
                                                    ].map((doc, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-gray-800/50">
                                                            <div className="flex items-center gap-3">
                                                                <FileText className="w-4 h-4 text-gray-500" />
                                                                <span className="text-sm font-medium">{doc.name}</span>
                                                            </div>
                                                            <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-400">
                                                                {doc.confidence}% FOCUS
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>

                                            <Card className="bg-gray-900/20 border-gray-800 p-6 rounded-3xl">
                                                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                    <Shield className="w-5 h-5 text-purple-400" />
                                                    Operating Constitution
                                                </h4>
                                                <div className="space-y-3">
                                                    <p className="text-sm text-gray-400 leading-relaxed italic">
                                                        "I am strictly prohibited from offering discounts above 15% without direct manager escalation. 🟢"
                                                    </p>
                                                    <p className="text-sm text-gray-400 leading-relaxed italic border-t border-gray-800 pt-3">
                                                        "All recruitment emails must maintain a 9.5/10 professional empathy score. 🟢"
                                                    </p>
                                                </div>
                                            </Card>
                                        </div>
                                    </motion.div>
                                </TabsContent>

                                <TabsContent key="skills" value="skills" className="m-0">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        <Card className="bg-gray-900/20 border-gray-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                                            <div className="relative w-32 h-32 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle
                                                        cx="64"
                                                        cy="64"
                                                        r="58"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        fill="transparent"
                                                        className="text-gray-800"
                                                    />
                                                    <circle
                                                        cx="64"
                                                        cy="64"
                                                        r="58"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        fill="transparent"
                                                        strokeDasharray={364.4}
                                                        strokeDashoffset={364.4 * (1 - 0.88)}
                                                        className="text-emerald-500"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-3xl font-bold">88%</span>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Success Rate</span>
                                                </div>
                                            </div>
                                            <h5 className="font-bold text-lg">Task Proficiency</h5>
                                            <p className="text-xs text-gray-500 leading-relaxed">Agent successfully completed 1,244 out of 1,411 complex operations this week.</p>
                                        </Card>

                                        <div className="space-y-6">
                                            {[
                                                { label: 'Latency (Inference)', value: '1.2s', status: 'optimal' },
                                                { label: 'Token Efficiency', value: '98.4%', status: 'excellent' },
                                                { label: 'Logic Consistency', value: 'High', status: 'optimal' }
                                            ].map((stat, i) => (
                                                <Card key={i} className="bg-gray-900/20 border-gray-800 p-5 rounded-2xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-bold uppercase">{stat.label}</p>
                                                        <p className="text-xl font-bold">{stat.value}</p>
                                                    </div>
                                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                                        {stat.status.toUpperCase()}
                                                    </Badge>
                                                </Card>
                                            ))}
                                        </div>
                                    </motion.div>
                                </TabsContent>

                                <TabsContent key="evolution" value="evolution" className="m-0">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-lg font-bold">Learning Loop (Logical Gaps)</h4>
                                            <Button size="sm" className="bg-white text-black font-bold h-8 rounded-lg text-xs">
                                                Update Training Data
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {[
                                                {
                                                    topic: 'Remote Work Tax Policy',
                                                    desc: "Agent couldn't clarify tax implications for hires in Thailand.",
                                                    date: 'Feb 18, 2026',
                                                    severity: 'medium'
                                                },
                                                {
                                                    topic: 'Cluaiz Brand Tone (v2)',
                                                    desc: "Agent is using an old greeting format. Needs alignment with new docs.",
                                                    date: 'Feb 16, 2026',
                                                    severity: 'low'
                                                }
                                            ].map((gap, i) => (
                                                <Card key={i} className="bg-gray-900/20 border-gray-800 p-6 rounded-2xl group border-l-4 border-l-yellow-500/50 hover:border-l-yellow-500 transition-all">
                                                    <div className="flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <h5 className="font-bold flex items-center gap-2">
                                                                {gap.topic}
                                                                <AlertCircle className="w-3 h-3 text-yellow-500" />
                                                            </h5>
                                                            <p className="text-sm text-gray-400">{gap.desc}</p>
                                                            <div className="pt-2 flex items-center gap-4 text-[10px] text-gray-500 font-mono">
                                                                <span>DETECTED: {gap.date}</span>
                                                                <span>SEVERITY: {gap.severity.toUpperCase()}</span>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                                                            Fix Now
                                                        </Button>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </motion.div>
                                </TabsContent>
                            </AnimatePresence>
                        </div>
                    </Tabs>
                </div>
            </div>

            {/* Background Aesthetic */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px]" />
            </div>
        </div>
    );
}
