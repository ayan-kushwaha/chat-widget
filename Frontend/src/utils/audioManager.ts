/**
 * Global Audio Manager
 * Ensures only one audio source plays at a time across the entire application.
 * Supports Global Muting.
 */

type AudioCallback = () => void;

class GlobalAudioManager {
    private static instance: GlobalAudioManager;
    private currentAudio: HTMLAudioElement | null = null;
    private stopCallbacks: Map<HTMLAudioElement, AudioCallback> = new Map();
    private isMuted: boolean = false;

    private constructor() {
        // Init from storage if exists
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('cluaiz_audio_muted');
            this.isMuted = saved === 'true';
        }
    }

    public static getInstance(): GlobalAudioManager {
        if (!GlobalAudioManager.instance) {
            GlobalAudioManager.instance = new GlobalAudioManager();
        }
        return GlobalAudioManager.instance;
    }

    /**
     * Registers an audio element and a callback to be called when it should stop.
     */
    public register(audio: HTMLAudioElement, onStop: AudioCallback) {
        this.stopCallbacks.set(audio, onStop);
    }

    private isCurrentEssential: boolean = false;

    /**
     * Plays the provided audio and pauses any currently playing audio.
     */
    public play(audio: HTMLAudioElement, isEssential: boolean = false) {
        // 🔇 RESPECT MUTE (unless Essential like Bot Voice)
        if (this.isMuted && !isEssential) {
            console.log("GlobalAudioManager: Non-essential playback suppressed (Muted Mode)");
            return;
        }

        // 🛡️ INTERRUPTION LOGIC: Essential audio should NOT be stopped by non-essential
        if (this.currentAudio && this.currentAudio !== audio) {
            if (this.isCurrentEssential && !isEssential) {
                console.log("GlobalAudioManager: Non-essential request blocked. Essential audio is playing.");
                return;
            }

            this.currentAudio.pause();
            const callback = this.stopCallbacks.get(this.currentAudio);
            if (callback) callback();
        }

        // 2. Set new audio as current
        this.currentAudio = audio;
        this.isCurrentEssential = isEssential;

        // 3. Play
        audio.play().catch(err => {
            console.warn("GlobalAudioManager: Playback blocked or failed", err);
        });
    }

    /**
     * Specifically used to stop everything (e.g. on route change or widget close)
     */
    public stopAll() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            const callback = this.stopCallbacks.get(this.currentAudio);
            if (callback) callback();
            this.currentAudio = null;
        }
    }

    /**
     * Mute / Unmute Logic
     */
    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        if (typeof window !== 'undefined') {
            localStorage.setItem('cluaiz_audio_muted', String(this.isMuted));
        }

        console.log("GlobalAudioManager: Notification Mute =", this.isMuted);
        return this.isMuted;
    }

    public getMuteState(): boolean {
        return this.isMuted;
    }
}

export const audioManager = GlobalAudioManager.getInstance();
