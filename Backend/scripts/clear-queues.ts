
import { embedQueue, crawlQueue } from "../src/jobs/queues.js";
import { redisConnection } from "../src/modules/shared/libs/redis.js";


async function clear() {
    console.log("🧹 Clearing Queues...");

    await embedQueue.obliterate({ force: true });
    console.log("✅ Embed Queue Obliterated");

    await crawlQueue.obliterate({ force: true });
    console.log("✅ Crawl Queue Obliterated");

    console.log("✨ All clear. Now restart Backend.");
    process.exit(0);
}

clear().catch(e => {
    console.error(e);
    process.exit(1);
});
