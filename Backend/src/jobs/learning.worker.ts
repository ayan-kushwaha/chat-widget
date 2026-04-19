import { Worker } from "bullmq";
import { redisConnection } from "@shared/libs/redis.js";
import { connectDB } from "@shared/libs/mongo.js";
import { Organization } from "@modules/core/organization/Organization.js";

export const learningQueueName = "learning-queue";

console.log("🧠 Learning Worker Started...");

async function runWorker() {
    await connectDB();

    new Worker(
        learningQueueName,
        async (job) => {
            const { orgId } = job.data;
            console.log(`Processing learning for Org: ${orgId}`);

            try {
                // Mock facts for now
                const newFacts = [
                    {
                        fact: "Users are asking about API rate limits frequently",
                        confidence: 85,
                        source: "daily_analysis",
                        status: 'pending' // Safety: Requires admin approval
                    }
                ];

                if (newFacts.length > 0) {
                    const { Brain } = await import("@modules/dashboard/brain/models/Brain.js");
                    const brain = await Brain.findOne({ orgId });

                    if (brain) {
                        // Add new facts
                        if (!brain.auto_learned_facts) {
                            brain.auto_learned_facts = [] as any;
                        }

                        // Push new facts
                        for (const fact of newFacts) {
                            brain.auto_learned_facts.push(fact);
                        }

                        // FIFO Limit: Keep only top 50
                        while (brain.auto_learned_facts.length > 50) {
                            brain.auto_learned_facts.shift();
                        }

                        await brain.save();
                        console.log(`✅ Updated auto-learned facts for ${orgId}`);
                    }
                }

            } catch (err: any) {
                console.error(`❌ Learning Worker Error: ${err.message}`);
            }
        },
        {
            connection: redisConnection,
            concurrency: 1
        }
    );
}

runWorker();
