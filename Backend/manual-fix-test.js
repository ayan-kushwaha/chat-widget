
const mongoose = require('mongoose');
const nodeCrypto = require('crypto');

const ENCRYPTION_KEY = 'c3a5e8f1b2c3d4e5f6a1b2c3d4e5f6a1';
const IV_LENGTH = 16;

function encrypt(text) {
    const iv = nodeCrypto.randomBytes(IV_LENGTH);
    const cipher = nodeCrypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    try {
        const textParts = text.split(':');
        if (textParts.length < 2) return text;
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

async function manualTest() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/cluaiz');
        console.log("Connected to DB");

        const { Organization } = require('./src/modules/core/organization/Organization.js');

        // Find the user from the screenshot
        const email = "aryan7122@gmail.com";
        const org = await Organization.findOne({ "users_access.email": email });
        if (!org) {
            console.log("User not found: " + email);
            process.exit(1);
        }

        const user = org.users_access.find(u => u.email === email);
        console.log(`\nFound User: ${user.email}`);
        console.log(`Current Stored Pass: ${user.password_hash}`);

        const newPlainPass = "AryanPower123!";
        console.log(`\nFORCING UPDATE to: "${newPlainPass}" using AES...`);

        const newEncrypted = encrypt(newPlainPass);
        user.password_hash = newEncrypted;

        // Critical Persistence Fix
        org.markModified('users_access');
        await org.save();
        console.log("Save successful!");

        // Read Back
        const refreshedOrg = await Organization.findById(org._id);
        const refreshedUser = refreshedOrg.users_access.find(u => u.email === email);
        console.log(`\nRead back from DB: ${refreshedUser.password_hash}`);

        const finalDecrypted = decrypt(refreshedUser.password_hash);
        console.log(`Final Decrypted: "${finalDecrypted}"`);

        if (finalDecrypted === newPlainPass) {
            console.log("\n✅ SUCCESS: Database persistency and AES round-trip verified!");
            console.log("Now go to the UI, refresh the page, and you will see 'AryanPower123!' when you click the eye.");
        } else {
            console.log("\n❌ FAILURE: Something went wrong.");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Test Error:", err);
    }
}

manualTest();
