
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load Env
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function debugKnowledge() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("❌ MONGO_URI is missing in .env");
            process.exit(1);
        }

        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        console.log("✅ Connected.");

        // We define schema inline to be safe and standalone
        const SiteSchema = new mongoose.Schema({ orgId: String, domain: String, status: String }, { strict: false });
        const DocSchema = new mongoose.Schema({ orgId: String, name: String, status: String }, { strict: false });

        const Site = mongoose.model('Site', SiteSchema, 'sites');
        const KnowledgeDocument = mongoose.model('KnowledgeDocument', DocSchema, 'knowledge_documents');

        console.log("\n🔍 Scanning for Knowledge Data...");

        // 1. Check Sites (to populate sitesByOrg for simulation)
        const allSites = await Site.find({});
        console.log(`\nFound ${allSites.length} total Sites.`);

        allSites.forEach(s => {
            console.log(`- Site ID: ${s._id}, Org: ${s.orgId} (${typeof s.orgId}), Status: '${s.status}', Domain: ${s.domain}`);
        });

        const sitesByOrg = {};
        allSites.forEach(s => {
            const oid = s.orgId ? s.orgId.toString() : 'unknown';
            sitesByOrg[oid] = (sitesByOrg[oid] || 0) + 1;
        });

        // 2. Check Docs (to populate docsByOrg for simulation)
        const allDocs = await KnowledgeDocument.find({});
        const docsByOrg = {};
        allDocs.forEach(d => {
            const oid = d.orgId ? d.orgId.toString() : 'unknown';
            docsByOrg[oid] = (docsByOrg[oid] || 0) + 1;
        });

        // 3. Logic Check (Simulating getOverview)
        console.log("\n🧪 CONTROLLER LOGIC SIMULATION:");
        const testOrgIds = Object.keys(sitesByOrg).concat(Object.keys(docsByOrg)).filter((v, i, a) => a.indexOf(v) === i);

        for (const orgId of testOrgIds) {
            console.log(`\nChecking Org: ${orgId}`);
            const sites = await Site.find({ orgId: orgId, status: { $ne: 'deleted' } });
            const docs = await KnowledgeDocument.find({ orgId: orgId, status: { $ne: 'deleted' } });

            console.log(`- Sites (Active): ${sites.length}`);
            console.log(`- Docs (Active): ${docs.length}`);

            // Simulate the Response Structure
            const response = {
                success: true,
                sources: {
                    websites: sites.map(s => ({ id: s._id, domain: s.domain })),
                    documents: docs.map(d => ({ id: d._id, name: d.name })),
                    api: [],
                    custom_text: []
                }
            };

            console.log("Generated Response Structure:");
            console.log(JSON.stringify(response, null, 2));

            if (response.sources.websites.length === 0 && response.sources.documents.length === 0) {
                console.warn("⚠️ NO SOURCES in response for this Org.");
            }
        }

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\n👋 Done.");
        process.exit(0);
    }
}

debugKnowledge();
