import { Organization } from '../modules/core/organization/Organization.js';
import { ActivityLog, ActivityType } from '../models/ActivityLog.js';
import { getIO } from '../sockets/index.js'; // ⚡ Import Modular Socket IO
import { STORAGE_RENT_CONFIG, RESOURCE_ENERGY_RATES, MARKUP_FACTOR } from '../config/billing.config.js';
import { Usage, IUsage } from '../models/Usage.js';
import mongoose from 'mongoose';
import { Brain } from '../modules/dashboard/brain/models/Brain.js';
import { Site } from '../modules/dashboard/knowledge/models/Site.js';
import { KnowledgeDocument } from '../modules/dashboard/knowledge/models/KnowledgeDocument.js';
import { PLAN_TIERS } from '../utils/permissionCalculator.js';
import { validateSubscriptionStatus } from '../utils/updateSubscriptionStatus.js';

export class UsageService {

    /**
     * Get or Create Usage Document for the current month
     */
    async getUsage(userId: string): Promise<IUsage> {
        const date = new Date();
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        let usage = await Usage.findOne({ userId, month });

        if (!usage) {
            const initialPlanId = "free";

            usage = await Usage.create({
                userId,
                month,
                planId: initialPlanId,
                storage: { minio_bytes: 0, vector_bytes: 0, mongo_bytes: 0, total_mb: 0 }
            });
        }
        return usage;
    }

    /**
     * ⚡ Centralized Activity Tracker
     */
    async trackActivity(
        orgId: string,
        type: ActivityType,
        rawAmount: number,
        metadata: Record<string, any> = {},
        customDetails?: string,
        forcedBurn?: number
    ) {
        try {
            const organization = await Organization.findById(orgId);
            if (!organization) throw new Error("Organization not found");

            let tokensToBurn = rawAmount;

            // 🤖 AI Dynamic Billing Logic (Model-Aware)
            if (type === ActivityType.AI_CHAT || type === ActivityType.WORKFORCE_HIRE) {
                const input = metadata.prompt_tokens || metadata.input_tokens || 0;
                const output = metadata.completion_tokens || metadata.output_tokens || 0;
                const modelKey = metadata.model || 'gemini-2.0-flash-lite';

                if (input > 0 || output > 0) {
                    const { calculateTokensToBurn } = await import('../config/model_pricing.config.js');
                    const dynamicBurn = calculateTokensToBurn(
                        modelKey,
                        input,
                        output
                    );

                    if (dynamicBurn > 0) {
                        tokensToBurn = dynamicBurn;
                    }
                }
            }

            // ⚡ ENERGY MODEL INTEGRATION (Phase 5 + 6: DYNAMIC DENSITY)
            // If the AI Engine returned resource metrics, add them to the burn
            if (metadata.resource_metrics) {
                const metrics = metadata.resource_metrics;
                const density = metrics.task_density || 0.5; // 🎯 Density factor from AI Engine (0.1 - 1.0)

                // Helper to calculate rate from dynamic range
                const getRate = (config: { MIN: number, MAX: number }) =>
                    config.MIN + (config.MAX - config.MIN) * density;

                let energyBurn = 0;
                if (metrics.cpu_secs) {
                    const rate = getRate(RESOURCE_ENERGY_RATES.CPU_SECOND);
                    energyBurn += metrics.cpu_secs * rate;
                }
                if (metrics.api_calls) {
                    const rate = getRate(RESOURCE_ENERGY_RATES.EXTERNAL_API_CALL);
                    energyBurn += metrics.api_calls * rate;
                }
                if (metrics.net_mb) {
                    const rate = getRate(RESOURCE_ENERGY_RATES.NETWORK_MB);
                    energyBurn += metrics.net_mb * rate;
                }

                const finalEnergyBurn = Math.round(energyBurn * MARKUP_FACTOR);
                tokensToBurn += finalEnergyBurn;
            }

            // ⚡ FORCED BURN (Override)
            if (forcedBurn !== undefined) {
                tokensToBurn = forcedBurn;
            }

            if (!organization.usage) {
                organization.usage = { tokensUsed: 0 } as any;
            }

            const currentTokens = organization.usage!.tokensUsed || 0;
            organization.usage!.tokensUsed = currentTokens + tokensToBurn;
            await organization.save();

            const today = new Date().toISOString().split('T')[0];
            const timestamp = Math.floor(Date.now() / 1000);

            // 🏛️ DUAL-BUCKET MAPPING
            // Group everything into either AI_MODEL or INFRASTRUCTURE
            const bucket = (type === ActivityType.AI_MODEL || type === ActivityType.AI_CHAT || type === ActivityType.AI_INSIGHTS || type === ActivityType.IMAGE_GENERATION)
                ? ActivityType.AI_MODEL
                : ActivityType.INFRASTRUCTURE;

            const entry: any = {
                t: timestamp,
                b: tokensToBurn,
                d: customDetails || type.replace(/_/g, ' ').toLowerCase() // Store only essential context
            };

            await ActivityLog.findOneAndUpdate(
                {
                    organizationId: new mongoose.Types.ObjectId(orgId),
                    date: today
                },
                {
                    $inc: {
                        [`activities.${bucket}.total`]: tokensToBurn,
                        [`activities.${bucket}.count`]: 1
                    },
                    $push: {
                        [`activities.${bucket}.history`]: entry
                    },
                    $setOnInsert: {
                        organizationId: new mongoose.Types.ObjectId(orgId),
                        date: today
                    }
                },
                {
                    upsert: true,
                    new: true
                }
            );

            try {
                const io = getIO();
                if (io) {
                    io.to(orgId.toString()).emit("token_usage_update", {
                        tokensBurned: tokensToBurn,
                        trigger: type
                    });
                }
            } catch (socketErr) {
                console.warn("⚠️ Socket broadcast failed (UsageService):", socketErr);
            }

            return { tokensBurned: tokensToBurn, currentTotal: organization.usage?.tokensUsed || 0 };

        } catch (error: any) {
            console.error(`❌ Usage Tracking Failed [${type}]:`, error.message);
            throw error;
        }
    }

