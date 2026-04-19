
import mongoose from 'mongoose';
import * as nodeCrypto from 'crypto';

// Minimal Schema for Testing
const OrgSchema = new mongoose.Schema({
    users_access: [{
        email: String,
        password_hash: String,
        secondaryEmail: {
            email: String,
            password_hash: String
        }
    }]
});
const Organization = mongoose.model('Organization', OrgSchema);

const ENCRYPTION_KEY = 'c3a5e8f1b2c3d4e5f6a1b2c3d4e5f6a1';
const IV_LENGTH = 16;

function decrypt(text) {
    if (!text) return "";
    try {
        const textParts = text.split(':');
        if (textParts.length < 2) return text; // Not AES
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = nodeCrypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        return text;
    }
}

async function verifyDB() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/cluaiz');
        console.log("✅ CONNECTED TO MONGODB");

        const orgs = await Organization.find({});
        console.log(`\nFound ${orgs.length} organizations.`);

        orgs.forEach(org => {
            console.log(`\n--- Org ID: ${org._id} ---`);
            org.users_access.forEach(user => {
                console.log(`User: ${user.email}`);

                // Check Primary
                const pHash = user.password_hash || "NONE";
                const pDecrypted = decrypt(pHash);
                const pIsAES = pHash.includes(':');
                console.log(`  Primary:   [${pIsAES ? "AES - OK" : "BCRYPT - OLD"}]`);
                console.log(`  Stored:    ${pHash.substring(0, 20)}...`);
                console.log(`  Decrypted: ${pDecrypted}`);

                // Check Secondary
                if (user.secondaryEmail && user.secondaryEmail.email) {
                    const sHash = user.secondaryEmail.password_hash || "NONE";
                    const sDecrypted = decrypt(sHash);
                    const sIsAES = sHash.includes(':');
                    console.log(`  Secondary: [${sIsAES ? "AES - OK" : "BCRYPT - OLD"}] (${user.secondaryEmail.email})`);
                    console.log(`  Stored:    ${sHash.substring(0, 20)}...`);
                    console.log(`  Decrypted: ${sDecrypted}`);
                }
            });
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    }
}

verifyDB();
