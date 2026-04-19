
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

        // Import Models directly (avoiding module alias issues in script)
        // We define schema inline to be safe and standalone
        const SiteSchema = new mongoose.Schema({ orgId: String, domain: String, status: String }, { strict: false });
        const DocSchema = new mongoose.Schema({ orgId: String, name: String, status: String }, { strict: false });
        const BrainSchema = new mongoose.Schema({ orgId: String, knowledge_base: Object }, { strict: false });

        const Site = mongoose.model('Site', SiteSchema, 'sites');
        const KnowledgeDocument = mongoose.model('KnowledgeDocument', DocSchema, 'knowledge_documents');
        const Brain = mongoose.model('Brain', BrainSchema, 'brains');

        console.log("\n🔍 Scanning for Knowledge Data...");

        // 1. Check Sites
        const sites = await Site.find({});
        console.log(`\nFound ${sites.length} total Sites.`);

        // Group by Org
        const sitesByOrg: Record<string, number> = {};
        sites.forEach(s => {
            const oid = s.orgId?.toString() || 'unknown';
            sitesByOrg[oid] = (sitesByOrg[oid] || 0) + 1;
        });
        console.log("Sites by Org:", sitesByOrg);

        // 2. Check Docs
        const docs = await KnowledgeDocument.find({});
        console.log(`\nFound ${docs.length} total Documents.`);
        const docsByOrg: Record<string, number> = {};
        docs.forEach(d => {
            const oid = d.orgId?.toString() || 'unknown';
            docsByOrg[oid] = (docsByOrg[oid] || 0) + 1;
        });
        console.log("Docs by Org:", docsByOrg);

        // 3. Logic Check
        console.log("\n🧪 CONTROLLER LOGIC SIMULATION:");
        const testOrgIds = Object.keys(sitesByOrg).concat(Object.keys(docsByOrg)).filter((v, i, a) => a.indexOf(v) === i);

        for (const orgId of testOrgIds) {
            console.log(`\nChecking Org: ${orgId}`);
            const s = await Site.find({ orgId: orgId, status: { $ne: 'deleted' } });
            const d = await KnowledgeDocument.find({ orgId: orgId, status: { $ne: 'deleted' } });

            console.log(`- Sites (Active): ${s.length}`);
            console.log(`- Docs (Active): ${d.length}`);

            if (s.length === 0 && d.length === 0) {
                console.warn("⚠️ NO ACTIVE SOURCES found for this Org via standard query!");
            } else {
                console.log("✅ Data exists and should be returned by API.");
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
