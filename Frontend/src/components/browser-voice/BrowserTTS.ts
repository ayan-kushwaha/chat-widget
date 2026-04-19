// src/components/browser-voice/BrowserTTS.ts
// Handles strictly Native Browser Text-to-Speech (`window.speechSynthesis`)
// Updated to suggest Cloud Fallback for unsupported languages.

import { detectLanguageFromText } from './UniversalVoiceRegistry';

export interface TTSConfig {
    pitch?: number;
    rate?: number;
    volume?: number;
    gender?: 'male' | 'female';
    preferOnline?: boolean;
}

// High-quality Edge TTS Voice Mapping (Premium Neural Voices)
const CLOUD_VOICE_MAP: Record<string, string> = {
    'af-ZA': 'af-ZA-AdriNeural',
    'am-ET': 'am-ET-MekdesNeural',
    'ar-EG': 'ar-EG-SalmaNeural',
    'ar-SA': 'ar-SA-ZariyahNeural',
    'az-AZ': 'az-AZ-BanuNeural',
    'bg-BG': 'bg-BG-KalinaNeural',
    'bn-BD': 'bn-BD-NabanitaNeural',
    'bn-IN': 'bn-IN-TanishaaNeural',
    'ca-ES': 'ca-ES-JoanaNeural',
    'cs-CZ': 'cs-CZ-VlastaNeural',
    'cy-GB': 'cy-GB-NiaNeural',
    'da-DK': 'da-DK-ChristelNeural',
    'de-DE': 'de-DE-KatjaNeural',
    'el-GR': 'el-GR-AthinaNeural',
    'en-GB': 'en-GB-SoniaNeural',
    'en-US': 'en-US-AriaNeural',
    'en-IN': 'en-IN-NeerjaNeural',
    'es-ES': 'es-ES-ElviraNeural',
    'es-MX': 'es-MX-DaliaNeural',
    'et-EE': 'et-EE-AnuNeural',
    'fa-IR': 'fa-IR-DilaraNeural',
    'fi-FI': 'fi-FI-SelmaNeural',
    'fil-PH': 'fil-PH-BlessicaNeural',
    'fr-FR': 'fr-FR-DeniseNeural',
    'fr-CA': 'fr-CA-SylvieNeural',
    'gu-IN': 'gu-IN-DhwaniNeural',
    'he-IL': 'he-IL-HilaNeural',
    'hi-IN': 'hi-IN-SwaraNeural',
    'hr-HR': 'hr-HR-GabrijelaNeural',
    'hu-HU': 'hu-HU-NoemiNeural',
    'hy-AM': 'hy-AM-AnahitNeural',
    'id-ID': 'id-ID-GadisNeural',
    'is-IS': 'is-IS-GudrunNeural',
    'it-IT': 'it-IT-ElsaNeural',
    'ja-JP': 'ja-JP-NanamiNeural',
    'jv-ID': 'jv-ID-SitiNeural',
    'ka-GE': 'ka-GE-EkaNeural',
    'kk-KZ': 'kk-KZ-AigulNeural',
    'km-KH': 'km-KH-SreymomNeural',
    'kn-IN': 'kn-IN-SapnaNeural',
    'ko-KR': 'ko-KR-SunHiNeural',
    'lo-LA': 'lo-LA-KeomanyNeural',
    'lt-LT': 'lt-LT-OnaNeural',
    'lv-LV': 'lv-LV-EveritaNeural',
    'mk-MK': 'mk-MK-MarijaNeural',
    'ml-IN': 'ml-IN-SobhanaNeural',
    'mn-MN': 'mn-MN-YesuiNeural',
    'mr-IN': 'mr-IN-AarohiNeural',
    'ms-MY': 'ms-MY-YasminNeural',
    'my-MM': 'my-MM-NilarNeural',
    'ne-NP': 'ne-NP-HemkalaNeural',
    'nl-NL': 'nl-NL-ColetteNeural',
    'nb-NO': 'nb-NO-PernilleNeural',
    'pa-IN': 'pa-IN-OjasNeural',
    'pl-PL': 'pl-PL-ZofiaNeural',
    'pt-BR': 'pt-BR-FranciscaNeural',
    'pt-PT': 'pt-PT-RaquelNeural',
    'ro-RO': 'ro-RO-AlinaNeural',
    'ru-RU': 'ru-RU-SvetlanaNeural',
    'si-LK': 'si-LK-ThiliniNeural',
    'sk-SK': 'sk-SK-ViktoriaNeural',
    'sl-SI': 'sl-SI-PetraNeural',
    'sq-AL': 'sq-AL-AnilaNeural',
    'sr-RS': 'sr-RS-SophieNeural',
    'su-ID': 'su-ID-TutiNeural',
    'sv-SE': 'sv-SE-SofieNeural',
    'sw-KE': 'sw-KE-ZuriNeural',
    'ta-IN': 'ta-IN-PallaviNeural',
    'te-IN': 'te-IN-ShrutiNeural',
    'th-TH': 'th-TH-PremwadeeNeural',
    'tr-TR': 'tr-TR-EmelNeural',
    'uk-UA': 'uk-UA-PolinaNeural',
    'ur-PK': 'ur-PK-UzmaNeural',
    'ur-IN': 'ur-IN-GulNeural',
    'uz-UZ': 'uz-UZ-MadinaNeural',
    'vi-VN': 'vi-VN-HoaiMyNeural',
    'zh-CN': 'zh-CN-XiaoxiaoNeural',
    'zh-HK': 'zh-HK-HiuGaaiNeural',
    'zh-TW': 'zh-TW-HsiaoChenNeural',
    'zu-ZA': 'zu-ZA-ThandoNeural',

    // --- Expanded Registry for Voice Lab ---
    'as-IN': 'en-IN-NeerjaNeural', // Fallback for Assamese to English-India
    'be-BY': 'ru-RU-SvetlanaNeural', // Fallback for Belarusian to Russian
    'bs-BA': 'sr-RS-SophieNeural', // Fallback for Bosnian to Serbian
    'ga-IE': 'en-GB-SoniaNeural', // Fallback for Irish to UK English
    'gl-ES': 'es-ES-ElviraNeural', // Fallback for Galician to Spanish
    'mt-MT': 'en-GB-SoniaNeural', // Fallback for Maltese to UK English
    'ps-AF': 'ar-SA-ZariyahNeural', // Fallback for Pashto to Arabic
    'so-SO': 'en-GB-SoniaNeural', // Fallback for Somali to UK English
    'sw-TZ': 'en-GB-SoniaNeural', // Fallback for Swahili to UK English

    // --- Base Language Fallbacks ---
    'ar': 'ar-SA-ZariyahNeural',
    'en': 'en-US-AriaNeural',
    'hi': 'hi-IN-SwaraNeural',
    'es': 'es-ES-ElviraNeural',
    'fr': 'fr-FR-DeniseNeural',
    'pt': 'pt-BR-FranciscaNeural',
    'ur': 'ur-PK-UzmaNeural',
    'bn': 'bn-IN-TanishaaNeural',
    'ru': 'ru-RU-SvetlanaNeural',
    'zh': 'zh-CN-XiaoxiaoNeural',
    'pa': 'pa-IN-OjasNeural',
    'gu': 'gu-IN-DhwaniNeural',
    'ta': 'ta-IN-PallaviNeural',
    'te': 'te-IN-ShrutiNeural',
    'kn': 'kn-IN-SapnaNeural',
    'ml': 'ml-IN-SobhanaNeural',

    // --- Special Fallbacks ---
    'ks-IN': 'ur-PK-UzmaNeural',
    'sd-IN': 'ur-PK-UzmaNeural',
    'ig-NG': 'en-GB-SoniaNeural',
    'yo-NG': 'en-GB-SoniaNeural',
    'ha-NE': 'en-GB-SoniaNeural',
    'bho-IN': 'hi-IN-SwaraNeural',
};

