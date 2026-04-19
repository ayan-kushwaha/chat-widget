import cron from 'node-cron';
import { Site } from '@modules/dashboard/knowledge/models/Site.js';
import { Organization } from '@modules/core/organization/Organization.js';
import { crawlQueue } from './queues.js';

/**
 * Auto-Refresh Scheduler
 * 
 * Runs every 6 hours and checks which websites need refresh
 * based on their frequency settings.
 * 
 * Frequencies:
 * - weekly: 7 days
 * - bi-weekly: 14 days
 * - monthly: 30 days
 * - never: manual only (skipped)
 */

export const startWebsiteAutoRefresh = () => {
    console.log('🔄 Starting Website Auto-Refresh Scheduler...');

    // Run every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        try {
            console.log('⏰ [Auto-Refresh] Checking sites for scheduled refresh...');

            // Find all active sites with auto-refresh enabled
            const sites = await Site.find({
                crawl_schedule: { $in: ['weekly', 'bi-weekly', 'monthly'] },
                status: 'active'
            });

            console.log(`📊 [Auto-Refresh] Found ${sites.length} sites with auto-refresh enabled`);

            for (const site of sites) {
                try {
                    // Check if site is due for refresh
                    const isDue = await checkIfDue(site);
                    if (!isDue) {
                        continue;
                    }

                    // Check subscription before processing
                    const org = await Organization.findById(site.orgId);
                    if (!org) {
                        console.warn(`⚠️ [Auto-Refresh] Organization not found for site ${site.domain}`);
                        continue;
                    }

                    if (org.subscription?.status !== 'active') {
                        console.log(`⏸️ [Auto-Refresh] Skipping ${site.domain} - subscription ${org.subscription?.status}`);
                        continue;
                    }

                    // Get all active pages
                    const activePages = site.pages.filter((p: any) => p.isActive && p.status !== 'failed');
                    if (activePages.length === 0) {
                        console.log(`⚠️ [Auto-Refresh] No active pages for ${site.domain}`);
                        continue;
                    }

                    // Queue crawl job (medium priority for scheduled jobs)
                    await crawlQueue.add('crawl-page', {
                        orgId: site.orgId.toString(),
                        siteId: site._id.toString(),
                        urls: activePages.map((p: any) => p.url),
                        startUrl: site.domain,
                        isScheduled: true  // Mark as scheduled refresh
                    }, {
                        priority: 5,  // Medium priority
                        removeOnComplete: true
                    });

                    console.log(`✅ [Auto-Refresh] Scheduled refresh for ${site.domain} (${activePages.length} pages)`);

                    // Update last crawled timestamp
                    site.updatedAt = new Date();
                    await site.save();

                } catch (siteErr: any) {
                    console.error(`❌ [Auto-Refresh] Error processing ${site.domain}:`, siteErr.message);
                }
            }

            console.log('✅ [Auto-Refresh] Scan complete');

        } catch (err: any) {
            console.error('❌ [Auto-Refresh] Scheduler error:', err.message);
        }
    });

    console.log('✅ Website Auto-Refresh Scheduler activated (runs every 6 hours)');
};

/**
 * Check if site is due for refresh based on frequency
 */
async function checkIfDue(site: any): Promise<boolean> {
    const now = new Date();
    const lastCrawl = site.updatedAt || site.createdAt;
    const hoursSince = (now.getTime() - lastCrawl.getTime()) / (1000 * 60 * 60);

    let dueHours: number;
    switch (site.crawl_schedule) {
        case 'weekly':
            dueHours = 168; // 7 days
            break;
        case 'bi-weekly':
            dueHours = 336; // 14 days
            break;
        case 'monthly':
            dueHours = 720; // 30 days
            break;
        default:
            return false; // 'never' or unknown
    }

    const isDue = hoursSince >= dueHours;

    if (isDue) {
        console.log(`⏰ [Auto-Refresh] ${site.domain} is due (${Math.round(hoursSince)}h since last crawl, frequency: ${site.crawl_schedule})`);
    }

    return isDue;
}
