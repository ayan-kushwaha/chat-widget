/**
 * Training Wizard - Multi-step AI Employee Training Interface
 * Full-width layout with step-by-step training flow
 * INCLUDES DUMMY DATA FOR UI DEMONSTRATION
 */

'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain, FileText, Globe, Code, BookOpen, ChevronRight, Zap, CheckCircle, Loader } from 'lucide-react';

interface KnowledgeSource {
    id: string;
    type: 'website' | 'file' | 'api' | 'manual';
    title: string;
    description: string;
    points: number;
    words: number;
    tags: string[];
    intent: string[];
    status: 'active' | 'inactive';
}

interface ModelOption {
    key: string;
    name: string;
    description: string;
    tokensRequired: number;
    speed: string;
    quality: string;
}

interface ProtocolCard {
    title: string;
    description: string;
    content: string;
    rule_type: string;
    priority: string;
}

interface TrainingWizardProps {
    agentId: string;
    agentName: string;
    agentRole: string;
}

type Step = 'knowledge' | 'employee_info' | 'model_selection' | 'training' | 'results';

// DUMMY DATA
const DUMMY_KNOWLEDGE: KnowledgeSource[] = [
    {
        id: '1',
        type: 'website',
        title: 'Company Website - Product Catalog',
        description: 'Complete product information, pricing, features, and specifications from main website',
        points: 156,
        words: 12480,
        tags: ['products', 'pricing', 'features', 'specifications'],
        intent: ['product_search', 'price_inquiry', 'feature_comparison'],
        status: 'active'
    },
    {
        id: '2',
        type: 'file',
        title: 'Sales Playbook 2024',
        description: 'Comprehensive sales strategies, objection handling, and closing techniques document',
        points: 89,
        words: 8920,
        tags: ['sales', 'objections', 'closing', 'strategies'],
        intent: ['handle_objection', 'close_deal', 'sales_process'],
        status: 'active'
    },
    {
        id: '3',
        type: 'api',
        title: 'CRM Integration - Customer Data',
        description: 'Real-time customer information, purchase history, and interaction logs from Salesforce',
        points: 234,
        words: 18670,
        tags: ['customers', 'purchase_history', 'crm'],
        intent: ['customer_lookup', 'order_status', 'account_details'],
        status: 'active'
    },
    {
        id: '4',
        type: 'manual',
        title: 'Product Training Manual',
        description: 'Detailed product knowledge, technical specifications, and use cases for all product lines',
        points: 112,
        words: 9456,
        tags: ['training', 'technical', 'product_specs'],
        intent: ['product_inquiry', 'technical_support'],
        status: 'active'
    },
    {
        id: '5',
        type: 'file',
        title: 'Pricing & Discount Policy',
        description: 'Official pricing tiers, discount structures, and approval workflows',
        points: 45,
        words: 3890,
        tags: ['pricing', 'discounts', 'policy'],
        intent: ['pricing_inquiry', 'discount_request'],
        status: 'active'
    },
    {
        id: '6',
        type: 'website',
        title: 'Knowledge Base Articles',
        description: 'FAQs, troubleshooting guides, and common customer questions',
        points: 178,
        words: 14230,
        tags: ['faq', 'troubleshooting', 'support'],
        intent: ['troubleshoot', 'faq_lookup', 'how_to'],
        status: 'active'
    }
];

