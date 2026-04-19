// 🔐 Billing URL Encryption Utility
// Goal: Prevent manual tampering of "tokens" in the URL.
// Logic: Base64(payload) + Signature(Hash)

// Simple client-side secret (Obfuscation layer, not banking-grade encryption but enough to stop URL manual edits)
// In a real app, this signing might happen on server, but for "Pricing -> Billing" handover, this works to ensure integrity.
const SALT = "cluaiz_secure_checkout_v1_salt_#9988";

export const encodeBillingPayload = (tokens: number, planId: string): string => {
    try {
        const payload = JSON.stringify({
            t: tokens, // t = tokens
            p: planId, // p = planId
            ts: Date.now() // timestamp
        });

        // 1. Base64 Encode (URL Safe)
        const b64 = btoa(payload)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // 2. Create Signature
        const signature = simpleHash(b64 + SALT);

        return `${b64}.${signature}`;
    } catch (e) {
        console.error("Encryption failed", e);
        return "";
    }
};

export const decodeBillingPayload = (q: string | null): { tokens: number; planId: string } | null => {
    if (!q) return null;

    try {
        const [urlSafeB64, signature] = q.split('.');

        if (!urlSafeB64 || !signature) return null;

        // 1. Verify Signature (Check against raw URL string first to catch tamper of hash itself)
        const expectedSignature = simpleHash(urlSafeB64 + SALT);
        if (signature !== expectedSignature) {
            console.error("⛔ Signature Mismatch Details:", {
                receivedSig: signature,
                computedSig: expectedSignature,
                inputString: urlSafeB64,
                rawQ: q
            });
            return null;
        }

        // 2. Decode Payload (Revert URL Safe to Standard Base64)
        let b64 = urlSafeB64.replace(/-/g, '+').replace(/_/g, '/');
        // Pad with =
        while (b64.length % 4) b64 += '=';

        const json = atob(b64);
        const data = JSON.parse(json);

        return {
            tokens: data.t,
            planId: data.p
        };
    } catch (e) {
        console.error("Decryption failed", e);
        return null;
    }
};

// Simple DJB2-like hash for signature (Fast & Client-side)
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}