export class BrowserTTS {
    private static utterance: SpeechSynthesisUtterance | null = null;
    static lastUsedEngine: 'native' | 'browser-cloud' | 'cloud' = 'native';

    static getCloudVoice(lang: string): string | null {
        return CLOUD_VOICE_MAP[lang] ||
            CLOUD_VOICE_MAP[lang.split('-')[0]] ||
            null;
    }
    private static currentStartOffset: number = 0;
    private static speakTimeout: any = null;

    /**
     * Speaks the given text as a single segment.
     */
    static speak(
        text: string,
        config?: TTSConfig & { lang?: string },
        onStart?: () => void,
        onEnd?: () => void,
        onBoundary?: (charIndex: number) => void,
        startOffset: number = 0,
        onCloudFallback?: (voiceName: string) => void // 🎙️ Moved to end
    ) {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            if (onEnd) onEnd();
            return;
        }

        if (this.speakTimeout) {
            clearTimeout(this.speakTimeout);
            this.speakTimeout = null;
        }

        // 🔑 KEY FIX: Force reset and wake up the speech engine
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();
        }
        this.utterance = null;

        this.currentStartOffset = startOffset;
        const msg = new SpeechSynthesisUtterance(startOffset > 0 ? text.substring(startOffset) : text);
        this.utterance = msg;

        // Apply basic settings
        msg.pitch = config?.pitch ?? 0.8;
        msg.rate = config?.rate ?? 0.9;
        msg.volume = config?.volume ?? 1.0;

        // Force language preference
        let targetLang = config?.lang || this.detectLanguage(text);

        // Final sanity check for targetLang
        if (!targetLang || targetLang === 'en-US') {
            if (/[\u0900-\u097F]/.test(text)) targetLang = 'hi-IN';
            else if (/[\u0600-\u06FF]/.test(text)) targetLang = 'ar-SA';
        }

        msg.lang = targetLang;

        let retryCount = 0;
        const maxRetries = 3;

        const applyVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) {
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`[BrowserTTS] Voices not ready, retrying (${retryCount}/${maxRetries})...`);
                    setTimeout(applyVoice, 250);
                    return false;
                }
                return false;
            }

            // Fallback map for internal browser voices
            const fallbackMap: Record<string, string> = {
                'ur-PK': 'hi-IN', 'ur-IN': 'hi-IN',
                'ks-IN': 'hi-IN', 'sd-IN': 'hi-IN',
                'pa-IN': 'hi-IN', 'gu-IN': 'hi-IN',
                'bho-IN': 'hi-IN',
                'am-ET': 'en-US',
            };

            // Arabic dialects often only have one generic 'ar-SA' or 'ar' voice
            if (targetLang.startsWith('ar-')) {
                const dialects = ['ar-SA', 'ar-EG', 'ar-AE', 'ar-DZ', 'ar-MA'];
                dialects.forEach(d => { fallbackMap[d] = 'ar-SA'; });
            }

            const getBestFor = (lang: string) => {
                const possibilities = [lang, lang.split('-')[0], fallbackMap[lang]].filter(Boolean);

                const scored = voices.map(v => {
                    let score = 0;
                    const vLang = v.lang.toLowerCase().replace('_', '-');
                    const name = v.name.toLowerCase();

                    // Check against all candidates
                    possibilities.forEach((p, idx) => {
                        const target = p!.toLowerCase();
                        const weight = 1000 - (idx * 300); // Priority to specific (1000), then broad (700), then fallback (400)

                        if (vLang === target) score += weight;
                        else if (vLang.startsWith(target.split('-')[0])) score += (weight / 2);
                    });

                    // 🚀 DYNAMIC PRIORITY - Only give local bonus if language matches
                    const isLangMatch = vLang === targetLang.toLowerCase() || vLang.startsWith(targetLang.split('-')[0].toLowerCase());

                    if (config?.preferOnline) {
                        if (!v.localService) score += 600;
                    } else {
                        // 🏠 Default: Use Native voices first, but ONLY if they match the language
                        if (v.localService && isLangMatch) score += 1200;
                    }

                    // Score boost for exact locale match
                    if (vLang === targetLang.toLowerCase()) score += 800;
                    else if (isLangMatch) score += 200;

                    if (name.includes('natural') || name.includes('online') || name.includes('cloud') || name.includes('google')) score += 50;

                    // Gender preference
                    if (score > 100) {
                        const isFemale = /\b(female|zira|zara|heera|priya|samantha|amy|emma)\b/i.test(name);
                        const isMale = /\b(male|david|alex|ravi|stefan|prakash)\b/i.test(name);
                        if (config?.gender === 'female' && isFemale) score += 50;
                        else if (config?.gender === 'male' && isMale) score += 50;
                    }

                    return { voice: v, score };
                });

                scored.sort((a, b) => b.score - a.score);
                return scored[0];
            };

            const best = getBestFor(targetLang);
            const cloudVoice = this.getCloudVoice(targetLang);

            // 🚀 PRIORITY: 
            // 1. Browser Native/Online (Fastest)
            if (best && best.score >= 100) {
                this.lastUsedEngine = best.voice.localService ? 'native' : 'browser-cloud';
                msg.voice = best.voice;
                msg.lang = best.voice.lang;
                console.log(`[BrowserTTS] Browser Play: ${targetLang} -> ${best.voice.name} (${best.voice.lang}) [Score: ${best.score}] [Type: ${this.lastUsedEngine}]`);
                setTimeout(() => {
                    window.speechSynthesis.speak(msg);
                }, 10);
                return;
            }

            // 🚀 FALLBACK: Edge Cloud (Neural quality, but extra latency)
            if (cloudVoice && onCloudFallback) {
                console.log(`[BrowserTTS] Browser gave no match. Using Edge Fallback: ${cloudVoice}`);
                this.lastUsedEngine = 'cloud';
                onCloudFallback(cloudVoice);
                return true;
            }

            // 🏠 FINAL FALLBACK: Default engine
            this.lastUsedEngine = 'native';
            console.log(`[BrowserTTS] No specific match for ${targetLang}. Using generic browser output.`);
            setTimeout(() => {
                window.speechSynthesis.speak(msg);
            }, 10);
            return;
        };

        msg.onstart = () => onStart?.();
        msg.onboundary = (e) => {
            const charIdx = this.currentStartOffset + e.charIndex;
            onBoundary?.(charIdx);

            // 🛑 Safety Guard: If we are at the very end, ensure onEnd fires even if browser hangs
            if (charIdx >= text.length - 2) {
                if (this.speakTimeout) clearTimeout(this.speakTimeout);
                this.speakTimeout = setTimeout(() => {
                    if (this.utterance === msg) {
                        onEnd?.();
                        this.utterance = null;
                        window.speechSynthesis.cancel();
                    }
                }, 500);
            }
        };
        msg.onend = () => {
            if (this.utterance === msg) {
                // ⏱️ Small delay to ensure last boundary paints
                setTimeout(() => {
                    if (this.utterance === msg) {
                        onEnd?.();
                        this.utterance = null;
                    }
                }, 100);
            }
        };
        msg.onerror = (e) => {
            if (e.error === 'interrupted' || e.error === 'canceled') return;
            console.error("BrowserTTS Error:", e.error);
            if (this.utterance === msg) {
                onEnd?.();
                this.utterance = null;
            }
        };

        const voices = typeof window !== 'undefined' ? window.speechSynthesis.getVoices() : [];
        if (voices.length > 0) {
            applyVoice();
        } else {
            this.speakTimeout = setTimeout(() => {
                if (this.utterance === msg && typeof window !== 'undefined') {
                    applyVoice();
                }
                this.speakTimeout = null;
            }, 10);
        }
    }

    /**
     * Comprehensive language detection based on character blocks
     */
    private static detectLanguage(text: string): string {
        return detectLanguageFromText(text);
    }

    static stop() {
        if (this.speakTimeout) {
            clearTimeout(this.speakTimeout);
            this.speakTimeout = null;
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            this.utterance = null;
        }
    }

    static isSpeaking(): boolean {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            return window.speechSynthesis.speaking;
        }
        return false;
    }

    static getAvailableVoices(): SpeechSynthesisVoice[] {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
        return window.speechSynthesis.getVoices();
    }
}
