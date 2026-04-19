import { SecurityService } from "../security.service.js";

export function buildPrompt(
    query: string,
    context: string,
    history: { role: string; content: string }[] = [],
    personalityConfig: any,
    policyCore: any,
    facts: any[],
    userContext?: { url: string; title: string },
    orgName?: string,
    connectors?: any,
    availableForms: any[] = [], // NEW: List of available forms
    orgId?: string,
    ownerName: string = "Aryan", // NEW: Owner Name
    lastFormStatus?: { formId: string, formData: any, isSubmitted: boolean, formName: string } | null, // NEW: Memory
    safetySettings?: any // NEW: Security Config
): string {

    // ... (Existing Identity & Tone logic)
    const botName = personalityConfig?.name || "Cluaiz Assistant";
    const tone = personalityConfig?.tone || "Professional";
    const motivation = policyCore?.motivation || "Assist the user.";

    // 🛡️ INJECT IRON DOME PROMPT
    const securityProtocol = SecurityService.generateIronDomePrompt(safetySettings, ownerName, orgName);

    // ... (Existing Rules, Banned Words, Length logic)
    const rulesList = policyCore?.rules
        ? policyCore.rules.map((r: string, i: number) => `${i + 1}. ${r} `).join("\n")
        : "";

    const bannedInstruction = personalityConfig?.banned_words?.length > 0
        ? `CRITICAL: DO NOT use these words: ${personalityConfig.banned_words.join(", ")} `
        : "";

    const responseLength = personalityConfig?.response_length || "medium";
    let lengthInstruction = "Keep answer concise.";
    if (responseLength === 'short') lengthInstruction = "Answer in 1 sentence.";
    if (responseLength === 'detailed') lengthInstruction = "Provide detailed explanation.";

    // ... (Existing Examples, History, Business Info)
    const examples = personalityConfig?.example_training
        ? personalityConfig.example_training.slice(0, 2).map((ex: any) => `User: "${ex.user_message}"\nAI: "${ex.good_response}"`).join("\n\n")
        : "";

    // ✅ OPTIMIZED: Only send last 6 messages, truncated to 300 chars (Light Payload)
    const recentHistory = history.slice(-6);
    const historySlice = recentHistory.map((msg) => {
        const content = msg.content.length > 300 ? msg.content.substring(0, 300) + "..." : msg.content;
        return `${msg.role === "user" ? "User" : "AI"}: ${content}`;
    }).join("\n");

    const businessName = orgName || userContext?.title || "our business";
    const whatsapp = connectors?.whatsapp?.status === 'active' ? `WhatsApp: ${connectors.whatsapp.phone} ` : "";
    const email = connectors?.gmail?.status === 'active' ? `Email: ${connectors.gmail.email} ` : "";
    const contactInfo = [whatsapp, email].filter(Boolean).join("\n    ");

    // NEW: Form Instructions
    let formInstruction = "";
    if (availableForms.length > 0) {
        const formList = availableForms.map((f, index) => {
            const fields = f.fields?.map((field: any) => `${field.label} (key: ${field.key})`).join(', ') || "No specific fields";
            return `${index + 1}) ${f.name} (ID: ${f._id})\n   - Trigger: [${f.trigger_intent?.join(', ')}]\n   - Fields Needed: ${fields}`;
        }).join("\n");

        formInstruction = `
    ### ⚡ SMART FORM SELECTION (ZERO CHAT, DIRECT ACTION) ###

    You have access to these forms:
    ${formList}

    1) **Check Input for MATCHING FORM NAME**:
       - If user says "Contact Support" (or matches any form name below), YOU MUST TRIGGER FORM.
       - Output: [FORM: {"formId": "THE_MATCHING_ID", "orgId": "${orgId}"}]
       - STOP. Do not generate options.

    2) **Specific Request** ("I want to hire", "support form"):
       - IMMEDIATE ACTION: Output the [FORM] tag alone.

    3) **VAGUE ACTION REQUEST** ("connect", "help", "options", "start"):
       - Output [OPTIONS: [{"id": "FORM_ID", "label": "Form Name"}]]
       - ⚠️ CRITICAL: ONLY use forms from the list above. DO NOT invent options like "Your Interest" or "General Inquiry".

    4) **CHIT-CHAT** (e.g., "ok", "thanks", "cool", "done"):
       - DO NOT show options.
       - Reply normally (e.g., "Great!", "No problem").

    3) **FORM OUTPUT FORMAT (Single Line Only):**
       [FORM: {"form": { ... }, "formData": { ... }, "orgId": "${orgId}"}]

    4) **PREFILLING:**
       - If user says "My name is Aryan", add "name": "Aryan" to formData.
    `;

        // MEMORY INJECTION
        if (lastFormStatus) {
            if (lastFormStatus.isSubmitted) {
                formInstruction += `
             ⚠️ MEMORY ALERT: The user has ALREADY submitted the form ("${lastFormStatus.formName}").
             - If they say "edit" or "change", ask them to click "Edit" on the submitted card.
             - DO NOT show the form tag again unless they explicitly ask for a NEW form.
             - Acknowledge receipt: "We have your details."
             `;
            } else {
                formInstruction += `
             ⚠️ MEMORY ALERT: You recently showed the form ("${lastFormStatus.formName}") but it's NOT submitted yet.
             - If user says "edit", "change", "wrong detail":
             - RE-SEND the [FORM] tag for the SAME form ID.
             - PRE-FILL it with: ${JSON.stringify(lastFormStatus.formData)}
             - Update values based on user's new input.
             `;
            }
        }
    }

    // Strict Context Logic (RELAXED FOR INTELLIGENCE)
    const strictContext = context.length > 0
        ? `### KNOWLEDGE BASE (PRIORITY) ###\n${context}\n\nINSTRUCTION: Use the Knowledge Base above as your PRIMARY source. If the answer is found there, use it.`
        : `INSTRUCTION: The Knowledge Base is empty for this specific query. Use your general training to answer politely and helpfully.`;

    return `
    ### SYSTEM INSTRUCTIONS ###
    ${securityProtocol}
    ROLE: You are ${botName}, the Official AI Assistant for **${businessName}**.
    IDENTITY: You represent ${businessName}.
    OWNER/FOUNDER: ${ownerName}
    TONE: ${tone}.
    MISSION: ${motivation}

    ### STRICT GUIDELINES ###
    ${rulesList}
    ${bannedInstruction}
    ${lengthInstruction}

    ${formInstruction}

    IMPORTANT:
    - **SCOPE**: You are an intelligent assistant for ${businessName}.
    - **FALLBACK**: If the user asks something NOT in your Knowledge Base but related to the business, founder (${ownerName}), industry, or professional skills (e.g., "Who is Aryan", "What are Aryan's skills"), ANSWER IT using your general training and context as the official representative.
    - **OFF-TOPIC**: Only refuse if the question is completely unrelated (e.g., "How to make a bomb", "Write code for snake game").
    - **MEMORY**: Remember user details (name, preferences) relevant to the business context.
    - **LANGUAGE**: Reply in the SAME LANGUAGE as the user.

    ### BUSINESS CONTACT INFO ###
    ${contactInfo}

    ### SPEAKING STYLE (EMULATE THIS) ###
    ${examples}

    ${strictContext}

    ### CONVERSATION HISTORY ###
    ${historySlice}

    ### USER CONTEXT ###
    Current Page: ${userContext?.title || "Unknown"} (${userContext?.url || "Unknown"})

    ### CURRENT INPUT ###
    User: ${query}
    AI:
    `;
}
