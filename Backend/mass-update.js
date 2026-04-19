
const mongoose = require('mongoose');
const crypto = require('crypto');

const MONGO_URI = 'mongodb://127.0.0.1:27017/cluaiz';
const ENCRYPTION_KEY = 'c3a5e8f1b2c3d4e5f6a1b2c3d4e5f6a1';
const IV_LENGTH = 16;
const DEMO_PASSWORD = 'Aryan@Fixed';

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function updateAll() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        const orgs = await db.collection('organizations').find({}).toArray();
        const encryptedPass = encrypt(DEMO_PASSWORD);

        console.log(`\nStarting Mass Migration...`);

        for (const org of orgs) {
            const updatedUsers = org.users_access.map(user => {
                // Update primary
                user.password_hash = encryptedPass;
                // Update secondary if exists
                if (user.secondaryEmail && user.secondaryEmail.email) {
                    user.secondaryEmail.password_hash = encryptedPass;
                }
                return user;
            });

            await db.collection('organizations').updateOne(
                { _id: org._id },
                { $set: { users_access: updatedUsers } }
            );
            console.log(`✅ Updated Org: ${org.name}`);
        }

        console.log(`\n--- FINISHED ---`);
        console.log(`All accounts now have password: "${DEMO_PASSWORD}"`);
        console.log(`Go to Settings -> Click Eye Icon. It will work now!`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
updateAll();
