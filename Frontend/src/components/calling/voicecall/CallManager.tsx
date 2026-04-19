"use client";
import React, { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useCallStore } from '@/store/useCallStore';
import { CallModal } from './CallModal';
import { MinimizedCallCard } from './MinimizedCallCard';
import { RemoteAudio } from './RemoteAudio';
import { useSocket } from '@/hooks/useSocket';
import { useOrg } from '@/context/OrgContext';
import { webRTCService } from '@/services/WebRTC.service';
import { toast } from 'sonner';
import { MicPermissionModal } from './MicPermissionModal';

export const CallManager = () => {
    const {
        status,
        isMinimized,
        endCall,
        isSpeakerOn,
        setStatus,
        incomingCall,
        setStreams,
        setRemoteStream,
        setLocalStream,
        localStream,
        setPermissionError,
        permissionError,
        clearPermissionError,
        callerNumber,
        remoteStream,
        setMinimized
    } = useCallStore();

    const { activeOrgId, userProfileInActiveOrg } = useOrg();
    const myName = userProfileInActiveOrg?.name || 'Cluaiz User';
    const { socket, isConnected } = useSocket(activeOrgId);

    const ringAudio = useRef<HTMLAudioElement | null>(null);
    const vibrateAudio = useRef<HTMLAudioElement | null>(null);
    const endAudio = useRef<HTMLAudioElement | null>(null);
    const peerIdRef = useRef<string | null>(null);
    const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const wakeLockRef = useRef<any>(null);
    const wasCallEndedRemotely = useRef(false);

    console.log(`🚨 CallManager RENDER - status: ${status}, isConnected: ${isConnected}`);

    // 🛑 TERMINATION SIGNALING
    // Notify peer when we end the call
    useEffect(() => {
        if (status === 'ended' && socket && isConnected) {
            // Only send end signal if we initiated the end (not if peer ended it)
            if (!wasCallEndedRemotely.current) {
                const currentTarget = peerIdRef.current || (window as any).callerId || callerNumber;
                if (currentTarget) {
                    console.log("📤 Sending call:ended to:", currentTarget);
                    socket.emit('call:ended', {
                        targetId: currentTarget,
                        orgId: activeOrgId // Fallback
                    });
                }
            } else {
                console.log("🛑 Call ended remotely, skipping echo signal.");
            }

            // Reset flags after handling
            peerIdRef.current = null;
            wasCallEndedRemotely.current = false;
        }
    }, [status, socket, isConnected, callerNumber, activeOrgId]);



    // 🔊 AUDIO LOGIC
    useEffect(() => {
        if (!ringAudio.current) {
            ringAudio.current = new Audio('/assets/lottie/call-ringing.mp3');
            ringAudio.current.loop = true;
        }
        if (!vibrateAudio.current) {
            vibrateAudio.current = new Audio('/assets/lottie/cell-phone-vibrate-high.mp3');
            vibrateAudio.current.loop = true;
        }
        if (!endAudio.current) {
            endAudio.current = new Audio('/assets/lottie/end-call.mp3');
        }

        const ring = ringAudio.current;
        const vibrate = vibrateAudio.current;
        const end = endAudio.current;

        // Logic to determining what should be playing
        const shouldPlayRing = (status === 'ringing' || status === 'calling');

        if (shouldPlayRing) {
            if (!isSpeakerOn) {
                // Vibrate mode
                ring.pause();
                ring.currentTime = 0;
                if (vibrate.paused) vibrate.play().catch(() => { });
            } else {
                // Ring mode
                vibrate.pause();
                vibrate.currentTime = 0;
                if (ring.paused) {
                    ring.play().catch(() => {
                        // Handle Autoplay policy
                        const onClick = () => {
                            if (useCallStore.getState().status === 'ringing') ring.play().catch(() => { });
                            window.removeEventListener('click', onClick);
                        };
                        window.addEventListener('click', onClick);
                    });
                }
            }
        } else {
            // Stop everything if not ringing/calling
            ring.pause();
            ring.currentTime = 0;
            vibrate.pause();
            vibrate.currentTime = 0;
        }

        if (status === 'ended') {
            end.play().catch(() => { });
        }

        // 120s timeout
        if (status === 'calling' || status === 'ringing') {
            callTimeoutRef.current = setTimeout(() => endCall(), 120000);
        } else if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }

        return () => {
            ring.pause();
            vibrate.pause();
        };
    }, [status, isSpeakerOn, endCall]);

    // 🛠️ Service Worker & Push Notification Registration
    useEffect(() => {
        if ('serviceWorker' in navigator && (window as any).isEmbed) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker Registered:', registration.scope);
                })
                .catch(err => {
                    console.error('❌ Service Worker Registration Failed:', err);
                });
        }
    }, []);


    // 📳 Vibration on Incoming Call (Expert Tweak)
    useEffect(() => {
        if (status === 'ringing') {
            if ('vibrate' in navigator) {
                navigator.vibrate([500, 200, 500, 200, 500]);
            }
        } else {
            if ('vibrate' in navigator) {
                navigator.vibrate(0);
            }
        }
    }, [status]);

    // 🚀 Auto-Answer / Auto-Trigger Logic (from URL or Push)
    useEffect(() => {
        const state = useCallStore.getState();

        // Scenario A: Auto-Answer an existing ring (Push Notification clicked)
        if (status === 'ringing' && state.autoAnswer) {
            console.log("🚀 Auto-Answering call via push notification gesture...");
            setStatus('connected');
            setMinimized(false); // 🔥 Ensure modal is visible
            useCallStore.setState({ autoAnswer: false }); // Consume the flag
        }

        // Scenario B: Auto-Trigger Incoming Call (Testing/Demo via URL)
        if (status === 'idle' && state.autoAnswer) {
            console.log("🚀 Auto-Triggering Mock Incoming Call via URL...");
            incomingCall("Cluaiz Support", "1234567890", "https://api.dicebear.com/7.x/avataaars/svg?seed=support");
            // Note: We don't consume the flag here immediately, let Scenario A handle the 'answer' part if needed, 
            // but usually auto_answer=1 implies "Pick up immediately" too? 
            // If user wants to just SEE the modal, they might mean "auto_trigger". 
            // Assuming "auto_answer" means "simulate incoming flow".

            // If we want it to auto-PICKUP too, we leave the flag. 
            // If we just want to SHOW the modal, we might need a separate flag or delay.
            // For now, let's just trigger the ring. Scenario A will pick it up in next render cycle if logic holds.
        }
    }, [status, setStatus, incomingCall, setMinimized]);

    // 🎤 HARDWARE MIC DETECTION (Silent UI Sync)
    useEffect(() => {
        if (!localStream) return;

        const audioTrack = localStream.getAudioTracks()[0];
        if (!audioTrack) return;

        // Monitor hardware mute state and sync with UI
        const handleTrackMute = () => {
            console.warn("🔇 CallManager: Mic track MUTED (hardware level)");
            // Silently sync UI - don't show modal/toast
            const { isMuted, toggleMute } = useCallStore.getState();
            if (!isMuted) {
                toggleMute(); // Set UI to muted state
            }
        };

        const handleTrackUnmute = () => {
            console.log("🎤 CallManager: Mic track UNMUTED (hardware level)");
            // Silently sync UI back to unmuted
            const { isMuted, toggleMute } = useCallStore.getState();
            if (isMuted) {
                toggleMute(); // Set UI back to unmuted
            }
        };

        audioTrack.addEventListener('mute', handleTrackMute);
        audioTrack.addEventListener('unmute', handleTrackUnmute);

        // Check initial state
        if (audioTrack.muted) {
            handleTrackMute();
        }

        return () => {
            audioTrack.removeEventListener('mute', handleTrackMute);
            audioTrack.removeEventListener('unmute', handleTrackUnmute);
        };
    }, [localStream]);

    // 📡 SIGNALING & WebRTC INTEGRATION
    useEffect(() => {
        if (!socket || !isConnected) return;

        // 🔔 Register for Background Push Notifications
        const registerPush = async () => {
            const { registerPushNotifications } = await import('@/services/push.service');
            // For agents/orgs
            if (activeOrgId) registerPushNotifications(activeOrgId);
        };
        registerPush();

        // 1. Listen for Incoming Call
        socket.on('call:offer', async (data: { offer: any; fromName: string; fromNumber: string; fromImage: string; callerId?: string; orgId: string }) => {
            // 🛡️ Guard: Ignore if already in a call session
            const currentStatus = useCallStore.getState().status;
            if (currentStatus !== 'idle' && currentStatus !== 'ended') {
                console.log("🚫 Signaling: Ignoring offer, already busy in state:", currentStatus);
                return;
            }

            // 🛡️ Guard: Ignore self calls
            if (data.fromNumber === socket.id) {
                console.log("🚫 Signaling: Ignoring self-offer");
                return;
            }

            console.log("📞 Signaling: Received Call Offer from", data.fromName, "ID:", data.fromNumber);
            peerIdRef.current = data.fromNumber; // Store peer ID
            incomingCall(data.fromName, data.fromNumber, data.fromImage);

            (window as any).pendingOffer = data.offer;
            (window as any).callerId = data.fromNumber;
        });

        // 2. Listen for Answer (If we started the call)
        socket.on('call:answer', async (data: { answer: any; fromName?: string; fromNumber: string }) => {
            const currentStatus = useCallStore.getState().status;
            if (currentStatus !== 'calling' && currentStatus !== 'ringing') {
                console.log("🚫 Signaling: Ignoring answer, currently in status:", currentStatus);
                return;
            }

            // 🛡️ Guard: Check if description already set (Prevents InvalidStateError)
            if (webRTCService.getPeerConnection()?.signalingState === 'stable') {
                console.log("🚫 Signaling: Peer connection already stable, ignoring duplicate answer.");
                return;
            }

            console.log("✅ Signaling: Received Call Answer from", data.fromNumber);

            // 🚨 CRITICAL FIX: Ensure we lock onto the Responder's ID (Socket ID)
            // Even if we started calling an "Org ID", the Answer comes from a specific "Socket ID".
            // We must update our target to this specific socket for ICE/Media to work.
            peerIdRef.current = data.fromNumber;
            (window as any).callerId = data.fromNumber; // Sync global fallback

            try {
                await webRTCService.handleAnswer(data.answer);
                console.log("🎯 Signaling: Remote description set, transitioning to connected");

                // 🔊 Ensure streams are active
                setStatus('connected'); // Transition to connected state
            } catch (err) {
                console.error("❌ Signaling: Failed to handle answer", err);
            }
        });

        // 3. Listen for ICE Candidate
        socket.on('call:ice-candidate', async (data: { candidate: any; fromNumber: string }) => {
            // console.log("❄️ Signaling: Received ICE Candidate from", data.fromNumber);
            await webRTCService.addIceCandidate(data.candidate);
        });

        // 4. Listen for Call End
        socket.on('call:ended', () => {
            console.log("🛑 Signaling: Call ended by peer");
            wasCallEndedRemotely.current = true; // Mark as remote end
            endCall();
            peerIdRef.current = null; // Clear peer ID
        });

        // 5. TAB SYNC: Listen if call was answered on another device/tab
        socket.on('call:answered_elsewhere', () => {
            const currentState = useCallStore.getState().status;
            if (currentState === 'ringing') {
                console.log("🚪 Signaling: Call answered elsewhere, closing ring...");
                setStatus('idle');
                peerIdRef.current = null; // Clear peer ID
            }
        });

        return () => {
            socket.off('call:offer');
            socket.off('call:answer');
            socket.off('call:ice-candidate');
            socket.off('call:ended');
            socket.off('call:answered_elsewhere');
        };
    }, [socket, isConnected, incomingCall, setStatus, endCall]);

    // 🧹 CLEANUP LOGIC
    useEffect(() => {
        if (status === 'idle' || status === 'ended') {
            console.log("🧹 WebRTC: Cleaning up session - status:", status);
            webRTCService.cleanup();
            (window as any).pendingOffer = null;
            (window as any).callerId = null;
            peerIdRef.current = null; // Ensure peer ID is cleared
        }
    }, [status]);


    // 🔧 WebRTC HANDLERS (Accepting/Starting)
    useEffect(() => {
        if (!socket || !isConnected) return;

        // A. Handle CALLER Side (Starting a call)
        if (status === 'calling') {
            const initiateCall = async () => {
                console.log("📟 Signaling: Initiating Call to:", callerNumber);
                peerIdRef.current = callerNumber;

                // Try to get mic (non-blocking)
                const localStream = await webRTCService.startLocalStream();
                if (localStream) {
                    setLocalStream(localStream);
                    console.log("✅ Mic available - call with audio");
                } else {
                    console.log("⚠️ Mic unavailable - call will be muted");
                    // Set UI to muted state using store method
                    const currentState = useCallStore.getState();
                    if (!currentState.isMuted) {
                        useCallStore.getState().toggleMute();
                    }
                }

                const offer = await webRTCService.createOffer(callerNumber);
                socket.emit('call:offer', {
                    offer,
                    fromName: myName,
                    fromNumber: socket.id,
                    fromImage: userProfileInActiveOrg?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${socket.id}`,
                    targetId: callerNumber,
                    orgId: activeOrgId
                });

                setRemoteStream(null);
            };
            initiateCall();
        }

        // B. Handle RECEIVER Side (Answering a call)
        if (status === 'connected' && (window as any).pendingOffer) {
            const handleConnected = async () => {
                const peerId = peerIdRef.current || (window as any).callerId;
                console.log("🤝 Signaling: Answering Call to peer:", peerId);

                // Try to get mic (non-blocking)
                const localStream = await webRTCService.startLocalStream();
                if (localStream) {
                    setLocalStream(localStream);
                    console.log("✅ Answering with mic");
                } else {
                    console.log("⚠️ Answering without mic - will be muted");
                    const currentState = useCallStore.getState();
                    if (!currentState.isMuted) {
                        useCallStore.getState().toggleMute();
                    }
                }

                const answer = await webRTCService.handleOffer((window as any).pendingOffer, peerId);

                socket?.emit('call:answer', {
                    answer,
                    fromNumber: socket.id,
                    targetId: peerId,
                    orgId: activeOrgId
                });

                // 🚪 Notify other tabs
                socket?.emit('call:answered_elsewhere', {
                    orgId: activeOrgId,
                    socketId: socket.id
                });

                setRemoteStream(null);
                (window as any).pendingOffer = null;
            };
            handleConnected();
        }

        webRTCService.onRemoteStream((stream) => {
            console.log("🎯 Received Remote Stream:", stream.id);
            setRemoteStream(stream);
        });

        // Signaling Callback (ICE Candidates)
        webRTCService.onSignaling((msg) => {
            if (socket) {
                const targetId = peerIdRef.current || (window as any).callerId || callerNumber;
                console.log("❄️ Signaling: Sending ICE Candidate to:", targetId, "via org:", activeOrgId);
                socket.emit('call:ice-candidate', {
                    candidate: msg.payload,
                    fromNumber: socket.id,
                    targetId,
                    orgId: activeOrgId
                });
            }
        });

        return () => {
            // No cleanup here as we handle it in a dedicated useEffect above
        };
    }, [status, socket, isConnected, setStreams, setPermissionError, callerNumber]);

    // 📱 WAKE LOCK API
    // 📱 WAKE LOCK API
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && status === 'connected') {
                await requestWakeLock();
            }
        };

        const requestWakeLock = async () => {
            if ('wakeLock' in navigator && status === 'connected') {
                try {
                    // Only request if visible to avoid NotAllowedError
                    if (document.visibilityState !== 'visible') return;

                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                    console.log("🔆 Wake Lock Active");

                    // Re-acquire if lock is released explicitly by system (not by us)
                    if (wakeLockRef.current) {
                        wakeLockRef.current.addEventListener('release', () => {
                            console.log('Wake Lock was released');
                        });
                    }
                } catch (err) {
                    // Ignore NotAllowedError as it means document is hidden or user blocked it
                    if ((err as Error).name !== 'NotAllowedError') {
                        console.error("Wake Lock failed:", err);
                    }
                }
            }
        };

        if (status === 'connected') {
            requestWakeLock();
            document.addEventListener('visibilitychange', handleVisibilityChange);
        } else {
            if (wakeLockRef.current) {
                wakeLockRef.current.release().then(() => {
                    wakeLockRef.current = null;
                    console.log("🌙 Wake Lock Released");
                });
            }
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLockRef.current) wakeLockRef.current.release();
        };
    }, [status]);

    return (
        <>
            <AnimatePresence mode="wait">
                {/* Single Unified Modal for All States */}
                {(status === 'ringing' || status === 'connected' || status === 'calling' || status === 'ended') && !isMinimized && (
                    <CallModal key={`call-modal-${status}-${permissionError ? 'err' : 'ok'}`} />
                )}
                {isMinimized && status !== 'idle' && status !== 'ended' && (
                    <div key="minimized-wrapper" className="fixed top-2 left-1/2 -translate-x-1/2 z-[999999]">
                        <MinimizedCallCard />
                    </div>
                )}
            </AnimatePresence>

            {/* 🔊 Persistent Audio Layer - Moved OUTSIDE AnimatePresence to prevent unmounting during transitions */}
            {status === 'connected' && remoteStream && (
                <RemoteAudio stream={remoteStream} isSpeakerOn={isSpeakerOn} />
            )}

            {/* 🎤 Google Meet-Style Permission Modal */}
            <MicPermissionModal />
        </>
    );
};
