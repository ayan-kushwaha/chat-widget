const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    emoji: {
        type: String,
        default: '👥'
    },
    members: [{
        type: String, // Storing Conversation IDs (as they map 1:1 to users in inbox)
        ref: 'Conversation'
    }],
    isSmart: {
        type: Boolean,
        default: false
    },
    criteria: {
        type: mongoose.Schema.Types.Mixed, // For future smart filters
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster lookups
groupSchema.index({ organizationId: 1 });

module.exports = mongoose.model('Group', groupSchema);
