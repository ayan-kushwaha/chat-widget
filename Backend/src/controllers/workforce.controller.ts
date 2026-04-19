import { Router, Request, Response } from 'express';
import { ProtocolCard } from '../models/ProtocolCard.js';
import { Workforce } from '../models/Workforce.js';
import { workforceQueue } from '../jobs/queues.js'; // Updated queue name
import { MODEL_MASTER_CONFIG, calculateTokensToBurn, getAvailableModels } from '../config/model_pricing.config.js';
import axios from 'axios';
import { Organization } from '../modules/core/organization/Organization.js';
import { usageService } from '../services/usage.service.js';
import { ActivityType } from '../models/ActivityLog.js';

const router = Router();

/**
 * GET /api/workforce/my-team
 * List all deployed AI personnel for the organization
 */
router.get('/my-team', async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const orgId = user?.organizationId || user?.organization || user?.orgId || user?.id || user?._id;

        console.log(`🔍 [WorkforceController] Fetching team for Org: ${orgId}`);

        if (!orgId) {
            console.error('❌ [WorkforceController] OrgId not found in user object:', user);
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        const team = await Workforce.find({ org_id: orgId })
            .sort({ created_at: -1 });

        res.json({
            success: true,
            data: team
        });
    } catch (error: any) {
        console.error('Fetch my-team error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch workforce data'
        });
    }
});

/**
 * GET /api/workforce/by-agent/:agentId
 * Get deployed workforce member by agent_id (to restore deployed data on page reload)
 */
router.get('/by-agent/:agentId', async (req: Request, res: Response) => {
    try {
        const { agentId } = req.params;
        const user = (req as any).user;
        const orgId = user?.organizationId || user?.organization || user?.orgId || user?.id || user?._id;

        console.log(`🔍 [WorkforceController] Fetching by-agent ${agentId} for Org: ${orgId}`);

        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        // Find the most recent deployed workforce member for this agent
        const workforceMember = await Workforce.findOne({
            org_id: orgId,
            agent_id: agentId
        }).sort({ created_at: -1 });

        if (!workforceMember) {
            return res.json({
                success: true,
                data: null,
                message: 'No deployed personnel found for this agent'
            });
        }

        res.json({
            success: true,
            data: workforceMember
        });
    } catch (error: any) {
        console.error('Fetch by agent error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch workforce data'
        });
    }
});

/**
 * POST /api/workforce/estimate
 * Get deployment cost estimate before starting
 */
router.post('/estimate', async (req: Request, res: Response) => {
    try {
        const { agent_id } = req.body;
        const user = (req as any).user;
        const userId = user?.id || user?._id;

        console.log('🔍 [WorkforceController] Estimate Request:', { agent_id, userId });

        if (!agent_id || !userId) {
            console.warn('❌ [WorkforceController] Validation Failed:', { agent_id, userId });
            return res.status(400).json({
                success: false,
                error: 'agent_id and authenticated user required'
            });
        }

        // Call Python AI Engine to analyze metadata
        const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:5000';
        const metadataResponse = await axios.post(`${aiEngineUrl}/api/v1/workforce/analyze-metadata`, {
            user_id: userId,
            agent_id
        });

        const { total_tokens, metadata_count } = metadataResponse.data;

        // Get user's pricing tier
        // Calculate cost for all 3 models (Gemini + Local)
        const models = getAvailableModels().map(model => {
            // Estimate with 2k safe output tokens
            const tokensToBurn = calculateTokensToBurn(model.key, total_tokens, 2000);
            return {
                ...model,
                tokens_to_burn: tokensToBurn,
                estimated_time: total_tokens > 80000 ? '3-5 min' : '1-2 min'
            };
        });

        res.json({
            success: true,
            data: {
                agent_id,
                total_metadata_tokens: total_tokens,
                metadata_sources_count: metadata_count,
                models
            }
        });
    } catch (error: any) {
        console.error('Estimate error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to estimate deployment cost'
        });
    }
});

/**
 * POST /api/workforce/hire
 * Contextualized hire flow using Gemini
 */
