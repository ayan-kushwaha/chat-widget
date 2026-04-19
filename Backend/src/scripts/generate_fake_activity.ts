
import mongoose from 'mongoose';
import { ActivityLog } from '../models/ActivityLog.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const orgId = "696a00efe595a3427ba19863";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ DB Connection failed", err);
        process.exit(1);
    }
};

const generateData = async () => {
    await connectDB();

    // Clear existing for this org for a clean test
    await ActivityLog.deleteMany({ organizationId: new mongoose.Types.ObjectId(orgId) });

    const days = 30;
    const now = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // 🏯 AI MODEL BUCKET
        const aiHistory = [];
        // Add 5-10 chat events per day
        for (let j = 0; j < Math.floor(Math.random() * 5) + 5; j++) {
            aiHistory.push({
                t: Math.floor(date.getTime() / 1000) - (j * 3600),
                b: Math.floor(Math.random() * 5000) + 1000,
                d: j % 2 === 0 ? "Assistant Chat" : "Pro Brain Query"
            });
        }

        // 🏛️ INFRASTRUCTURE BUCKET
        const infraHistory = [];
        // 1. Storage Rent (Daily at midnight)
        infraHistory.push({
            t: Math.floor(date.setHours(0, 0, 0, 0) / 1000),
            b: 450, // 450MB extra * 1 token
            d: "Daily Storage Rent (450.00MB Extra)"
        });

        // 2. Random Activities (Crawls, Syncs)
        for (let j = 0; j < Math.floor(Math.random() * 3) + 2; j++) {
            infraHistory.push({
                t: Math.floor(date.getTime() / 1000) - (j * 7200),
                b: Math.floor(Math.random() * 8000) + 2000,
                d: j % 2 === 0 ? "Web Crawling" : "System Indexing"
            });
        }

        const log = new ActivityLog({
            organizationId: new mongoose.Types.ObjectId(orgId),
            date: dateStr,
            activities: {
                AI_MODEL: {
                    total: aiHistory.reduce((s, e) => s + e.b, 0),
                    count: aiHistory.length,
                    history: aiHistory
                },
                INFRASTRUCTURE: {
                    total: infraHistory.reduce((s, e) => s + e.b, 0),
                    count: infraHistory.length,
                    history: infraHistory
                }
            }
        });

        await log.save();
        console.log(`📅 Generated data for ${dateStr}`);
    }

    console.log("✅ Fake data generation complete!");
    process.exit(0);
};

generateData();