const DUMMY_PROTOCOL_CARDS: ProtocolCard[] = [
    {
        title: 'ENTERPRISE_PRICING_POLICY',
        description: 'Pricing structure and discount limits for enterprise clients',
        content: 'Enterprise tier starts at $5,000/month for 10+ seats. Maximum discount: 25% for annual contracts, 15% for quarterly. Approval required above 20% discount from Sales Director.',
        rule_type: 'policy',
        priority: 'critical'
    },
    {
        title: 'OBJECTION_HANDLING_PRICE',
        description: 'Standard response framework for price objections',
        content: 'When prospect says "too expensive": (1) Acknowledge concern, (2) Reframe to ROI/value, (3) Reference case study with similar company, (4) Offer payment flexibility. Never discount immediately.',
        rule_type: 'workflow',
        priority: 'high'
    },
    {
        title: 'PRODUCT_FEATURE_AI_ANALYTICS',
        description: 'AI-powered analytics dashboard capabilities',
        content: 'Real-time predictive analytics using machine learning. Automated insights with 94% accuracy. Supports 50+ data integrations. Custom dashboard builder with drag-drop interface.',
        rule_type: 'knowledge',
        priority: 'high'
    },
    {
        title: 'LEAD_QUALIFICATION_CRITERIA',
        description: 'BANT framework for qualifying sales opportunities',
        content: 'Must verify: Budget ($5k+ monthly), Authority (decision maker access), Need (clear pain point), Timeline (buying window <6 months). Disqualify if missing 2+ criteria.',
        rule_type: 'workflow',
        priority: 'critical'
    },
    {
        title: 'COMPETITIVE_ADVANTAGE_SALESFORCE',
        description: 'Key differentiators vs Salesforce',
        content: 'Our advantages: 40% lower cost, 2x faster implementation, better AI accuracy, unlimited custom workflows. Salesforce better for: Large enterprise legacy systems, complex multi-org structures.',
        rule_type: 'knowledge',
        priority: 'high'
    },
    {
        title: 'DEMO_PREPARATION_CHECKLIST',
        description: 'Pre-demo preparation steps',
        content: '1. Research company (LinkedIn, website, news). 2. Identify 3 pain points. 3. Customize demo account with their industry data. 4. Prepare 2-3 relevant case studies. 5. Test all demo flows.',
        rule_type: 'workflow',
        priority: 'medium'
    },
    {
        title: 'CONTRACT_NEGOTIATION_LIMITS',
        description: 'Sales rep authority and escalation points',
        content: 'Self-approve: Up to 15% discount, standard payment terms. Requires manager: 16-25% discount, custom contracts, non-standard SLAs. Legal required: Enterprise agreements >$100k.',
        rule_type: 'policy',
        priority: 'critical'
    },
    {
        title: 'CUSTOMER_SUCCESS_HANDOFF',
        description: 'Post-sale transition process',
        content: 'Within 24h of close: Introduce CS manager, schedule kickoff call, share account notes. Day 3: CS sends onboarding plan. Week 1: Implementation begins. Track NPS at 30/60/90 days.',
        rule_type: 'workflow',
        priority: 'high'
    },
    {
        title: 'REFERRAL_INCENTIVE_PROGRAM',
        description: 'Customer referral rewards structure',
        content: 'Qualified referral: $500 account credit. Closed deal: 10% of first year revenue (up to $5k). Enterprise referral: $10k bonus. Referrer must be active customer in good standing.',
        rule_type: 'policy',
        priority: 'medium'
    },
    {
        title: 'EMAIL_FOLLOW_UP_CADENCE',
        description: 'Automated follow-up sequence after demo',
        content: 'Day 0: Thank you + recap. Day 2: Case study relevant to their industry. Day 5: ROI calculator. Day 8: Limited-time offer. Day 12: Break-up email. Always personalize, never spam.',
        rule_type: 'workflow',
        priority: 'medium'
    }
];

