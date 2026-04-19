import React, { useEffect } from 'react';
import { useSkillManager } from './SkillManagerContext';
import { BrowserTTS } from '../../browser-voice/BrowserTTS';
import { LocalBrain } from '../../browser-voice/LocalBrain';

export default function TtsReaderSkill() {
    const { activeSkill, setActiveSkill } = useSkillManager();

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            // Watch for selection commands from outside iframe
            if (event.data?.type === 'CLUAIZ_READ_TEXT') {
                setActiveSkill('tts');
                const text = event.data.text;
                if (!text) return;

                // Fire Browser Web Speech Synthesis
                BrowserTTS.speak(
                    text,
                    {
                        rate: 1.0,
                        pitch: 1.0,
                        volume: 1.0
                    },
                    () => console.log('started reading selected text'),
                    () => {
                        console.log('finished reading selected text');
                        setActiveSkill(null);
                    }
                );
            }

            if (event.data?.type === 'CLUAIZ_SUMMARIZE_TEXT') {
                setActiveSkill('tts');
                const rawText = event.data.text;

                // Generate summary locally
                try {
                    const promptText = `Summarize this text in 2 short sentences: ${rawText}`;
                    const res = await LocalBrain.process(promptText);

                    BrowserTTS.speak(
                        res.reply,
                        { rate: 1.0, pitch: 1.0 },
                        () => console.log('started summarizing text'),
                        () => setActiveSkill(null)
                    );
                } catch (e) {
                    BrowserTTS.speak("I couldn't summarize that right now.", { rate: 1.0 });
                    setTimeout(() => setActiveSkill(null), 3000);
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
            if (activeSkill === 'tts') {
                BrowserTTS.stop();
            }
        };
    }, [activeSkill, setActiveSkill]);

    // Visually nothing complex, just returns null as it piggybacks on HoloCore's "reading" mapping
    return null;
}