    async incrementCounter(userId: string, feature: 'websites_added' | 'files_uploaded' | 'forms_created') {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const usage = await this.getUsage(userObjectId.toString());
        (usage as any)[feature] = ((usage as any)[feature] || 0) + 1;
        await usage.save();
    }

    async trackVoiceUsage(orgId: string, charCount: number) {
        // 🎯 Use default density for voice if not specified (Voice is high intensity)
        const density = 0.9;
        const rate = RESOURCE_ENERGY_RATES.EXTERNAL_API_CALL.MIN +
            (RESOURCE_ENERGY_RATES.EXTERNAL_API_CALL.MAX - RESOURCE_ENERGY_RATES.EXTERNAL_API_CALL.MIN) * density;

        // 💰 Base Energy Fee for External Voice Engine
        const energyBurn = Math.round(rate * MARKUP_FACTOR);

        return this.trackActivity(
            orgId,
            ActivityType.VOICE_SYNTHESIS,
            charCount,
            { resource_metrics: { api_calls: 1, task_density: density } },
            undefined,
            undefined
        );
    }

    /**
     * 🤖 Track AI Skill Execution
     */
    async trackSkillUsage(orgId: string, skillName: string, metadata: Record<string, any> = {}) {
        const { getSkillCategory } = await import('../config/skills.config.js');
        const category = getSkillCategory(skillName);
        return this.trackActivity(orgId, category, 1, { ...metadata, skill_name: skillName });
    }

    /**
     * 🌐 Track Web Search API Call
     */
    async trackWebSearch(orgId: string, query: string) {
        return this.trackActivity(orgId, ActivityType.WEB_SEARCH, 1, { query });
    }

