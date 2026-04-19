import axios from "axios";
import jwt from "jsonwebtoken";

const BASE_URL = "http://localhost:4000/v1";
const JWT_SECRET = "supersecret";

// Generate token
const token = jwt.sign(
  { userId: "admin", role: "admin" }, 
  JWT_SECRET, 
  { expiresIn: "1h" }
);

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
};

async function quickTest() {
  console.log("🚀 Starting Quick API Test...\n");

  try {
    // 1. Create Site
    console.log("1️⃣ Creating Site...");
    const siteRes = await axios.post(`${BASE_URL}/sites`, {
      name: "Quick Test Site",
      url: "https://quicktest.com",
      domains: ["https://quicktest.com"],
      crawlFrequency: "7d"
    }, { headers });
    
    const siteId = siteRes.data.site._id;
    console.log(`✅ Site Created: ${siteId}\n`);

    // 2. Add Manual Knowledge
    console.log("2️⃣ Adding Manual Knowledge...");
    await axios.post(`${BASE_URL}/knowledge/${siteId}/manual-text`, {
      text: "This is a quick test for the Cluaiz AI platform. It supports manual knowledge input, hybrid model routing, and session analysis.",
      title: "Quick Test Knowledge"
    }, { headers });
    console.log("✅ Knowledge Added. Waiting 15s for embedding...\n");

    // 3. Wait for embedding
    await new Promise(r => setTimeout(r, 15000));

    // 4. Test Chat
    console.log("3️⃣ Testing Chat...");
    const chatRes = await axios.post(`${BASE_URL}/knowledge/${siteId}/chat`, {
      query: "What is this about?",
      history: []
    }, { headers });
    console.log(`✅ Chat Response: ${chatRes.data.answer}`);
    console.log(`   Model Used: ${chatRes.data.modelUsed}\n`);

    // 5. Test Session Analysis
    console.log("4️⃣ Testing Session Analysis...");
    const analyzeRes = await axios.post(`${BASE_URL}/knowledge/${siteId}/analyze`, {
      history: [
        { role: "user", content: "Hi" },
        { role: "model", content: "Hello! How can I help?" },
        { role: "user", content: "What is this about?" },
        { role: "model", content: chatRes.data.answer }
      ],
      visitorId: "quick_test_visitor"
    }, { headers });
    console.log("✅ Session Analyzed:");
    console.log(`   Summary: ${analyzeRes.data.analysis.summary}`);
    console.log(`   Intent: ${analyzeRes.data.analysis.intent}\n`);

    console.log("🎉 All Tests Passed!");

  } catch (error: any) {
    console.error("❌ Test Failed:", error.response?.data || error.message);
  }
}

quickTest();
