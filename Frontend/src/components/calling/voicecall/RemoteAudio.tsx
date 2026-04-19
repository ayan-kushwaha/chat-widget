
import React, { useEffect, useRef } from 'react';

export const RemoteAudio = ({ stream, isSpeakerOn }: { stream: MediaStream | null; isSpeakerOn: boolean }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !stream) return;

        console.log("🔊 RemoteAudio: Attaching stream to element. ID:", stream.id, "Tracks:", stream.getTracks().length);

        // Log each track's details
        stream.getTracks().forEach(track => {
            console.log(`🔊 RemoteAudio: Track - Kind: ${track.kind}, Enabled: ${track.enabled}, ReadyState: ${track.readyState}`);
        });

        audio.srcObject = stream;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log("🔊 RemoteAudio: Playback started successfully");
                })
                .catch(error => {
                    if (error.name === 'AbortError') {
                        console.log("🔇 RemoteAudio: Play aborted (expected during stream switch)");
                    } else {
                        console.error("❌ RemoteAudio: Play failed:", error);
                    }
                });
        }

        // Monitor track state changes
        stream.getTracks().forEach(track => {
            track.onended = () => {
                console.log("✅ RemoteAudio: Track ended (call disconnected)", track.kind, track.id);
            };
            track.onmute = () => {
                console.warn("🔇 RemoteAudio: Track MUTED", track.kind);
            };
            track.onunmute = () => {
                console.log("🔊 RemoteAudio: Track UNMUTED", track.kind);
            };
        });

    }, [stream]);

    // Speaker logic: Keep audio always playing
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = false;
            audioRef.current.volume = 1.0;
        }
    }, [isSpeakerOn]);

    return (
        <audio
            ref={audioRef}
            key={stream?.id || 'no-stream'}
            autoPlay
            playsInline
            controls={false}
            onPlay={() => console.log("🔊 RemoteAudio: HTML Element reported 'playing' state")}
            style={{ display: 'none' }}
        />
    );
};
