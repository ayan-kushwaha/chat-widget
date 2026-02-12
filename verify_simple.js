const mongoose = require('mongoose');

// Define simplified schema inline
const groupSchema = new mongoose.Schema({
    name: String,
    organizationId: mongoose.Schema.Types.ObjectId,
    members: [String],
    isArchived: Boolean
}, { strict: false });

const Group = mongoose.model('Group', groupSchema);

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/cluaiz');
        console.log('✅ Connected to MongoDB');

        const count = await Group.countDocuments();
        console.log('📊 TOTAL GROUPS:', count);

        if (count > 0) {
            const groups = await Group.find({}, 'name isArchived _id');
            console.log('📋 Groups List:', groups);
        } else {
            console.log('❌ NO GROUPS FOUND IN DATABASE');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
