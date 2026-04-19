import mongoose from "mongoose";

const LeadFormSchema = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        trigger_intent: [{
            type: String,
            trim: true
        }], // Intents that trigger this form (e.g., "book_meeting", "pricing_inquiry")

        // The dynamic fields configuration
        fields: [{
            id: { type: String, required: true }, // Unique ID for the field
            key: { type: String, required: true }, // Key for JSON output (e.g., "user_email")
            label: { type: String, required: true }, // Question/Label (e.g., "What is your email?")
            type: {
                type: String,
                required: true,
                enum: [
                    'text', 'number', 'email', 'phone', 'date', 'daterange',
                    'dropdown', 'multiselect', 'radio', 'checkbox',
                    'file', 'image', 'rating', 'slider', 'tags', 'rich_text'
                ]
            },
            required: { type: Boolean, default: false },
            options: [{ type: String }], // For dropdowns, radio, etc.
            placeholder: { type: String },
            validation: {
                regex: String,
                min: Number,
                max: Number,
                message: String
            },
            ai_generated: { type: Boolean, default: false }, // If this field was suggested by AI
            trigger_logic: {
                type: String,
                enum: ['immediate', 'smart', 'event', 'after_reply'],
                default: 'smart'
            }
        }],

        settings: {
            submit_button_text: { type: String, default: "Submit" },
            success_message: { type: String, default: "Thank you! We have received your details." },
            notify_email: { type: String }, // Email to notify on submission
            theme_color: { type: String }
        },

        status: {
            type: String,
            enum: ["active", "draft", "archived"],
            default: "active",
        }
    },
    { timestamps: true }
);

// Compound index to ensure unique form names within an org (optional but good practice)
LeadFormSchema.index({ orgId: 1, name: 1 }, { unique: true });

export const LeadForm = mongoose.model("LeadForm", LeadFormSchema);
