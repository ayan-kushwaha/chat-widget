/**
 * SoundManager.ts — Low-latency synthesized audio using Web Audio API.
 * No external assets required.
 */

class SoundManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private boostOsc: OscillatorNode | null = null;
    private boostGain: GainNode | null = null;

    private noiseBuffer: AudioBuffer | null = null;

    private init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.25; 
            this.masterGain.connect(this.ctx.destination);
            this.noiseBuffer = this.createNoiseBuffer();
        } catch (e) {
            console.error('AudioContext not supported');
        }
    }

    public setVolume(value: number) {
        this.init();
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(value * 0.5, this.ctx.currentTime, 0.1);
        }
    }

    public resume() {
        this.init();
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }
    }

    private ensureContext() {
        this.resume();
    }

    private createNoiseBuffer() {
        if (!this.ctx) return null;
        // 1 second of noise is plenty for SFX
        const bufferSize = this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    /** 
     * Satisfying 'pop' sounds with 8 distinct variations based on food tier.
     * @param tier 0 (Basic Orb), 1-6 (Chaos Tiers), 7 (Negative/Loss)
     */
    playEatSound(tier: number = 0) {
        if (tier < 0) return; // Hidden unlock trigger
        this.ensureContext();
        if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

        const osc = this.ctx.createOscillator();
        const noise = this.ctx.createBufferSource();
        const noiseFilter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        // Tier-based Synthesis Params
        let type: OscillatorType = 'sine';
        let startFreq = 400;
        let endFreq = 800;
        let decay = 0.1;
        let noiseAlpha = 0.35;
        let noiseDecay = 0.05;

        switch (tier) {
            case 0: // Tiny Orb
                startFreq = 800; endFreq = 1200; decay = 0.05; noiseAlpha = 0.15; break;
            case 6: // filler
                startFreq = 600; endFreq = 900; decay = 0.07; break;
            case 5: // snacks
                startFreq = 500; endFreq = 800; decay = 0.09; break;
            case 4: // culinary
                type = 'triangle'; startFreq = 400; endFreq = 700; decay = 0.12; break;
            case 3: // medium chaos
                type = 'triangle'; startFreq = 300; endFreq = 600; decay = 0.14; break;
            case 2: // rare
                type = 'square'; startFreq = 200; endFreq = 500; decay = 0.18; break;
            case 1: // ULTIMATE
                type = 'triangle'; startFreq = 150; endFreq = 800; decay = 0.25; noiseAlpha = 0.5; break;
            case 7: // LOSS / POISON
                type = 'sawtooth'; startFreq = 500; endFreq = 100; decay = 0.35; noiseAlpha = 0.7; break;
        }

        const now = this.ctx.currentTime;
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + decay);

        // 2. Noise Layer (The 'Pop' crunch)
        noise.buffer = this.noiseBuffer;
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(3000, now);
        
        gain.gain.setValueAtTime(noiseAlpha, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + decay);

        osc.connect(gain);
        noise.connect(noiseFilter);
        noiseFilter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        noise.start(now);
        osc.stop(now + decay);
        noise.stop(now + noiseDecay);
    }

    /** More impactful 'shiver' kill sound */
    playKillSound() {
        this.ensureContext();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const noise = this.ctx.createBufferSource();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.3);

        noise.buffer = this.createNoiseBuffer();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
        filter.Q.value = 5;

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        noise.start();
        osc.stop(this.ctx.currentTime + 0.3);
        noise.stop(this.ctx.currentTime + 0.2);
    }

    /** Deep emotional glaze death sound */
    playDeathSound() {
        this.ensureContext();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 1.2);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 1.2);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 1.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.2);
    }

    private boostSource: AudioBufferSourceNode | null = null;
    private boostFilter: BiquadFilterNode | null = null;

    /** Looping whoosh sound - REMOVED as per user request (noise reduction) */
    setBoostActive(active: boolean) {
        // Disabled to keep game atmosphere clean and dark
    }

    /** Sharp 'ouch' sound for zone damage */
    playPain() {
        this.ensureContext();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    /** 3 sequential alarm beeps for zone warning */
    playAlarm() {
        this.ensureContext();
        if (!this.ctx || !this.masterGain) return;

        const now = this.ctx.currentTime;
        const ctx = this.ctx;
        const master = this.masterGain;

        [0, 0.3, 0.6].forEach((delay) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(880, now + delay); // A5

            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.2, now + delay + 0.05);
            gain.gain.linearRampToValueAtTime(0, now + delay + 0.15);

            osc.connect(gain);
            gain.connect(master);

            osc.start(now + delay);
            osc.stop(now + delay + 0.2);
        });
    }
}


export const soundManager = new SoundManager();
