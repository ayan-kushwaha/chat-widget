import { connectDB } from "../modules/shared/libs/mongo.js";
import { Organization } from "../modules/core/organization/Organization.js";
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    await connectDB();
    const org = await Organization.findOne({});
    if (org) {
        console.log(`✅ Found Org ID: ${org._id}`);
    } else {
        console.log("❌ No Organization found!");
    }
    process.exit(0);
}

main();
