import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ MongoDB connected');
};

// Site model schema (simplified)
const siteSchema = new mongoose.Schema({
    domain: String,
    orgId: String,
    pages: [{
        url: String,
        status: String,
        error_message: String,
        title: String
    }],
    status: String
}, { collection: 'sites' });

const Site = mongoose.model('Site', siteSchema);

async function fixPendingPages() {
    console.log('🔧 Fixing pending pages...');

    await connectDB();

    // Find all sites with pending pages
    const sitesWithPending = await Site.find({
        'pages.status': 'pending'
    });

    console.log(`Found ${sitesWithPending.length} sites with pending pages`);

    for (const site of sitesWithPending) {
        console.log(`\n📝 Site: ${site.domain}`);

        let pendingCount = 0;
        for (const page of site.pages) {
            if (page.status === 'pending') {
                page.status = 'ignored';
                page.error_message = 'Auto-fixed: Discovered page (not crawled)';
                pendingCount++;
            }
        }

        site.markModified('pages');
        await site.save();
        console.log(`   ✅ Marked ${pendingCount} pages as ignored`);
    }

    console.log('\n✨ Done! All pending pages fixed.');
    process.exit(0);
}

fixPendingPages().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
