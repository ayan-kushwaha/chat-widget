//src/models/Site.ts
import mongoose from "mongoose";

const siteSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
    name: { type: String, default: "" },
    domains: [{ type: String, required: true }],
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // 🕒 Crawl frequency (1d, 7d, 1m etc)
    crawlFrequency: {
      type: String,
      enum: ["1d", "7d", "1m"],
      default: "7d",
    },

    lastCrawled: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Site", siteSchema);
