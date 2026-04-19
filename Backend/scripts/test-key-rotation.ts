import { io, Socket } from 'socket.io-client';

/**
 * Test script to verify Gemini Key Rotation
 * 
 * This will spam the chat endpoint to ensure keys are rotating properly
 * and no rate limit errors occur.
 */

const API_URL = 'http://localhost:5000';
const ORG_ID = '674585f2f4c4dc406c51c12a'; // Replace with your actual org ID

// Test configuration
const NUM_REQUESTS = 20; // Send 20 requests (more than 15, which is single key limit)
const DELAY_MS = 500; // Small delay between requests

interface TestResult {
    successful: number;
    failed: number;
    errors: Array<{ request: number; error: string }>;
}

async function sendMessage(socket: Socket, message: string, index: number): Promise<boolean> {
    return new Promise((resolve) => {
        let timeout: NodeJS.Timeout;

        const onReceive = (data: any) => {
            clearTimeout(timeout);
            if (data.sender === 'ai' || data.answer) {
                console.log(`✅ Request ${index}/${NUM_REQUESTS}: Success - Got response`);
                resolve(true);
            } else if (data.sender === 'system') {
                console.error(`❌ Request ${index}/${NUM_REQUESTS}: System error - ${data.answer}`);
                resolve(false);
            }
        };

        socket.once('receive_message', onReceive);

        // Timeout after 30 seconds
        timeout = setTimeout(() => {
            socket.off('receive_message', onReceive);
            console.error(`❌ Request ${index}/${NUM_REQUESTS}: Timeout`);
            resolve(false);
        }, 30000);

        // Send message
        socket.emit('send_message', {
            orgId: ORG_ID,
            message: message,
            history: []
        });
    });
}

async function testKeyRotation() {
    console.log('🧪 Testing Gemini Key Rotation via Socket.IO...\n');

    const results: TestResult = {
        successful: 0,
        failed: 0,
        errors: []
    };

    // Create socket connection
    const socket = io(API_URL, {
        transports: ['websocket'],
        reconnection: false
    });

    await new Promise<void>((resolve, reject) => {
        socket.on('connect', () => {
            console.log('✅ Connected to Socket.IO server\n');
            resolve();
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Connection failed:', error.message);
            reject(error);
        });

        setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    // Join room
    socket.emit('join_room', ORG_ID);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send test messages
    for (let i = 1; i <= NUM_REQUESTS; i++) {
        try {
            const success = await sendMessage(socket, `Test message ${i}: What is AI?`, i);

            if (success) {
                results.successful++;
            } else {
                results.failed++;
                results.errors.push({
                    request: i,
                    error: 'No response or system error'
                });
            }

        } catch (error: any) {
            console.error(`❌ Request ${i}/${NUM_REQUESTS}: Exception -`, error.message);
            results.failed++;
            results.errors.push({
                request: i,
                error: error.message || 'Unknown error'
            });
        }

        // Small delay to avoid overwhelming
        if (i < NUM_REQUESTS) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
    }

    // Disconnect
    socket.disconnect();

    // Print summary
    console.log('\n📊 Test Results:');
    console.log('─'.repeat(50));
    console.log(`Total Requests: ${NUM_REQUESTS}`);
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.successful / NUM_REQUESTS) * 100).toFixed(2)}%`);

    if (results.errors.length > 0) {
        console.log('\n🔴 Errors:');
        results.errors.forEach(err => {
            console.log(`  Request ${err.request}: ${err.error}`);
        });
    }

    console.log('\n' + '─'.repeat(50));

    // Check for rate limit errors
    const rateLimitErrors = results.errors.filter(e =>
        e.error.includes('429') || e.error.includes('quota') || e.error.includes('rate limit')
    );

    if (rateLimitErrors.length > 0) {
        console.log('⚠️  WARNING: Rate limit errors detected!');
        console.log('   Key rotation may not be working properly.');
    } else if (results.successful === NUM_REQUESTS) {
        console.log('🎉 SUCCESS: All requests passed! Key rotation is working.');
    } else if (results.successful > 0) {
        console.log('⚠️  PARTIAL SUCCESS: Some requests passed, but not all.');
    }

    process.exit(results.successful === NUM_REQUESTS ? 0 : 1);
}

// Run test
testKeyRotation().catch((error) => {
    console.error('💥 Test failed to run:', error.message);
    process.exit(1);
});
