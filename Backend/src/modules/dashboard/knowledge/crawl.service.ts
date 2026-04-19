import axios from "axios";
import { usageService } from "../../../services/usage.service.js";
import { ActivityType } from "../../../models/ActivityLog.js";

// AI Engine URL Getter (Dynamic to ensure dotenv loads)
const getAiEngineUrl = () => process.env.AI_ENGINE_URL || 'http://127.0.0.1:5000';


export type CrawlFrequency = "1d" | "3d" | "7d" | "14d" | "1m" | "onetime" | "manual";

type CrawlOptions = {
  orgId: string;
  siteId?: string;
  urls: string[];
  recursive?: boolean; // 🔥 Added to suppress auto-crawling if user provided explicit map
  reportProgress?: (c: number, t: number, u: string) => void;
  onPageFound?: (url: string, title: string, text: string, raw_storage_url?: string, token_count?: number, ui_elements?: any[]) => Promise<void>;
  log?: (message: string) => Promise<void>;
  allowUI_Actions?: boolean;
};

export const discoverSitemap = async (url: string): Promise<string[]> => {
  console.log(`🗺️ [Node.js] Discovering sitemap/links for ${url} via AI Engine`);
  try {
    const response = await axios.post(`${getAiEngineUrl()}/api/v1/knowledge/discover`, {
      url: url,
      org_id: "system" // Context agnostic for discovery
    });

    if (response.data && response.data.urls) {
      console.log(`✅ [Node.js] AI Engine Discovered ${response.data.urls.length} links`);
      return response.data.urls;
    }
    return [url];
  } catch (error: any) {
    console.error(`❌ [Node.js] Discovery Failed:`, error.message);
    return [url]; // Fallback to single URL
  }
};

export const crawlSite = async (opts: CrawlOptions) => {
  const { urls, reportProgress, onPageFound } = opts;
  const totalPages = urls.length;
  let crawledCount = 0;

  console.log(`🕷️ [Node.js] Starting AI Engine Crawl for ${urls.length} URLs (Recursive: ${opts.recursive !== false})`);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    try {
      const response = await axios.post(`${getAiEngineUrl()}/api/v1/knowledge/crawl`, {
        url: url,
        org_id: opts.orgId,
        allowUI_Actions: opts.allowUI_Actions // 🎯 Skill 13: Extract DOM elements
      });

        if (response.data && response.data.content) {
          const { title, content, links, raw_storage_url, token_count, ui_elements, resource_metrics } = response.data;
          console.log(`✅ [Node.js] AI Engine returned content for ${url} (${content.length} chars, ${token_count} tokens) | UI Elements: ${(ui_elements || []).length}`);

          // 💰 Track Usage (Crawl is a resource-intensive background task)
          await usageService.trackActivity(
            opts.orgId,
            ActivityType.BRAIN_CRAWL,
            token_count || 0,
            { resource_metrics, url },
            `Crawled page: ${url}`
          );

          if (onPageFound) {
            await onPageFound(url, title, content, raw_storage_url, token_count || 0, ui_elements || []);
          }
        crawledCount++;

        // Auto-crawl discovered pages
        if (opts.recursive !== false && links && links.length > 0 && opts.siteId) {
          console.log(`🔗 Discovered ${links.length} links, enqueuing for crawl...`);

          const { crawlQueue } = await import('../../../jobs/queues.js');
          const { Site } = await import('./models/Site.js');

          const site = await Site.findById(opts.siteId);
          const existingUrls = new Set(site?.pages?.map((p: any) => p.url) || []);

          for (const discoveredUrl of links) {
            if (!existingUrls.has(discoveredUrl)) {
              await Site.updateOne(
                { _id: opts.siteId, 'pages.url': { $ne: discoveredUrl } },
                { $push: { pages: { url: discoveredUrl, status: 'pending', title: 'Pending...' } as any } }
              );

              await crawlQueue.add('crawl-page', {
                orgId: opts.orgId,
                siteId: opts.siteId,
                urls: [discoveredUrl],
                startUrl: discoveredUrl,
                recursive: true // Newly auto-discovered ones can recursively find more
              }, { removeOnComplete: true });

              console.log(`   📤 Queued: ${discoveredUrl}`);
            }
          }
        }
      }

    } catch (error: any) {
      console.error(`❌ AI Engine Crawl Failed for ${url}:`, error.message);
      if (error.response?.data) {
        const detail = JSON.stringify(error.response.data, null, 2);
        console.error(`🔍 AI Engine Error Details:`, detail);
        if (opts.log) await opts.log(`❌ AI Engine Error: ${detail}`);
      }
      if (urls.length === 1) throw error;
    }

    if (reportProgress) reportProgress(i + 1, totalPages, url);
  }

  if (crawledCount === 0 && urls.length > 0) {
    throw new Error("No pages could be crawled.");
  }

  return { pagesCrawled: crawledCount };
};