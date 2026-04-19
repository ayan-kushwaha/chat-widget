import 'dotenv/config';
process.env.REDIS_URL = "redis://127.0.0.1:6379"; // Force local Redis

/**
 * Test script to verify Memory System (Summarization)
 * 
 * This simulates a chat session and verifies that:
 * 1. Chat history is saved to Redis
 * 2. Summary worker extracts insights
 * 3. ActivityLog is created
 * 4. Leads are captured if contact info present
 */

const TEST_ORG_ID = '674585f2f4c4dc406c51c12a'; // Replace with your org ID
const SOCKET_ID = `test_${Date.now()}`;
const QUEUE_NAME = 'summarize-queue';

async function testMemorySystem() {
    console.log('🧪 Testing Memory System...\n');

    // Dynamic imports to ensure env var is set before modules load
    const { connectDB } = await import('../src/libs/mongo.js');
    const { redis } = await import('../src/libs/redis.js');
    const { ActivityLog } = await import('../src/models/ActivityLog.js');
    const Lead = (await import('../src/models/Lead.js')).default;
    const { Organization } = await import('../src/models/Organization.js');
    const { Queue } = await import('bullmq');

    try {
        // Connect to DB
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // 1. Simulate chat session in Redis
        console.log('\n📝 Step 1: Simulating chat session...');
        const messages = [
            { role: 'user', content: 'Hi, I want to know about your pricing', timestamp: Date.now() },
            { role: 'ai', content: 'We have 3 plans: Starter, Pro, and Enterprise. What are you looking for?', timestamp: Date.now() + 1000 },
            { role: 'user', content: 'I need the Pro plan. My email is test@example.com', timestamp: Date.now() + 2000 },
            { role: 'ai', content: 'Great! I can help you with that. The Pro plan is $99/month.', timestamp: Date.now() + 3000 }
        ];

        const redisKey = `chat_history:${SOCKET_ID}`;
        for (const msg of messages) {
            await redis.rpush(redisKey, JSON.stringify(msg));
        }
        console.log(`✅ Saved ${messages.length} messages to Redis (key: ${redisKey})`);

        // 2. Verify Redis storage
        const stored = await redis.lrange(redisKey, 0, -1);
        console.log(`✅ Verified: ${stored.length} messages in Redis`);

        // 3. Trigger summarization
        console.log('\n🤖 Step 2: Triggering summarization worker...');
        const summarizeQueue = new Queue(QUEUE_NAME, { connection: redis });

        await summarizeQueue.add("summarize-chat", {
            socketId: SOCKET_ID,
            orgId: TEST_ORG_ID
        }, { removeOnComplete: true });

        console.log('✅ Job added to summarize-queue');

        // Check if ActivityLog and Lead were created
        console.log('\n📊 Step 3: Checking results...');

        // Wait a bit for worker to process (if running)
        console.log('⏳ Waiting 15 seconds for worker to process...');
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Check ActivityLog
        const activityLogs = await ActivityLog.find({
            'metadata.user_context.session_id': SOCKET_ID
        }).sort({ timestamp: -1 }).limit(1);

        if (activityLogs.length > 0) {
            console.log('✅ ActivityLog created:');
            console.log(JSON.stringify(activityLogs[0], null, 2));
        } else {
            console.log('⚠️  No ActivityLog found yet. Worker might not have processed.');
        }

        // Check Leads
        const leads = await Lead.find({ visitorId: SOCKET_ID }).limit(1);
        if (leads.length > 0) {
            console.log('\n✅ Lead captured:');
            console.log(JSON.stringify(leads[0], null, 2));
        } else {
            console.log('\n⚠️  No Lead found. Email detection might not have worked.');
        }

        // Check Organization insights
        const org = await Organization.findById(TEST_ORG_ID);
        const recentInsights = org?.brain?.insights?.slice(-5) || [];
        if (recentInsights.length > 0) {
            console.log('\n🧠 Recent Insights (Knowledge Gaps):');
            recentInsights.forEach((insight: any, i: number) => {
                console.log(`  ${i + 1}. ${insight.question || insight.pattern_description}`);
            });
        }

        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await redis.del(redisKey);
        console.log('✅ Deleted Redis test data');

        console.log('\n' + '─'.repeat(60));
        console.log('✅ Memory System Test Complete!');
        console.log('─'.repeat(60));

        process.exit(0);

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run test
testMemorySystem();
