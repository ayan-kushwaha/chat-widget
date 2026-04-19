/**
 * WhatsApp Parser: Converts "Pipe Protocol" (CMD:BTN|...) into WhatsApp API Format.
 * Saves 60-70% tokens by avoiding JSON generation from AI.
 */

export interface WhatsAppMessage {
    type: 'text' | 'button' | 'list' | 'poll';
    body?: string;
    options?: string[]; // Simplified for internal use
    apiPayload: any; // The actual JSON to send to Meta/Twilio
}

export function parsePipeCommands(aiText: string, toPhone: string): WhatsAppMessage {
    // 1. Check if it's a Command
    if (aiText.startsWith("CMD:")) {
        const parts = aiText.split("|");
        const cmdType = parts[0].replace("CMD:", "").trim().toUpperCase();

        // --- BUTTONS ---
        if (cmdType === "BTN") {
            const bodyText = parts[1] || "Select an option";
            const optionsRaw = parts[2] || "";
            const options = optionsRaw.split(",").map(o => o.trim()).filter(o => o);

            // Construct Meta API Payload for Interactive Button
            const apiPayload = {
                messaging_product: "whatsapp",
                to: toPhone,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: { text: bodyText },
                    action: {
                        buttons: options.map(opt => ({
                            type: "reply",
                            reply: {
                                id: opt.toLowerCase().replace(/ /g, "_"),
                                title: opt.substring(0, 20) // WhatsApp limit
                            }
                        }))
                    }
                }
            };

            return { type: 'button', body: bodyText, options, apiPayload };
        }

        // --- LISTS ---
        if (cmdType === "LIST") {
            const title = parts[1] || "Menu";
            const bodyText = parts[2] || "Select an option";
            const optionsRaw = parts[3] || "";
            const options = optionsRaw.split(",").map(o => o.trim());

            const apiPayload = {
                messaging_product: "whatsapp",
                to: toPhone,
                type: "interactive",
                interactive: {
                    type: "list",
                    header: { type: "text", text: title },
                    body: { text: bodyText },
                    footer: { text: "Cluaiz AI" },
                    action: {
                        button: "Open Menu",
                        sections: [
                            {
                                title: "Options",
                                rows: options.map(opt => ({
                                    id: opt.toLowerCase().replace(/ /g, "_"),
                                    title: opt.substring(0, 24)
                                }))
                            }
                        ]
                    }
                }
            };

            return { type: 'list', body: bodyText, options, apiPayload };
        }
    }

    // --- DEFAULT TEXT ---
    return {
        type: 'text',
        body: aiText,
        apiPayload: {
            messaging_product: "whatsapp",
            to: toPhone,
            text: { body: aiText }
        }
    };
}
