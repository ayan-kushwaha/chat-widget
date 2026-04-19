import mongoose from 'mongoose';

const legalPageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true }, // HTML Content from Tiptap

    category: {
        type: String,
        enum: ['legal', 'blog', 'help', 'docs'],
        default: 'legal'
    },

    // SEO Fields
    seo: {
        title: { type: String },
        description: { type: String },
        keywords: [{ type: String }]
    },

    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },

    // Versioning (Optional future proofing)
    version: { type: Number, default: 1 }

}, { timestamps: true });

export const LegalPage = mongoose.model('LegalPage', legalPageSchema);