router.post('/hire', async (req: Request, res: Response) => {
    try {
        const { agent_id, agent_blueprint, boss_reason } = req.body;
        const user = (req as any).user;
        const userId = user?.id || user?._id;
        const orgId = user?.organizationId || user?.organization || user?.orgId || user?.id || user?._id;

        if (!agent_id || !agent_blueprint || !orgId) {
            return res.status(400).json({
                success: false,
                error: 'agent_id, agent_blueprint, and organization context required'
            });
        }

        // 1. Get Org Context
        // Try direct ID match first, then fallback to user access match
        let org = await Organization.findById(orgId).catch(() => null);
        if (!org) {
            org = await Organization.findOne({ "users_access.userId": orgId });
        }

        if (!org) {
            console.error(`❌ [WorkforceController] Organization NOT found for ID/User: ${orgId}`);
            return res.status(404).json({ success: false, error: 'Organization not found' });
        }
        
        console.log(`🏢 [WorkforceController] Org found: ${org.name}. Preparing Gemini Context...`);

        // 2. Call AI Engine for Gemini Contextualization
        const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:5000';
        let contextualizedAgent = agent_blueprint;

        try {
            console.log(`🧠 [WorkforceController] Contextualizing ${agent_id}. Org: ${org.name}, Reason: ${boss_reason}`);
            const contextResponse = await axios.post(`${aiEngineUrl}/api/v1/workforce/contextualize`, {
                org_context: {
                    name: org.name,
                    industry: org.industry,
                    businessDescription: org.businessDescription,
                    targetAudience: org.targetAudience,
                    primaryGoal: org.primaryGoal,
                    heroOffering: org.heroOffering
                },
                agent_blueprint,
                boss_reason: boss_reason || "Direct hire based on generic role."
            });
            console.log(`✨ [WorkforceController] AI Engine Response received for ${agent_id}.`);
            
            // Extract usage data and contextualized agent
            const { agent: contextualized, usage, success, resource_metrics } = contextResponse.data;

            if (success && usage) {
                console.log(`💰 [Billing] workforce hire: ${usage.prompt_tokens} prompt, ${usage.completion_tokens} completion. Model: ${usage.model}`);
                await usageService.trackActivity(
                    org._id.toString(),
                    ActivityType.WORKFORCE_HIRE,
                    0, // rawAmount
                    {
                        prompt_tokens: usage.prompt_tokens,
                        completion_tokens: usage.completion_tokens,
                        model: usage.model,
                        resource_metrics: resource_metrics // ⚡ Energy Billing
                    },
                    `Hired & Fine-tuned agent: ${agent_id}`
                );
            }

            contextualizedAgent = (success && contextualized) ? contextualized : agent_blueprint;
        } catch (err: any) {
            console.error('❌ [WorkforceController] AI Engine contextualization failed:', err.message);
            if (err.response) console.error('Data:', err.response.data);
        }

        // 3. Create/Update Workforce Record (Active Status)
        // 🔥 Robust Mapping: Merge Gemini result with Blueprint to ensure no fields are lost
        const finalResponsibilities = (agent_blueprint.skills || []).map((blueSkill: any, i: number) => {
            const aiSkill = (contextualizedAgent.skills && contextualizedAgent.skills[i]) ? contextualizedAgent.skills[i] : {};
            return {
                name: blueSkill.name, // Always use blueprint name to prevent Gemini hallucinations
                description: aiSkill.description || blueSkill.description,
                explanation: aiSkill.explanation || blueSkill.explanation
            };
        });

        const workforceMember = await Workforce.findOneAndUpdate(
            { org_id: orgId, agent_id: agent_id },
            {
                $set: {
                    user_id: userId,
                    name: agent_blueprint.name,
                    role: agent_blueprint.role,
                    department: agent_blueprint.department,
                    avatar_url: agent_blueprint.profile_pic,
                    status: 'active',
                    constitution: {
                        identity_core: {
                            role_definition: contextualizedAgent.description || agent_blueprint.description,
                            tone_voice: org.industry_settings?.persona || 'professional'
                        },
                        protocols: {
                            responsibilities: finalResponsibilities
                        }
                    }
                }
            },
            { upsert: true, new: true }
        );

        console.log(`✅ [WorkforceController] Deployment finalized for ${agent_id}.`);
        
        // 🔥 PHASE 8: Physical Neo4j Wiring (Subconscious Engine)
        try {
            console.log(`🧠 [WorkforceController] Spawning Neural Connections in Subconscious Graph for ${agent_id}...`);
            const skills = finalResponsibilities.map((r: any) => ({
                id: `skill_${r.name?.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                name: r.name,
                provider: "local"
            }));

            await axios.post(`${aiEngineUrl}/api/v1/workforce/finalize`, {
                org_id: orgId.toString(),
                user_id: userId.toString(),
                agent_config: {
                    id: agent_id,
                    name: agent_blueprint.name,
                    role: agent_blueprint.role,
                    department: agent_blueprint.department || 'General',
                    boss_reason: boss_reason || 'Automated deployment via Workforce UI',
                    skills: skills
                }
            }, { timeout: 30000 });
            console.log(`🔌 [WorkforceController] Neo4j Topography successfully wired for ${agent_id}.`);
        } catch (wiringErr: any) {
            console.warn(`⚠️ [WorkforceController] Neural Wiring Failed (Non-fatal): ${wiringErr.message}`);
        }

        res.json({
            success: true,
            data: workforceMember,
            message: 'Agent hired and contextualization complete.'
        });

    } catch (error: any) {
        console.error('Hire flow error:', error);
        res.status(500).json({ success: false, error: 'Failed to initiate hire flow' });
    }
});

/**
 * POST /api/workforce/synthesize
 * Proxy to AI Engine for deep contextual synthesis
 */
router.post('/synthesize', async (req: Request, res: Response) => {
    try {
        const { dossier } = req.body;
        const user = (req as any).user;
        const userId = user?.id || user?._id;
        const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:5000';

        console.log(`📡 [WorkforceController] Proxying Synthesis Request for User: ${userId}...`);

        const response = await axios.post(`${aiEngineUrl}/api/v1/workforce/synthesize`, {
            dossier,
            user_id: userId
        });

        // 💰 Track Usage (Synthesize is a complex AI Analysis task)
        const { usage, resource_metrics } = response.data;
        if (usage && user.orgId) {
            await usageService.trackActivity(
                user.orgId,
                ActivityType.SKILL_ANALYSIS,
                1,
                { ...usage, resource_metrics },
                `Synthesized constitution for personnel`
            );
        }

        res.json({
            success: true,
            data: response.data
        });
    } catch (error: any) {
        console.error('Synthesis proxy error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to synthesize personnel protocols'
        });
    }
});

/**
 * POST /api/workforce/start-deployment
 * Deduct tokens and queue workforce synthesis job
 */
router.post('/start-deployment', async (req: Request, res: Response) => {
    try {
        const { agent_id, model_key, name, role, department, avatar_url, protocol, knowledge_sources } = req.body;
        const user = (req as any).user;
        const userId = user?.id || user?._id;

        if (!agent_id || !model_key || !userId) {
            return res.status(400).json({
                success: false,
                error: 'agent_id, model_key, and authenticated user required'
            });
        }

        // Verify model exists
        const model = MODEL_MASTER_CONFIG[model_key];
        if (!model) {
            return res.status(400).json({
                success: false,
                error: `Invalid model key: ${model_key}`
            });
        }

        // Get metadata analysis from Python
        const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:5000';
        const metadataResponse = await axios.post(`${aiEngineUrl}/api/v1/workforce/analyze-metadata`, {
            user_id: userId,
            agent_id
        });

        const { total_tokens } = metadataResponse.data;

        // Calculate tokens to deduct
        const tokensToBurn = calculateTokensToBurn(model_key, total_tokens, 2000);

        // Deduct tokens from user's wallet
        const { Organization } = await import('../modules/core/organization/Organization.js');
        const { Workforce } = await import('../models/Workforce.js');

        // 🔥 FIX: Use orgId from authenticated request
        const orgId = (req as any).user?.orgId || user.organization;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found in request. Please ensure you are properly authenticated.'
            });
        }

        const userOrg = await Organization.findById(orgId);

        if (!userOrg) {
            return res.status(404).json({
                success: false,
                error: 'Organization not found'
            });
        }

        // Check if sufficient balance
        const planTokens = (userOrg as any).usage?.words_limit || 0;
        const topupTokens = (userOrg as any).usage?.topup_balance || 0;
        const usedTokens = (userOrg as any).usage?.words_used || 0;
        const availableTokens = (planTokens - usedTokens) + topupTokens;

        if (availableTokens < tokensToBurn) {
            return res.status(402).json({
                success: false,
                error: `Insufficient tokens. Required: ${tokensToBurn}, Available: ${availableTokens}`,
                required_tokens: tokensToBurn,
                available_tokens: availableTokens
            });
        }

        // 1. Create Workforce Member Record
        const workforceMember = new Workforce({
            user_id: userId,
            org_id: orgId,
            agent_id,
            name: name || 'AI Employee',
            role: role || 'Assistant',
            department: department || 'General',
            avatar_url: avatar_url || '',
            constitution: protocol?.employee_constitution || {},
            status: 'training'
        });

        await workforceMember.save();

        // 2. Deduct tokens (topup first, then plan)
        const tokensToDeductFromTopup = Math.min(tokensToBurn, topupTokens);
        const tokensToDeductFromUsage = tokensToBurn - tokensToDeductFromTopup;

        await Organization.findByIdAndUpdate(userOrg._id, {
            $inc: {
                'usage.topup_balance': -tokensToDeductFromTopup,
                'usage.words_used': tokensToDeductFromUsage
            }
        });

        // 3. Queue background deployment (for vectorization & confirmation)
        const job = await workforceQueue.add('deploy-personnel', {
            job_id: workforceMember._id,
            user_id: userId,
            org_id: orgId,
            agent_id,
            workforce_id: workforceMember._id,
            protocol: protocol || {},
            knowledge_sources: knowledge_sources || [],
            model_key,
            model_name: model.name,
            total_input_tokens: total_tokens,
            tokens_deducted: tokensToBurn,
            timestamp: new Date()
        });

        res.json({
            success: true,
            data: {
                job_id: job.id,
                workforce_id: workforceMember._id,
                agent_id,
                model: model.name,
                tokens_deducted: tokensToBurn,
                status: 'queued',
                message: 'Neural synthesis finalized. Vectorizing personnel blueprint...'
            }
        });
    } catch (error: any) {
        console.error('Start deployment error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to start deployment'
        });
    }
});

/**
 * GET /api/workforce/status/:jobId
 */
router.get('/status/:jobId', async (req: Request, res: Response) => {
    try {
        const { jobId } = req.params;
        const job = await workforceQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }

        const state = await job.getState();
        const progress = job.progress;

        res.json({
            success: true,
            data: {
                job_id: jobId,
                status: state,
                progress,
                data: job.data,
                returnvalue: job.returnvalue,
                failedReason: job.failedReason
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/workforce/cards/:agentId
 */
/**
 * POST /api/workforce/save-protocol
 * Save or update a draft personnel constitution during onboarding
 */
router.post('/save-protocol', async (req: Request, res: Response) => {
    try {
        const { agent_id, protocol, name, role } = req.body;
        const user = (req as any).user;
        const userId = user?.id || user?._id;
        const orgId = req.headers['x-org-id'] || (req as any).user?.orgId || user?.organization;

        if (!agent_id || !userId || !orgId) {
            return res.status(400).json({
                success: false,
                error: 'agent_id and organization context required'
            });
        }

        // Upsert the workforce record (status remains 'training' until full deployment)
        const workforceMember = await Workforce.findOneAndUpdate(
            { org_id: orgId, agent_id: agent_id },
            {
                $set: {
                    user_id: userId,
                    name: name || 'AI Employee',
                    role: role || 'Assistant',
                    department: 'General',
                    constitution: protocol?.employee_constitution || protocol || {},
                    status: 'training' // Ensure it's in training/draft mode
                }
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            data: workforceMember,
            message: 'Personnel blueprint saved successfully'
        });
    } catch (error: any) {
        console.error('Save protocol error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to save personnel blueprint'
        });
    }
});

router.get('/cards/:agentId', async (req: Request, res: Response) => {
    try {
        const { agentId } = req.params;
        const user = (req as any).user;
        const userId = user?.id || user?._id;

        const cards = await ProtocolCard.find({
            user_id: userId,
            agent_id: agentId,
            status: 'active'
        }).sort({ priority: -1, created_at: -1 });

        res.json({
            success: true,
            data: {
                agent_id: agentId,
                cards,
                total: cards.length
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
