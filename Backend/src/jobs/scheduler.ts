// src/jobs/scheduler.ts
import { crawlQueue } from "./queues.js";
import { Organization } from "@modules/core/organization/Organization.js";

function frequencyToMs(freq: string): number | null {
  const f = (freq || "").toLowerCase().trim();
  if (!f || f === "manual") return null;
  if (f === "onetime") return 0;

  // Human-readable names
  if (f === "daily") return 24 * 60 * 60 * 1000; // 1 day
  if (f === "weekly") return 7 * 24 * 60 * 60 * 1000; // 7 days
  if (f === "monthly") return 30 * 24 * 60 * 60 * 1000; // 30 days

  // Format: "1d", "3d", "7d", "14d", "1m", "3m"
  if (f.endsWith("d")) {
    const n = parseFloat(f.replace("d", ""));
    if (!isNaN(n) && n > 0) return Math.round(n * 24 * 60 * 60 * 1000);
  }
  if (f.endsWith("m")) {
    const n = parseFloat(f.replace("m", ""));
    if (!isNaN(n) && n > 0) return Math.round(n * 30 * 24 * 60 * 60 * 1000);
  }

  // Plain number (assume days)
  const n = parseFloat(f);
  if (!isNaN(n) && n > 0) return Math.round(n * 24 * 60 * 60 * 1000);

  return null;
}

export async function cancelScheduledCrawl(siteId: string) {
  const jobName = `re-crawl-${siteId}`;
  const repeatables = await crawlQueue.getRepeatableJobs();

  for (const r of repeatables) {
    if (r.name === jobName) {
      await crawlQueue.removeRepeatableByKey(r.key);
      console.log(`🗑️ Removed repeatable job ${r.key}`);
    }
  }

  const delayed = await crawlQueue.getDelayed();
  for (const j of delayed) {
    if (j.name === jobName && j.data?.siteId === siteId) {
      await crawlQueue.remove(j.id ? j.id : "");
      console.log(`🗑️ Removed delayed one-time job ${j.id}`);
    }
  }
}

export async function scheduleCrawl(
  siteId: string,
  frequency: string,
  options?: { startDelayMs?: number; payload?: Record<string, any> }
) {
  const jobName = `re-crawl-${siteId}`;
  await cancelScheduledCrawl(siteId);
  const ms = frequencyToMs(frequency);

  if (ms === null && frequency.toLowerCase() === "manual") {
    console.log(`🛑 Manual scheduling chosen for ${siteId} — no repeat job created`);
    return;
  }

  if (frequency.toLowerCase() === "onetime") {
    const delay = typeof options?.startDelayMs === "number" ? options.startDelayMs : 0;
    await crawlQueue.add(
      jobName,
      { siteId, ...(options?.payload || {}) },
      {
        delay,
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
    console.log(`⏱️ One-time crawl scheduled for ${siteId} delay=${delay}ms`);
    return;
  }

  if (typeof ms === "number" && ms > 0) {
    await crawlQueue.add(
      jobName,
      { siteId, ...(options?.payload || {}) },
      {
        repeat: { every: ms },
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
    console.log(`🔁 Scheduled recurring crawl for ${siteId} every ${ms}ms`);
    return;
  }
  console.warn(`⚠️ Frequency ${frequency} not recognized — no schedule created for ${siteId}`);
}

export async function scheduleCrawlForSiteFromDB(siteId: string) {
  const org = await Organization.findOne({ "brain.knowledge_base.websites._id": siteId });

  if (!org) {
    console.warn("Organization/Site not found for scheduling:", siteId);
    return;
  }

  // @ts-ignore
  const site = org.brain?.knowledge_base?.websites?.id(siteId);
  if (!site) {
    console.warn("Site subdocument not found:", siteId);
    return;
  }

  await scheduleCrawl(siteId, (site as any).crawl_schedule || "weekly");
}