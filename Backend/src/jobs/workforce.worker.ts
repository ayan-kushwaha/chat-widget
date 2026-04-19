import dotenv from 'dotenv';
dotenv.config();

import { Worker } from "bullmq";
import { redisConnection } from "../modules/shared/libs/redis.js";
import { connectDB } from "../modules/shared/libs/mongo.js";
import { workforceQueue } from "./queues.js";
import { Workforce } from "../models/Workforce.js";
import axios from "axios";
import { io as ioClient } from "socket.io-client";

// Initialize Socket.io client for broadcasting updates
let socket: any = null;
try {
    socket = ioClient(process.env.BACKEND_URL || "http://localhost:4000", {
        transports: ['websocket'],
        reconnection: true
    });
} catch (e) {
    console.warn('⚠️ [WorkforceWorker] Socket.io connection failed');
}

const emitStatus = (orgId: string, agentId: string, status: string, data?: any) => {
    if (!socket?.connected) return;
    try {
        socket.emit('agent_deployment_update', {
            orgId,
            agentId,
            status,
            timestamp: new Date(),
            ...data
        });
    } catch (e) {
        console.error('❌ [Socket] Emit failed:', e);
    }
};

const getAiEngineUrl = () => process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';

console.log("👷 Workforce Worker Initialized...");
connectDB();

export const workforceWorker = new Worker(workforceQueue.name, async (job) => {
    const { workforce_id, org_id, agent_id, protocol, knowledge_sources } = job.data;

    console.log(`🚀 [WorkforceWorker] Processing Deployment: ${agent_id} | Org: ${org_id}`);

    try {
        // 1. Update status to deployment-in-progress (training)
        await Workforce.findByIdAndUpdate(workforce_id, { status: 'training' });
        emitStatus(org_id, agent_id, 'vectorizing', { progress: 40, message: 'Syncing Constitution to Neural Vault...' });

        const constitution = protocol.employee_constitution;

        // 2. Prepare text for vectorization (Identity + Protocols)
        const identityText = `ROLE DEFINITION: ${constitution.identity_core.role_definition}\nTONE & VOICE: ${constitution.identity_core.tone_voice}`;

        const protocolChunks = [
            `RESPONSIBILITIES: ${constitution.protocols.responsibilities.join(', ')}`,
            `PERFORMANCE METRICS: ${constitution.protocols.performance_metrics.join(', ')}`,
            `COMPLIANCE & SAFETY: ${constitution.protocols.compliance_safety.join(', ')}`,
            `CONFIDENTIALITY & HONESTY: ${constitution.protocols.confidentiality_honesty.join(', ')}`
        ];

        const knowledgeGuidance = (knowledge_sources || []).map((ks: any) =>
            `KNOWLEDGE SOURCE [${ks.name}]: ${ks.guidance}`
        );

        const fullConstitutionText = [identityText, ...protocolChunks, ...knowledgeGuidance].join('\n\n');

        // 3. Call AI Engine for Bulk Vectorization
        await job.updateProgress(60);

        const vectorResponse = await axios.post(`${getAiEngineUrl()}/api/v1/knowledge/embed/batch`, {
            orgId: org_id,
            sourceId: `agent-blueprint-${agent_id}`,
            sourceType: 'agent_constitution',
            tags: ['constitution', 'rules', 'identity', agent_id],
            chunks: [{
                text: fullConstitutionText,
                metadata: {
                    type: 'constitution',
                    agent_id,
                    workforce_id: workforce_id
                }
            }]
        }, { timeout: 60000 });

        if (!vectorResponse.data || !vectorResponse.data.ids) {
            throw new Error("Vector DB synchronization failed");
        }

        // 3.5. Call AI Engine for Neo4j Semantic Wiring (Phase 8 Blueprint)
        await job.updateProgress(80);
        emitStatus(org_id, agent_id, 'neural_wiring', { progress: 80, message: 'Spawning Neural Connections in Subconscious Graph...' });
        
        try {
            const wfData = await Workforce.findById(workforce_id);
            const skills = constitution?.protocols?.responsibilities?.map((r: any) => ({
                id: `skill_${r.name?.toLowerCase().replace(/\s+/g, '_')}`,
                name: r.name,
                provider: "local"
            })) || [];

            await axios.post(`${getAiEngineUrl()}/api/v1/workforce/finalize`, {
                org_id: org_id,
                user_id: job.data.user_id,
                agent_config: {
                    id: agent_id,
                    name: wfData?.name || agent_id,
                    role: wfData?.role || 'Assistant',
                    department: wfData?.department || 'General',
                    boss_reason: 'Automated deployment via Workforce UI',
                    skills: skills
                }
            }, { timeout: 30000 });
            console.log(`🧠 [WorkforceWorker] Neo4j Topography successfully wired for ${agent_id}.`);
        } catch (wiringErr: any) {
            console.warn(`⚠️ [WorkforceWorker] Neural Wiring Failed (Non-fatal): ${wiringErr.message}`);
        }

        // 4. Finalize Deployment
        await Workforce.findByIdAndUpdate(workforce_id, { status: 'active' });
        emitStatus(org_id, agent_id, 'active', {
            progress: 100,
            message: 'Personnel Deployed & Active',
            workforce_id
        });

        console.log(`✅ [WorkforceWorker] Workforce Member ${agent_id} is now LIVE for Org ${org_id}`);
        return { success: true, workforce_id };

    } catch (error: any) {
        console.error(`❌ [WorkforceWorker] Critical Failure:`, error.message);
        await Workforce.findByIdAndUpdate(workforce_id, { status: 'failed' });
        emitStatus(org_id, agent_id, 'failed', { error: error.message });
        throw error;
    }
}, {
    connection: redisConnection,
    concurrency: 2,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 }
});
