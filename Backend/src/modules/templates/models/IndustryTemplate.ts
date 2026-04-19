import mongoose from 'mongoose';

// 1. Action Schema (What happens on click)
const ActionSchema = new mongoose.Schema({
    label: String,
    type: { type: String, enum: ['api_call', 'navigate', 'submit_form', 'link'], required: true },
    endpoint: String, // API URL or Next Step ID
    payload: mongoose.Schema.Types.Mixed // Data to send
}, { _id: false });

// 2. The Recursive UI Block Schema
// We can't define it immediately as a const because of recursion, so we add keys later or use 'add'
const UIBlockSchema = new mongoose.Schema({
    type: { type: String, required: true }, // 'container', 'text', 'image', 'carousel', 'card_product', 'chart', 'form_container', 'input_text', 'button'

    // Visuals
    variant: String, // 'vertical_stack', 'h2_bold', 'primary'
    style: { type: Map, of: String }, // { "color": "red" }

    // Content
    content: String, // For text
    url: String, // For images

    // Data (Charts, Products)
    data: mongoose.Schema.Types.Mixed,

    // Actions
    actions: [ActionSchema]

    // Children (defined below)
}, { _id: false });

// recursion for 'children' and 'items'
UIBlockSchema.add({
    children: [UIBlockSchema], // For containers
    items: [UIBlockSchema]     // For carousels
});

// 3. Workflow Schema (Trigger -> UI Layout)
const WorkflowSchema = new mongoose.Schema({
    id: String,
    name: String,
    trigger_keywords: [String],
    layout: UIBlockSchema // The Root Component to render
}, { _id: false });

// 4. Main Template Schema
const IndustryTemplateSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    category: String,

    is_public: { type: Boolean, default: false },
    author_id: String,

    persona: {
        tone: String,
        system_prompt: String,
        greeting_message: String
    },

    // Workflows Map
    workflows: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Rating System
    rating_stats: {
        average_rating: { type: Number, default: 0 },
        total_ratings: { type: Number, default: 0 },
        total_score: { type: Number, default: 0 }
    },
    raters: [{
        userId: String,
        rating: Number
    }], // Store User IDs and their rating to prevent duplicate votes and show "Your Rating"

    // Hybrid Strategy Fields
    admin_score: { type: Number, default: 9.8 }, // "Quality Score" out of 10
    install_count: { type: Number, default: 120 }, // Base installs (Social Proof)

    // Meta
    version: { type: String, default: "1.0.0" },
    features: [String], // e.g. ["Smart Scheduler", "Carousel Display"]
    use_cases: [String], // e.g. ["Gyms", "Clinics", "Salons"] - for the looping slider


    default_tags: [String],

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// ⚡ PERFORMANCE INDEXES (Production-Ready)
// Unique index for fast slug lookups
IndustryTemplateSchema.index({ slug: 1 }, { unique: true });

// Index for filtering public templates
IndustryTemplateSchema.index({ is_public: 1 });

// Index for sorting by rating (descending - highest first)
IndustryTemplateSchema.index({ 'rating_stats.average_rating': -1 });

// Index for sorting by popularity (descending - most installed first)
IndustryTemplateSchema.index({ install_count: -1 });

// Index for filtering by category
IndustryTemplateSchema.index({ category: 1 });

// Compound index for common query patterns (public + category)
IndustryTemplateSchema.index({ is_public: 1, category: 1 });

// Full-text search index on name and description
IndustryTemplateSchema.index({ name: 'text', description: 'text' });

export const IndustryTemplate = mongoose.model('IndustryTemplate', IndustryTemplateSchema);

