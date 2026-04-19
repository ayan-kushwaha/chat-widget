import { Organization } from '../src/modules/core/organization/Organization.js';
import { KnowledgeDocument } from '../src/modules/dashboard/knowledge/models/KnowledgeDocument.js';
import { updateSystemStorage } from '../src/modules/dashboard/knowledge/storage.helper.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function backfillSystemStorage() {
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

            // Calculate MinIO size from existing KnowledgeDocuments
            const docs = await KnowledgeDocument.find({
                orgId: org._id.toString(),
                status: { $ne: 'deleted' }
            });

            const minioMB = docs.reduce((total, doc) => {
                return total + (doc.size || 0);
            }, 0) / (1024 * 1024);

            console.log(`   📄 Found ${docs.length} files`);
            docs.forEach(doc => {
                const sizeMB = (doc.size || 0) / (1024 * 1024);
                console.log(`      - ${doc.name}: ${sizeMB.toFixed(2)} MB`);
            });

            // Update MinIO storage
            if (minioMB > 0) {
                await updateSystemStorage(org._id.toString(), 'minio', minioMB, 'set');
                console.log(`\n   ✅ Set MinIO storage: ${minioMB.toFixed(2)} MB`);
            }
        }

        console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log('🎉 Backfill complete!');
        console.log('✅ All MinIO storage updated');
        console.log('\n💡 Next: Refresh your dashboard to see MinIO MB values!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

backfillSystemStorage();
