import { Request, Response } from "express";
import { AuthRequest } from "@shared/middlewares/auth";
import { Lead } from "@modules/tools/chat/Lead.js";
import { LeadForm } from "@modules/tools/chat/LeadForm.js";

// --- Forms ---

export const createForm = async (req: AuthRequest, res: Response) => {
    try {
        const { name, fields, trigger_intent, settings } = req.body;
        console.log("Create Form Request - User:", req.user);
        console.log("Create Form Request - Body:", req.body);
        const orgId = req.user?.orgId;
        console.log("Org ID:", orgId);

        if (!orgId) {
            console.error("Missing Org ID in request user");
            return res.status(400).json({ message: "Organization ID missing from token." });
        }

        const form = await LeadForm.create({
            orgId,
            name,
            fields,
            trigger_intent,
            settings
        });

        res.status(201).json(form);
    } catch (error: any) {
        console.error("Error creating form:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "A form with this name already exists." });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation Error", details: error.message });
        }
        res.status(500).json({ message: "Failed to create form", error: error.message });
    }
};

export const getForms = async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user?.orgId;
        const forms = await LeadForm.find({ orgId }).sort({ createdAt: -1 });
        res.json(forms);
    } catch (error) {
        console.error("Error fetching forms:", error);
        res.status(500).json({ message: "Failed to fetch forms" });
    }
};

export const getFormById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const orgId = req.user?.orgId;

        const form = await LeadForm.findOne({ _id: id, orgId });

        if (!form) {
            return res.status(404).json({ message: "Form not found" });
        }

        res.json(form);
    } catch (error) {
        console.error("Error fetching form:", error);
        res.status(500).json({ message: "Failed to fetch form" });
    }
};

export const updateForm = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const orgId = req.user?.orgId;

        const form = await LeadForm.findOneAndUpdate(
            { _id: id, orgId },
            updates,
            { new: true }
        );

        if (!form) {
            return res.status(404).json({ message: "Form not found" });
        }

        res.json(form);
    } catch (error) {
        console.error("Error updating form:", error);
        res.status(500).json({ message: "Failed to update form" });
    }
};

export const deleteForm = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const orgId = req.user?.orgId;

        const form = await LeadForm.findOneAndDelete({ _id: id, orgId });

        if (!form) {
            return res.status(404).json({ message: "Form not found" });
        }

        res.json({ message: "Form deleted successfully" });
    } catch (error) {
        console.error("Error deleting form:", error);
        res.status(500).json({ message: "Failed to delete form" });
    }
};

// --- Leads ---

export const getLeads = async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user?.orgId;
        const { formId, status, sort } = req.query;

        const query: any = { orgId };
        if (formId) query.formId = formId;
        if (status) query.status = status;

        const leads = await Lead.find(query)
            .populate('formId', 'name')
            .sort(sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 });

        res.json(leads);
    } catch (error) {
        console.error("Error fetching leads:", error);
        res.status(500).json({ message: "Failed to fetch leads" });
    }
};

export const submitLead = async (req: AuthRequest, res: Response) => {
    try {
        const { formId, data, chatSessionId, score, score_breakdown } = req.body;
        console.log("📥 Submit Lead Request:", { formId, dataKeys: Object.keys(data || {}), chatSessionId });

        // Priority: 1. Auth Token (Dashboard) -> 2. Request Body (Widget) -> 3. Form Lookup
        let orgId = req.user?.orgId || req.body.orgId;

        if (!orgId && formId) {
            console.log("🔍 Looking up Org ID from Form:", formId);
            const form = await LeadForm.findById(formId);
            if (form) orgId = form.orgId;
        }

        if (!orgId) {
            console.error("❌ Organization context missing for lead submission");
            return res.status(400).json({ message: "Organization context missing" });
        }

        // 1. Fetch Form to understand field mapping
        let formName = "Unknown Form";
        let fieldMapping: Record<string, string> = {}; // key -> type (e.g. "user_email" -> "email")

        if (formId) {
            const form = await LeadForm.findById(formId);
            if (form) {
                formName = form.name;
                // Map field keys to their types/labels for intelligent extraction
                form.fields.forEach(f => {
                    if (f.type === 'email' || f.label.toLowerCase().includes('email')) fieldMapping[f.key] = 'email';
                    else if (f.label.toLowerCase().includes('name')) fieldMapping[f.key] = 'name';
                    else if (f.type === 'phone' || f.label.toLowerCase().includes('phone')) fieldMapping[f.key] = 'phone';
                    else if (f.label.toLowerCase().includes('company') || f.label.toLowerCase().includes('organization')) fieldMapping[f.key] = 'company';
                });
            }
        }

        // 2. Extract Core Info
        let extractedName, extractedEmail, extractedPhone, extractedCompany;

        // Strategy A: Use Form Mapping
        for (const [key, value] of Object.entries(data || {})) {
            const mappedType = fieldMapping[key];
            if (mappedType === 'email') extractedEmail = value;
            if (mappedType === 'name') extractedName = value;
            if (mappedType === 'phone') extractedPhone = value;
            if (mappedType === 'company') extractedCompany = value;
        }

        // Strategy B: Heuristic Fallback (if form mapping failed or no form)
        if (!extractedName || !extractedEmail) {
            for (const [key, value] of Object.entries(data || {})) {
                const lowerKey = key.toLowerCase();
                if (!extractedEmail && (lowerKey.includes('email') || lowerKey === 'e-mail')) extractedEmail = value;
                if (!extractedName && (lowerKey.includes('name') || lowerKey === 'fullname' || lowerKey === 'user')) extractedName = value;
                if (!extractedPhone && (lowerKey.includes('phone') || lowerKey === 'mobile' || lowerKey === 'contact')) extractedPhone = value;
                if (!extractedCompany && (lowerKey.includes('company') || lowerKey === 'business')) extractedCompany = value;
            }
        }

        console.log("✅ Creating Lead for Org:", orgId);

        const lead = await Lead.create({
            orgId,
            formId,
            name: extractedName,
            email: extractedEmail,
            phone: extractedPhone,
            company: extractedCompany,
            data,
            chatSessionId,
            score: score !== undefined ? score : 10, // Default score if missing
            score_breakdown: score_breakdown || "Initial capture",
            source: chatSessionId ? "Chat" : "Form"
        });

        console.log("🎉 Lead Created:", lead._id);
        res.status(201).json(lead);
    } catch (error) {
        console.error("Error submitting lead:", error);
        res.status(500).json({ message: "Failed to submit lead" });
    }
};

export const updateLead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const orgId = req.user?.orgId;

        const lead = await Lead.findOneAndUpdate(
            { _id: id, orgId },
            updates,
            { new: true }
        );

        if (!lead) {
            return res.status(404).json({ message: "Lead not found" });
        }

        res.json(lead);
    } catch (error) {
        console.error("Error updating lead:", error);
        res.status(500).json({ message: "Failed to update lead" });
    }
};
