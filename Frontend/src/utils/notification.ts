/**
 * Enterprise Notification Utility
 * Plays a high-fidelity vibration sound for every incoming message.
 */
import { audioManager } from './audioManager';

const VIBRATION_SOUND_PATH = '/assets/lottie/sms-vibration-notification-.mp3';

let audio: HTMLAudioElement | null = null;
let originalTitle = '';

if (typeof window !== 'undefined') {
    audio = new Audio(VIBRATION_SOUND_PATH);
    // Register with Global Manager
    audioManager.register(audio, () => {
        // No specific state to reset for notification sound
    });
}

export const playSmartNotification = () => {
    if (typeof document === 'undefined' || !audio) return;

    // 🚀 FULL VOLUME ALERT (User Requirement)
    console.log("📳 Playing 'Gui Gui' alert (Full Volume)...");

    audio.pause(); // Reset if already playing
    audio.currentTime = 0;
    audio.volume = 1.0; // Max Volume

    // Use Global Manager to play
    audioManager.play(audio);

    // 🕵️ TAB TITLE LOGIC (Still useful for multi-tab users)
    if (document.hidden) {
        if (!originalTitle) originalTitle = document.title;
        document.title = "📳 New Message!";

        const resetTitle = () => {
            if (originalTitle) document.title = originalTitle;
            originalTitle = '';
            window.removeEventListener('focus', resetTitle);
        };
        window.addEventListener('focus', resetTitle);
    }
};
