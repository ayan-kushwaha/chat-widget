import axios from "axios";
import jwt from "jsonwebtoken";

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}/v1`;
const JWT_SECRET = "supersecret";

// Generate Token
const token = jwt.sign({ userId: "admin", role: "admin" }, JWT_SECRET, { expiresIn: "1h" });

const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
};

async function runVerification() {
    console.log("🚀 Starting MVP Verification...");

    try {
        // 1. Create a Test Site
        console.log("\n1️⃣ Creating Test Site...");
        const siteRes = await axios.post(
            `${BASE_URL}/sites`,
            {
                name: "Verification Site",
                url: "https://example.com",
                domains: ["https://example.com"],
                crawlFrequency: "7d",
            },
            { headers }
        );
        const siteId = siteRes.data.site._id;
        console.log(`✅ Site Created: ${siteId}`);

        // 2. Add Manual Knowledge
        console.log("\n2️⃣ Adding Manual Knowledge...");
        const manualText = "Cluaiz is an advanced AI agent platform that supports hybrid model routing and data lifecycle management.";
        await axios.post(
            `${BASE_URL}/knowledge/${siteId}/manual-text`,
            {
                text: manualText,
                title: "About Cluaiz",
            },
            { headers }
        );
        console.log("✅ Manual Knowledge Added. Waiting 15s for embedding...");
        await new Promise((r) => setTimeout(r, 15000)); // Wait for worker

        // 3. Test Chat - Small Model (Greeting)
        console.log("\n3️⃣ Testing Chat (Small Model - Greeting)...");
        const chatSmall = await axios.post(
            `${BASE_URL}/knowledge/${siteId}/chat`,
            {
                query: "Hi, how are you?",
                history: [],
            },
            { headers }
        );
        console.log(`Response: ${chatSmall.data.answer}`);
        console.log(`Model Used: ${chatSmall.data.modelUsed}`);
        if (chatSmall.data.modelUsed === "ollama") {
            console.log("✅ Correctly routed to Ollama (Small).");
        } else {
            console.log("⚠️ Warning: Routed to " + chatSmall.data.modelUsed);
        }

        // 4. Test Chat - Smart Model (Business Query)
        console.log("\n4️⃣ Testing Chat (Smart Model - Business)...");
        const chatSmart = await axios.post(
            `${BASE_URL}/knowledge/${siteId}/chat`,
            {
                query: "What is Cluaiz?",
                history: [],
            },
            { headers }
        );
        console.log(`Response: ${chatSmart.data.answer}`);
        console.log(`Model Used: ${chatSmart.data.modelUsed}`);
        if (chatSmart.data.modelUsed === "gemini") {
            console.log("✅ Correctly routed to Gemini (Smart).");
        } else {
            console.log("⚠️ Warning: Routed to " + chatSmart.data.modelUsed);
        }

        // 5. Test Analyze Session
        console.log("\n5️⃣ Testing Session Analysis...");
        const history = [
            { role: "user", content: "Hi" },
            { role: "model", content: "Hello! How can I help?" },
            { role: "user", content: "What is Cluaiz?" },
            { role: "model", content: "Cluaiz is an AI platform." },
        ];
        const analyzeRes = await axios.post(
            `${BASE_URL}/knowledge/${siteId}/analyze`,
            {
                history,
                visitorId: "visitor_123",
            },
            { headers }
        );
        console.log("Analysis Result:", analyzeRes.data.analysis);
        if (analyzeRes.data.success) {
            console.log("✅ Session Analyzed & Saved.");
        }

        console.log("\n🎉 MVP Verification Complete!");

    } catch (error: any) {
        console.error("❌ Verification Failed:", error.response?.data || error.message);
    }
}

runVerification();
