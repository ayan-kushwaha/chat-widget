import dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'bullmq';
import { redisConnection } from "@shared/libs/redis.js";
import { crawlSite } from "@modules/dashboard/knowledge/crawl.service.js";
import { connectDB } from "@shared/libs/mongo.js";
import { crawlQueue, embedQueue } from './queues.js';
import { Organization } from "@modules/core/organization/Organization.js";
import { Site } from "@modules/dashboard/knowledge/models/Site.js";

console.log('👷 [CrawlWorker] Initializing...');

connectDB();
console.log('✅ [CrawlWorker] MongoDB connection initiated');

export const crawlWorker = new Worker(
  crawlQueue.name,
  async (job) => {
    console.log(`🚀 [CrawlWorker] Started job Id: ${job.id}`);
    const { siteId, orgId, maxPages = 100, urls, recursive } = job.data;
    let startUrl = job.data.startUrl;

    // PRIORITY 1: If urls array is provided (for specific page crawl), use the first URL
    if (!startUrl && urls && urls.length > 0) {
      startUrl = urls[0];
      console.log(`📋 Using URL from urls array: ${startUrl}`);
    }

    // PRIORITY 2: If still no startUrl, try to get from site domain
    if (!startUrl) {
      if (siteId) {
        const site = await Site.findById(siteId);
        if (site) {
          startUrl = site.domain;
          console.log(`📋 Using site domain (Site Collection): ${startUrl}`);
        } else {
          console.warn(`⚠️ [CrawlWorker] Site ID ${siteId} not found in Site collection.`);
        }
      } else if (orgId) {
        // Fallback
        const site = await Site.findOne({ orgId });
        if (site) {
          startUrl = site.domain;
          console.log(`📋 Using first active site: ${startUrl}`);
        }
      }

      if (!startUrl) {
        throw new Error(`Start URL could not be determined for job ${job.id}`);
      }
    }

    // Determine targetOrgId
    let targetOrgId = orgId;
    if (!targetOrgId && siteId) {
      const site = await Site.findById(siteId);
      if (site) targetOrgId = site.orgId;
    }

    console.log(`🎯 [CrawlWorker] Job ${job.id} → Org: ${targetOrgId} → Site: ${siteId} → URL: ${startUrl}`);

    // Fetch site config for flags
    const site = siteId ? await Site.findById(siteId) : null;
    const allowUI_Actions = site?.allowUI_Actions || false;

    let embedJobCount = 0; // 🔥 Track jobs (Architectural Fix)

    try {
      const result = await crawlSite({
        orgId: targetOrgId,
        siteId, // Pass siteId
        urls: [startUrl], // Use array
        recursive: recursive, // 🔥 Pass down explicit recursion preference
        allowUI_Actions, // 🎯 Skill 13: Pass opt-in flag to crawler
        reportProgress: (c: number, t: number, u: string) => {
          const percent = Math.round((c / t) * 100);
          job.updateProgress({
            current: c,
            total: t,
            url: u,
            orgId: targetOrgId,
            siteId: siteId,
            percent,
            message: `Crawling ${u}...`
          });
        },
        log: async (msg: string) => { await job.log(msg); }, // 🔥 Connect logs (Wrapper to fix TS)
        onPageFound: async (url: string, title: string, text: string, raw_url?: string, token_count: number = 0, ui_elements: any[] = []) => {
          console.log(`🔔 [CrawlWorker] onPageFound CALLED! URL: ${url} Tokens: ${token_count} UI Elements: ${ui_elements.length}`);
          if (!siteId) {
            console.warn(`⚠️ [CrawlWorker] No siteId, skipping...`);
            return;
          }
          try {
            // 🔥 PRECISE BILLING: Use Python's exact TikToken count
            const finalTokens = token_count > 0 ? token_count : (text ? Math.ceil(text.length / 4) : 0);

            // 1. Update/Add Page to Site (Atomic)
            let pageDoc = await Site.findOne({ _id: siteId, "pages.url": url });

            if (pageDoc) {
              // Update existing page
              await Site.updateOne(
                { _id: siteId, "pages.url": url },
                {
                  $set: {
                    "pages.$.status": 'crawling',
                    "pages.$.last_crawled": new Date(),
                    "pages.$.title": title || "Untitled",
                    "pages.$.raw_url": raw_url,
                    "pages.$.token_count": finalTokens,
                    "pages.$.ui_elements": ui_elements // 🎯 SKILL 13: Save UI elements
                  }
                }
              );
            } else {
              // Atomic Push — new page
              await Site.updateOne(
                { _id: siteId, "pages.url": { $ne: url } },
                {
                  $push: {
                    pages: {
                      url,
                      title: title || "Untitled",
                      status: 'crawling',
                      last_crawled: new Date(),
                      token_count: finalTokens,
                      raw_url: raw_url,
                      ui_elements: ui_elements // 🎯 SKILL 13: Save UI elements
                    } as any
                  }
                }
              );
            }

            // 2. Enqueue Embedding Job
            console.log(`🧪 [CrawlWorker] Checking text: Length=${text ? text.length : 0}, Tokens=${finalTokens}`);
            if (text && text.length > 5) {
              console.log(`📦 [CrawlWorker] ✅ Text valid! Enqueuing embedding for: ${url}`);
              try {
                await embedQueue.add("process-document", {
                  orgId: targetOrgId,
                  siteId,
                  text,
                  url,
                  title,
                  metadata: {
                    type: 'website',
                    siteId: siteId,  // 🔥 Pass siteId for proper Intent saving
                    url: url
                  }
                }, { removeOnComplete: true });
                embedJobCount++; // 🔥 Increment Success Count
                console.log(`✅ [CrawlWorker] Embedding job enqueued successfully for ${url}`);
              } catch (queueError: any) {
                console.error(`❌ [CrawlWorker] Failed to enqueue embed job: ${queueError.message}`);
              }
            } else {
              console.warn(`⚠️ [CrawlWorker] Text too short/empty! Marking as 'ignored': ${url}`);
              await Site.updateOne(
                { "_id": siteId, "pages.url": url },
                {
                  $set: {
                    "pages.$.status": 'ignored',
                    "pages.$.error_message": "Text too short or empty"
                  }
                }
              );
            }

          } catch (err) {
            console.error("Failed to save page in CrawlWorker:", err);
          }
        }
      });

      // 🔥 SUCCESS HANDLING: Mark Site as 'embedding' (waiting for embeddings)
      if (siteId) {
        try {
          if (embedJobCount > 0) {
            await Site.updateOne({ _id: siteId }, { $set: { status: 'embedding' } });
            console.log(`✅ [CrawlWorker] Advanced Site Status to 'embedding' (${embedJobCount} jobs)`);
          } else {
            // 🔥 ARCHITECTURAL FIX: No content found? Fail the site.
            console.warn(`⚠️ [CrawlWorker] No content found to embed! Marking Site as FAILED.`);
            await Site.updateOne({ _id: siteId }, {
              $set: {
                status: 'failed',
                "pages.0.status": 'failed', // Mark first page failed if exists
                "pages.0.error_message": "No readable content found (Zero Embeds)"
              }
            });

            // CRITICAL: We MUST throw to fail the job in BullMQ
            throw new Error("Crawl finished but no valid content was found to embed.");
          }
        } catch (e: any) {
          console.error("Failed to update site status:", e);
          if (e.message.includes("No content found")) throw e;
        }
      }

      console.log(`✅ [CrawlWorker] Job ${job.id} done`);
      return { ...result, orgId: targetOrgId, siteId };

    } catch (error: any) {
      console.error(`💀 [CrawlWorker] Job ${job.id} failed:`, error.message);

      // 🔥 ERROR HANDLING: Mark Page AND Site as Failed
      if (siteId) {
        try {
          const site = await Site.findById(siteId);
          if (site) {
            site.status = 'failed';
            // Also mark specific page if known
            if (urls && urls.length === 1) {
              const page = site.pages.find((p: any) => p.url === urls[0] || p.url === startUrl);
              if (page) {
                page.status = 'failed';
                page.error_message = error.message;
              }
            }
            await site.save();
            console.log(`❌ [CrawlWorker] Marked SITE ${siteId} as FAILED.`);
          }
        } catch (dbErr) {
          console.error("Failed to update site/page status:", dbErr);
        }
      }

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
    lockDuration: 1000 * 60 * 15,
  }
);

crawlWorker.on('completed', (job) => { console.log(`🎯 [Crawl] Job ${job.id} completed`); });
crawlWorker.on('failed', (job, err) => { console.log(`💀 [Crawl] Job ${job?.id} failed — ${err.message}`); });

console.log('👷 [CrawlWorker] Initialized and listening to crawlQueue.');