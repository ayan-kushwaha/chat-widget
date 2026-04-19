import cron from 'node-cron';

/**
 * Weekly Rollup - Stubbed for Migration
 */
export function startWeeklyRollup() {
    // Run every Sunday at 23:59
    cron.schedule('59 23 * * 0', async () => {
        console.log('📊 [Weekly Rollup] Cron triggered. Logic migrated to Python Engine (Pending Implementation).');
    });

    console.log('✅ Weekly Rollup cron job registered (Stubbed)');
}
