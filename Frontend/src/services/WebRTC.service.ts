/**
 * 🧱 WebRTC Service
 * Core Singleton for P2P HD Calling
 */

export type SignalingMessage = {
    type: 'offer' | 'answer' | 'ice-candidate';
    payload: any;
    targetId: string;
    senderId: string;
};

class WebRTCService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
    private onSignalingMessage: ((msg: SignalingMessage) => void) | null = null;
    private onPermissionError: ((error: string) => void) | null = null;

    private config: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            // Add TURN servers here for restricted networks
        ]
    };

    /**
     * Start local media (Microphone)
     */
    async startLocalStream(): Promise<MediaStream | null> {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1, // Mono is better for VOIP logic
                },
                video: false
            });

            console.log("🎤 WebRTC: Local Stream started. Tracks:", this.localStream.getTracks().length);
            this.localStream.getTracks().forEach(t => {
                console.log(`🎤 Track: ${t.kind}, ID: ${t.id}, Enabled: ${t.enabled}, State: ${t.readyState}`);
            });

            return this.localStream;
        } catch (error: any) {
            console.warn("⚠️ WebRTC: Mic permission denied -", error.name);
            if (this.onPermissionError) {
                this.onPermissionError(error.name === 'NotAllowedError' ? 'PERMISSION_DENIED' : 'DEVICE_UNAVAILABLE');
            }
            return null; // Call proceeds muted
        }
    }

    /**
     * Initialize Peer Connection
     */
    private initPeerConnection(targetId: string) {
        // 🛡️ Cleanup previous PC but PRESERVE local stream tracks for the new connection
        if (this.peerConnection) this.cleanup(false);

        this.peerConnection = new RTCPeerConnection(this.config);

        // Add local tracks to the connection
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                // Ensure track is enabled
                track.enabled = true;
                this.peerConnection?.addTrack(track, this.localStream!);
            });
        }

        // Handle incoming tracks (Remote Stream)
        this.peerConnection.ontrack = (event) => {
            console.log(`🔊 WebRTC: [PRO] Remote Track Received: ${event.track.kind} ID: ${event.track.id}`);

            // 🛡️ Robust Stream Extraction: If streams[0] is missing, create a new one from the track
            let stream = event.streams[0];
            if (!stream) {
                console.log("⚠️ WebRTC: No stream in ontrack, creating one from track...");
                stream = new MediaStream([event.track]);
            }

            // Monitor track lifecycle
            event.track.onmute = () => console.log("🔇 WebRTC: Remote track MUTED");
            event.track.onunmute = () => console.log("🔊 WebRTC: Remote track UNMUTED");
            event.track.onended = () => console.error("🛑 WebRTC: Remote track ENDED");

            this.remoteStream = stream;
            if (this.onRemoteStreamCallback) {
                this.onRemoteStreamCallback(stream);
            }
        };

        // Handle ICE Candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.onSignalingMessage) {
                this.onSignalingMessage({
                    type: 'ice-candidate',
                    payload: event.candidate,
                    targetId,
                    senderId: 'current-user' // Set by caller
                });
            }
        };

        // Connection State Monitoring
        this.peerConnection.onconnectionstatechange = () => {
            console.log("📡 WebRTC Connection State:", this.peerConnection?.connectionState);
            if (this.peerConnection?.connectionState === 'failed') {
                this.handleIceRestart(targetId);
            }
        };

        // ICE Connection State (for P2P tunnel verification)
        this.peerConnection.oniceconnectionstatechange = () => {
            const state = this.peerConnection?.iceConnectionState;
            console.log("📡 WebRTC: ICE Connection State changed to:", state);
            if (state === 'connected' || state === 'completed') {
                console.log("🚀 WebRTC: P2P TUNNEL ESTABLISHED - Voice should be flowing now!");
            }
        };
    }

    /**
     * Create Offer (Caller Side)
     */
    async createOffer(targetId: string): Promise<RTCSessionDescriptionInit> {
        this.initPeerConnection(targetId);
        const offer = await this.peerConnection!.createOffer();
        await this.peerConnection!.setLocalDescription(offer);
        return offer;
    }

    /**
     * Handle Incoming Offer & Create Answer (Receiver Side)
     */
    async handleOffer(offer: RTCSessionDescriptionInit, targetId: string): Promise<RTCSessionDescriptionInit> {
        this.initPeerConnection(targetId);
        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

        // 🚀 Process candidates that arrived before offer was set
        await this.processQueuedCandidates();

        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);
        return answer;
    }

    /**
     * Handle Incoming Answer
     */
    async handleAnswer(answer: RTCSessionDescriptionInit) {
        if (!this.peerConnection) return;

        // 🛡️ Guard: Only set answer if we are expecting one
        if (this.peerConnection.signalingState !== 'have-local-offer') {
            console.warn(`⚠️ WebRTC: Ignoring answer in state: ${this.peerConnection.signalingState}`);
            return;
        }

        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            // 🚀 Process candidates that arrived before answer was set
            await this.processQueuedCandidates();
        } catch (err) {
            console.error("❌ WebRTC: handleAnswer failed", err);
            throw err;
        }
    }

    private iceCandidateQueue: RTCIceCandidateInit[] = [];

    /**
     * Handle Incoming ICE Candidate
     */
    async addIceCandidate(candidate: RTCIceCandidateInit) {
        if (!this.peerConnection) return;

        // 🛡️ Queue candidates if remote description is not yet set
        if (!this.peerConnection.remoteDescription) {
            console.log("⏳ Queueing ICE Candidate (Remote description not set)");
            this.iceCandidateQueue.push(candidate);
            return;
        }

        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error("Error adding ICE candidate", e);
        }
    }

    /**
     * Process queued ICE candidates
     */
    private async processQueuedCandidates() {
        if (!this.peerConnection || !this.peerConnection.remoteDescription) return;

        console.log(`🌀 Processing ${this.iceCandidateQueue.length} queued ICE candidates`);
        while (this.iceCandidateQueue.length > 0) {
            const candidate = this.iceCandidateQueue.shift();
            if (candidate) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => {
                    console.error("Error adding queued ICE candidate", e);
                });
            }
        }
    }

    /**
     * ICE Restart for Network Resilience
     */
    private async handleIceRestart(targetId: string) {
        console.log("♻️ WebRTC: Attempting ICE Restart...");
        if (!this.peerConnection) return;
        try {
            const offer = await this.peerConnection.createOffer({ iceRestart: true });
            await this.peerConnection.setLocalDescription(offer);
            if (this.onSignalingMessage) {
                this.onSignalingMessage({
                    type: 'offer',
                    payload: offer,
                    targetId,
                    senderId: 'current-user'
                });
            }
        } catch (e) {
            console.error("ICE Restart failed", e);
        }
    }

    /**
     * Callbacks for UI updates
     */
    onRemoteStream(callback: (stream: MediaStream) => void) {
        this.onRemoteStreamCallback = callback;
    }

    onSignaling(callback: (msg: SignalingMessage) => void) {
        this.onSignalingMessage = callback;
    }

    onError(callback: (error: string) => void) {
        this.onPermissionError = callback;
    }

    /**
     * Get underlying PeerConnection (for state checks)
     */
    getPeerConnection() {
        return this.peerConnection;
    }

    /**
     * Cleanup and Hang up
     * @param stopMedia - Whether to stop the microphone/camera (default: true)
     */
    cleanup(stopMedia = true) {
        if (stopMedia) {
            this.localStream?.getTracks().forEach(track => {
                track.stop();
                console.log("🎤 WebRTC: Microphone track stopped");
            });
            this.localStream = null;
        }

        this.peerConnection?.close();
        this.peerConnection = null;
        this.remoteStream = null;
        this.iceCandidateQueue = []; // Clear queue
    }
}

export const webRTCService = new WebRTCService();