export const TrainingWizard: React.FC<TrainingWizardProps> = ({ agentId, agentName, agentRole }) => {
    const [currentStep, setCurrentStep] = useState<Step>('knowledge');
    const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(DUMMY_KNOWLEDGE);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [isTraining, setIsTraining] = useState(false);
    const [generatedCards, setGeneratedCards] = useState<ProtocolCard[]>(DUMMY_PROTOCOL_CARDS);
    const [loading, setLoading] = useState(false);

    const [employeeInfo, setEmployeeInfo] = useState({
        description: `${agentName} is a high-performing sales professional specializing in enterprise B2B sales. Expert at qualifying leads, handling objections, and closing high-ticket deals. Built for strategic selling with deep product knowledge and customer empathy.`,
        intent: 'close_deals, handle_objections, qualify_leads, product_demos, price_negotiations',
        contextGuide: 'Always prioritize understanding customer pain points before pitching. Use consultative selling approach. Maintain professional yet friendly tone. Focus on value over features.',
        tags: 'sales, b2b, enterprise, closer, consultative'
    });

    const modelOptions: ModelOption[] = [
        {
            key: 'gemini-2.0-flash-lite',
            name: 'Flash 2.0 Lite',
            description: 'Fast & economical - Best for simple training',
            tokensRequired: 12450,
            speed: 'Very Fast (~30s)',
            quality: 'Good'
        },
        {
            key: 'gemini-2.0-flash',
            name: 'Flash 2.0',
            description: 'Balanced performance - Recommended ⭐',
            tokensRequired: 15680,
            speed: 'Fast (~45s)',
            quality: 'Excellent'
        },
        {
            key: 'gemini-2.5-flash-lite',
            name: 'Flash 2.5 Lite',
            description: 'Improved reasoning - Better quality',
            tokensRequired: 18920,
            speed: 'Fast (~60s)',
            quality: 'Very Good'
        },
        {
            key: 'gemini-2.0-pro',
            name: 'Pro 2.0',
            description: 'Highest quality - Premium results',
            tokensRequired: 24560,
            speed: 'Moderate (~90s)',
            quality: 'Premium'
        }
    ];

    const handleContinueToEmployeeInfo = () => {
        setCurrentStep('employee_info');
    };

    const handleContinueToModelSelection = () => {
        setCurrentStep('model_selection');
    };

    const handleStartTraining = async () => {
        if (!selectedModel) {
            alert('Please select a model');
            return;
        }

        const selectedModelData = modelOptions.find(m => m.key === selectedModel);
        if (selectedModelData && selectedModelData.tokensRequired >= 100000) {
            alert('Training requires too many tokens. Please reduce knowledge base.');
            return;
        }

        setIsTraining(true);
        setCurrentStep('training');

        // Simulate training (dummy)
        setTimeout(() => {
            setCurrentStep('results');
            setIsTraining(false);
        }, 3000);
    };

    const getSourceIcon = (type: string) => {
        switch (type) {
            case 'website': return <Globe className="w-5 h-5" />;
            case 'file': return <FileText className="w-5 h-5" />;
            case 'api': return <Code className="w-5 h-5" />;
            case 'manual': return <BookOpen className="w-5 h-5" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Top Bar */}
            <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Brain className="w-6 h-6 text-emerald-400" />
                        <div>
                            <h1 className="text-xl font-semibold">Neural Workforce Environment</h1>
                            <p className="text-sm text-gray-500">{agentName} - {agentRole}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-red-950/30 px-4 py-2 rounded-lg border border-red-900/50">
                            <Zap className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-mono text-red-300">TOKEN BALANCE</span>
                            <span className="text-sm font-bold text-white">2,376,671 / 4,448,080</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-12">

                {/* Step 1: Knowledge Preview */}
                {currentStep === 'knowledge' && (
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <div className="inline-block mb-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl"></div>
                                    <div className="relative w-24 h-24 rounded-full border-2 border-emerald-500/50 flex items-center justify-center mx-auto">
                                        <Brain className="w-12 h-12 text-emerald-400 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent">
                                NEURAL WORKFORCE ENVIRONMENT PURGED
                            </h2>
                            <p className="text-gray-500 text-lg">Training {agentName} with your business knowledge</p>
                        </div>

                        {/* Knowledge Sources Grid */}
                        <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-emerald-400" />
                                Knowledge Base Sources ({knowledgeSources.length})
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {knowledgeSources.map((source) => (
                                    <div
                                        key={source.id}
                                        className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-all"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-900/50 text-emerald-400">
                                                {getSourceIcon(source.type)}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-lg mb-1">{source.title}</h4>
                                                        <p className="text-sm text-gray-400">{source.description}</p>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 uppercase">
                                                        {source.type}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                                                    <span>{source.points} Points</span>
                                                    <span>{source.words.toLocaleString()} Words</span>
                                                </div>

                                                {/* Tags */}
                                                {source.tags && source.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {source.tags.map((tag, idx) => (
                                                            <span key={idx} className="text-xs px-2 py-1 bg-blue-950/30 text-blue-400 rounded border border-blue-900/50">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Intent */}
                                                {source.intent && source.intent.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {source.intent.map((int, idx) => (
                                                            <span key={idx} className="text-xs px-2 py-1 bg-purple-950/30 text-purple-400 rounded border border-purple-900/50">
                                                                {int}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Continue Button */}
                        <div className="flex justify-center mt-12">
                            <button
                                onClick={handleContinueToEmployeeInfo}
                                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-12 py-4 rounded-xl transition-colors flex items-center gap-3 text-lg"
                            >
                                Continue to Employee Details
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Employee Information */}
                {currentStep === 'employee_info' && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2">Employee Configuration</h2>
                            <p className="text-gray-500">Define how {agentName} should operate</p>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 space-y-6">
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-emerald-400">
                                    Employee Description
                                </label>
                                <textarea
                                    value={employeeInfo.description}
                                    onChange={(e) => setEmployeeInfo({ ...employeeInfo, description: e.target.value })}
                                    placeholder="Describe the employee's role, expertise, and responsibilities..."
                                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 min-h-[120px] text-white"
                                />
                            </div>

                            {/* Intent */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-emerald-400">
                                    Primary Intent (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={employeeInfo.intent}
                                    onChange={(e) => setEmployeeInfo({ ...employeeInfo, intent: e.target.value })}
                                    placeholder="e.g., handle_sales, close_deals, answer_questions"
                                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 text-white"
                                />
                            </div>

                            {/* Context/Answer Guide */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-emerald-400">
                                    Context / Answer Guide (Optional - AI Auto-Generate)
                                </label>
                                <textarea
                                    value={employeeInfo.contextGuide}
                                    onChange={(e) => setEmployeeInfo({ ...employeeInfo, contextGuide: e.target.value })}
                                    placeholder="Leave blank for AI to auto-generate based on knowledge..."
                                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 min-h-[100px] text-white"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-emerald-400">
                                    Tags (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={employeeInfo.tags}
                                    onChange={(e) => setEmployeeInfo({ ...employeeInfo, tags: e.target.value })}
                                    placeholder="e.g., sales, b2b, enterprise"
                                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setCurrentStep('knowledge')}
                                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleContinueToModelSelection}
                                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-12 py-3 rounded-lg transition-colors flex items-center gap-2"
                            >
                                Continue to Training
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Model Selection */}
                {currentStep === 'model_selection' && (
                    <div className="space-y-8 max-w-5xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2">Select Training Model</h2>
                            <p className="text-gray-500">Choose the AI model for training your employee</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {modelOptions.map((model) => (
                                <button
                                    key={model.key}
                                    onClick={() => setSelectedModel(model.key)}
                                    className={`text-left bg-gradient-to-br p-6 rounded-xl border-2 transition-all ${selectedModel === model.key
                                            ? 'from-emerald-950/50 to-emerald-900/30 border-emerald-500 shadow-lg shadow-emerald-500/20'
                                            : 'from-gray-900/50 to-gray-800/50 border-gray-700/50 hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-xl font-bold">{model.name}</h3>
                                        {selectedModel === model.key && (
                                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 mb-4">{model.description}</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Tokens:</span>
                                            <span className="text-white font-mono font-semibold">{model.tokensRequired.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Speed:</span>
                                            <span className="text-white font-semibold">{model.speed}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Quality:</span>
                                            <span className="text-emerald-400 font-semibold">{model.quality}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-center gap-4 mt-12">
                            <button
                                onClick={() => setCurrentStep('employee_info')}
                                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleStartTraining}
                                disabled={!selectedModel}
                                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold px-12 py-4 rounded-xl transition-colors flex items-center gap-3 text-lg"
                            >
                                <Zap className="w-5 h-5" />
                                Start Training
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Training in Progress */}
                {currentStep === 'training' && (
                    <div className="max-w-3xl mx-auto text-center py-20">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl"></div>
                            <div className="relative w-32 h-32 rounded-full border-2 border-emerald-500/50 flex items-center justify-center mx-auto">
                                <Brain className="w-16 h-16 text-emerald-400 animate-pulse" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold mb-4">Training in Progress...</h2>
                        <p className="text-gray-500 mb-8">Generating Protocol Cards from your business knowledge</p>

                        <div className="w-full max-w-md mx-auto bg-gray-900/50 rounded-full h-2 overflow-hidden">
                            <div className="h-full w-3/4 bg-gradient-to-r from-emerald-500 to-emerald-400 animate-pulse"></div>
                        </div>

                        <p className="mt-6 text-sm text-gray-600">Estimated time: ~45 seconds</p>
                    </div>
                )}

                {/* Step 5: Results */}
                {currentStep === 'results' && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                            <h2 className="text-3xl font-bold mb-2">Training Complete!</h2>
                            <p className="text-gray-500">Generated {generatedCards.length} Protocol Cards for {agentName}</p>
                        </div>

                        <div className="space-y-4">
                            {generatedCards.map((card, idx) => (
                                <div
                                    key={idx}
                                    className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-xl">{card.title}</h3>
                                        <div className="flex gap-2">
                                            <span className="text-xs px-2 py-1 bg-gray-800 rounded uppercase font-semibold">{card.rule_type}</span>
                                            <span className={`text-xs px-2 py-1 rounded uppercase font-semibold ${card.priority === 'critical' ? 'bg-red-950/50 text-red-400' :
                                                    card.priority === 'high' ? 'bg-emerald-950/50 text-emerald-400' :
                                                        'bg-blue-950/50 text-blue-400'
                                                }`}>{card.priority}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-3">{card.description}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed">{card.content}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center mt-8">
                            <button
                                onClick={() => setCurrentStep('knowledge')}
                                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                            >
                                Train Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainingWizard;
