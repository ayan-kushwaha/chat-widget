import { Lead } from "@modules/tools/chat/Lead.js";
import { Organization } from "@modules/core/organization/Organization.js";

/**
 * Service to handle Lead Generation logic.
 * Keeps chat.service.ts clean by isolating lead-related operations.
 */
export const LeadService = {
    /**
     * Check if the current session has missing required fields based on the Org's schema.
     */
    async checkMissingFields(orgId: string, currentData: any): Promise<any[]> {
        const org = await Organization.findById(orgId).select("lead_schemas") as any;
        if (!org || !org.lead_schemas) return [];

        const missing = org.lead_schemas.filter((field: any) => {
            // If field is required and not present in currentData
            return field.required && !currentData[field.key];
        });

        return missing;
    },

    /**
     * Generates a prompt to extract lead info based on schema.
     */
    buildExtractionPrompt(schema: any[], history: any[], lastUserMessage: string): string {
        const fields = schema.map((f: any) => `${f.key} (${f.type}) - ${f.question}`).join("\n");

        return `
        ### DATA EXTRACTION TASK ###
        Your goal is to extract structured data from the conversation based on the following schema:
        ${fields}

        ### CONVERSATION ###
        ${history.map((m: any) => `${m.role}: ${m.content}`).join("\n")}
        User: ${lastUserMessage}

        ### INSTRUCTIONS ###
        1. Analyze the user's input and history.
        2. Extract values for the schema fields ONLY if explicitly mentioned.
        3. Return a valid JSON object.
        4. If a field is missing, do NOT invent it. Omit it or set to null.
        5. Output ONLY JSON. No markdown, no explanations.
        `;
    },

    /**
     * Save or Update a Lead based on extracted data.
     */
    async saveLead(orgId: string, data: any, sessionId?: string) {
        try {
            if (!data || Object.keys(data).length === 0) return null;

            // Try to find existing lead for this session
            let lead;
            if (sessionId) {
                lead = await Lead.findOne({ chatSessionId: sessionId });
            }

            if (lead) {
                // Merge new data with existing data
                lead.data = { ...lead.data, ...data };
                lead.markModified("data");
                await lead.save();
                return lead;
            } else {
                // Create new lead
                const newLead = await Lead.create({
                    orgId,
                    data,
                    chatSessionId: sessionId,
                    source: "Chat",
                    ai_confidence: 0.8,
                });
                return newLead;
            }
        } catch (error) {
            console.error("Error saving lead:", error);
            return null;
        }
    }
};