    /**
     * ⚡ Track Energy (Resource) Usage
     */
    async trackEnergyUsage(
        orgId: string,
        activityType: ActivityType,
        metrics: { cpuSecs?: number; netMB?: number; apiCalls?: number; density?: number },
        metadata: Record<string, any> = {}
    ) {
        const density = metrics.density || 0.5;

        // Helper to calculate rate from dynamic range
        const getRate = (config: { MIN: number, MAX: number }) =>
            config.MIN + (config.MAX - config.MIN) * density;

        let energyBurn = 0;
        if (metrics.cpuSecs) energyBurn += metrics.cpuSecs * getRate(RESOURCE_ENERGY_RATES.CPU_SECOND);
        if (metrics.netMB) energyBurn += metrics.netMB * getRate(RESOURCE_ENERGY_RATES.NETWORK_MB);
        if (metrics.apiCalls) energyBurn += metrics.apiCalls * getRate(RESOURCE_ENERGY_RATES.EXTERNAL_API_CALL);

        // Apply Global Markup
        const finalBurn = Math.max(1, Math.round(energyBurn * MARKUP_FACTOR));

        return this.trackActivity(orgId, activityType, 1, { ...metadata, ...metrics, task_density: density }, undefined, finalBurn);
    }

    /**
     * 🛡️ FRESH LIMIT CHECKER (Centralized)
     * Throws error if limit exceeded. Returns true if allowed.
     */
    async checkFreshLimit(orgId: string, featureId: string): Promise<boolean> {
        // 1. Get Organization & Subscription
        const organization = await Organization.findById(orgId) as any;
        if (!organization) throw new Error("Organization not found");

        // 2. Validate Subscription Status (Active/Expired/Paused)
        await validateSubscriptionStatus(organization);

        // 3. Get Plan Limits
        // Prioritize Snapshot -> then Live Plan calculation
        const snapshot = organization.subscription?.snapshot;
        let limitConfig = snapshot?.limits; // Access 'limits' from snapshot

        if (!limitConfig) {
            // Fallback: Use PLAN_TIERS if snapshot missing
            const capacity = organization.subscription?.token_capacity || 0;
            const tier = PLAN_TIERS.find(t => t.maxTokens ? (capacity <= t.maxTokens && capacity >= t.minTokens) : capacity >= t.minTokens) || PLAN_TIERS[0];
            limitConfig = tier.permissions;
        }

        // 🚨 HANDLE ALIASES (Mismatch between Plan Config & DB Schema)
        let effectiveFeatureId = featureId;
        if (featureId === 'max_files' && !limitConfig[featureId]) effectiveFeatureId = 'max_file_uploads';
        if (featureId === 'max_training_tokens' && !limitConfig[featureId]) effectiveFeatureId = 'max_tokens';
        if (featureId === 'max_team_members' && !limitConfig[featureId]) effectiveFeatureId = 'max_team_seats';

        const limit = limitConfig[effectiveFeatureId];

        // 🧠 SPECIAL CHECK: Training Tokens (Capacity)
        // Always check this even if 'limit' var is undefined in permissions/limits object
        if (featureId === 'max_training_tokens') {
            const used = organization.usage?.tokensUsed || 0;
            const capacity = organization.subscription?.token_capacity || 0;
            // Use explicit token_capacity from subscription root (source of truth)

            if (used >= capacity) {
                throw new Error(`Token limit reached (${Math.floor(used / 1000)}k / ${Math.floor(capacity / 1000)}k). Please upgrade.`);
            }
            return true;
        }

        // Standard Numeric Check
        if (typeof limit === 'number') {
            let currentCount = 0;

            if (featureId === 'max_files') {
                const fileCount = await KnowledgeDocument.countDocuments({ orgId, status: { $ne: 'deleted' } });
                const { ApiSource } = await import('../modules/dashboard/knowledge/models/ApiSource.js');
                const apiCount = await ApiSource.countDocuments({ orgId });
                currentCount = fileCount + apiCount;

            } else if (featureId === 'max_websites') {
                const siteCount = await Site.countDocuments({ orgId, status: { $ne: 'deleted' } });
                currentCount = siteCount;

            } else if (featureId === 'max_manual_qa') {
                const brain = await Brain.findOne({ orgId }) as any;
                currentCount = brain?.knowledge_base?.custom_text?.length || 0;
            }

            if (currentCount >= limit) {
                throw new Error(`Limit reached for ${featureId} (${currentCount}/${limit}). Upgrade your plan to add more.`);
            }

            return true;
        }

        if (limit === false) {
            throw new Error(`Feature ${featureId} is not available on your current plan.`);
        }

        return true;
    }
}

export const usageService = new UsageService();
