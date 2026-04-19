/**
 * Simple Obfuscation for LocalStorage Data
 * PREVENTS: Casual editing of pricing configs by users.
 * NOT: Military-grade security (Key is client-side).
 */

const SALT_PREFIX = 'cluaiz_sec_v1_';

export const encryptStorage = (data: any): string => {
    try {
        const json = JSON.stringify(data);
        // Base64 Encode + Prefix
        return SALT_PREFIX + btoa(encodeURIComponent(json));
    } catch (e) {
        console.error("Encryption failed", e);
        return "";
    }
};

export const decryptStorage = (data: string | null): any | null => {
    if (!data) return null;
    try {
        // Validation
        if (!data.startsWith(SALT_PREFIX)) {
            // Fallback for legacy plain JSON (Migration)
            try {
                return JSON.parse(data);
            } catch {
                return null;
            }
        }

        const payload = data.replace(SALT_PREFIX, '');
        const json = decodeURIComponent(atob(payload));
        return JSON.parse(json);
    } catch (e) {
        console.error("Decryption failed", e);
        return null;
    }
};
