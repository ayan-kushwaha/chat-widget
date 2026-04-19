import { Organization } from '../src/modules/core/organization/Organization.js';
import { KnowledgeDocument } from '../src/modules/dashboard/knowledge/models/KnowledgeDocument.js';
import { Site } from '../src/modules/dashboard/knowledge/models/Site.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function backfillStorage() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cluaiz');
        console.log('✅ Connected!\n');

        const orgs = await Organization.find({});
        console.log(`📦 Found ${orgs.length} organizations to process\n`);

        for (const org of orgs) {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📊 Processing: ${org.name || 'Unnamed'}`);
            console.log(`   ID: ${org._id}`);

            // 1. Calculate Documents MB
            const docs = await KnowledgeDocument.find({
                orgId: org._id.toString(),
                status: { $ne: 'deleted' }
            });

            const documentsMB = docs.reduce((total, doc) => {
                return total + (doc.size || 0);
            }, 0) / (1024 * 1024);

            console.log(`   📄 Documents: ${docs.length} files`);
            docs.forEach(doc => {
                const sizeMB = (doc.size || 0) / (1024 * 1024);
                console.log(`      - ${doc.name}: ${sizeMB.toFixed(2)} MB`);
            });

            // 2. Calculate Websites MB (estimate from token_count)
            const sites = await Site.find({
                orgId: org._id.toString(),
                status: { $ne: 'deleted' }
            });

            // Rough estimate: 1 token ≈ 4 bytes (OpenAI standard)
            const websitesMB = sites.reduce((total, site) => {
                const tokens = (site as any).token_count || 0;
                const bytes = tokens * 4;
                return total + bytes;
            }, 0) / (1024 * 1024);

            console.log(`   🌐 Websites: ${sites.length} sites`);
            sites.forEach(site => {
                const tokens = (site as any).token_count || 0;
                const sizeMB = (tokens * 4) / (1024 * 1024);
                console.log(`      - ${(site as any).domain}: ${sizeMB.toFixed(2)} MB (${tokens} tokens)`);
            });

            // 3. Initialize storage_breakdown
            if (!org.usage) {
                (org as any).usage = {};
            }

            if (!org.usage.storage_breakdown) {
                org.usage.storage_breakdown = {
                    documents_mb: 0,
                    websites_mb: 0,
                    training_mb: 0,
                    chat_history_mb: 0,
                    forms_mb: 0,
                    auto_learning_mb: 0,
                    total_mb: 0
                };
            }

            org.usage.storage_breakdown.documents_mb = Math.round(documentsMB * 100) / 100;
            org.usage.storage_breakdown.websites_mb = Math.round(websitesMB * 100) / 100;
            org.usage.storage_breakdown.total_mb = Math.round((documentsMB + websitesMB) * 100) / 100;

            await org.save();

            console.log(`\n   ✅ Updated storage_breakdown:`);
            console.log(`      Documents: ${org.usage.storage_breakdown.documents_mb} MB`);
            console.log(`      Websites: ${org.usage.storage_breakdown.websites_mb} MB`);
            console.log(`      📊 TOTAL: ${org.usage.storage_breakdown.total_mb} MB`);
        }

        console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log('🎉 Backfill complete!');
        console.log('✅ All organizations updated');
        console.log('\n💡 Next: Refresh your dashboard to see real MB values!\n');

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

backfillStorage();
