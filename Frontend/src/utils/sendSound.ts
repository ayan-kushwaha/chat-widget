/**
 * Send Message Sound Utility
 * Plays a "whoosh" sound when user sends a message.
 * Respects global mute state via audioManager.
 */
import { audioManager } from './audioManager';

const SEND_SOUND_PATH = '/assets/lottie/send-sms.mp3';

let audio: HTMLAudioElement | null = null;

if (typeof window !== 'undefined') {
    audio = new Audio(SEND_SOUND_PATH);
    audio.volume = 0.6; // Slightly lower than notification (less intrusive)

    // Register with Global Manager
    audioManager.register(audio, () => {
        // Reset audio if needed
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
}

/**
 * Plays the send message sound effect
 * Automatically respects mute state via audioManager
 */
export const playSendSound = () => {
    if (typeof document === 'undefined' || !audio) return;

    console.log("📤 Playing send message sound...");

    // Reset audio
    audio.pause();
    audio.currentTime = 0;

    // Use Global Manager to play (respects mute state)
    audioManager.play(audio);
};

export const playReceiveSound = () => {
    if (typeof document === 'undefined') return;

    // Re-use same sound or different one if available
    // For now, using same sound but maybe allow parallel play
    const receiveAudio = new Audio(SEND_SOUND_PATH);
    receiveAudio.volume = 0.6;
    audioManager.play(receiveAudio);
}
