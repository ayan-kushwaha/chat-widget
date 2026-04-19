import { create } from 'zustand';
import { webRTCService } from '@/services/WebRTC.service';


export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export type CallRecordType = 'incoming' | 'outgoing';
export type CallRecordStatus = 'answered' | 'missed' | 'declined';

export interface CallRecord {
    id: string;
    type: CallRecordType;
    status: CallRecordStatus;
    callerName: string;
    callerNumber: string;
    callerImage: string;
    startTime: Date;
    endTime: Date;
    duration: number; // in seconds
}

interface CallState {
    status: CallStatus;
    isMinimized: boolean;
    isMuted: boolean;
    isSpeakerOn: boolean;
    isVideoEnabled: boolean; // Future proofing
    isRingerMuted: boolean; // Silence ringer and use vibration

    // Caller Details
    callerName: string;
    callerNumber: string;
    callerImage: string;

    // Call Tracking
    callStartTime: Date | null;
    callType: CallRecordType | null;
    callHistory: CallRecord[];

    // WebRTC Streams
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    permissionError: string | null;
    autoAnswer: boolean;

    // Actions
    setStatus: (status: CallStatus) => void;
    toggleMinimize: () => void;
    setMinimized: (isMinimized: boolean) => void;
    toggleMute: () => void;
    toggleSpeaker: () => void;
    startCall: (name: string, number: string, image: string) => void;
    endCall: () => void;
    incomingCall: (name: string, number: string, image: string) => void;
    toggleRingerMute: () => void;
    addCallRecord: (record: CallRecord) => void;
    setStreams: (local: MediaStream | null, remote: MediaStream | null) => void;
    setRemoteStream: (remote: MediaStream | null) => void;
    setLocalStream: (local: MediaStream | null) => void;
    setPermissionError: (error: string | null) => void;
    clearPermissionError: () => void;
}

export const useCallStore = create<CallState>((set) => ({
    status: 'idle',
    isMinimized: false,
    isMuted: false,
    isSpeakerOn: true, // Default ON as requested
    isVideoEnabled: false,
    isRingerMuted: false,

    callerName: '',
    callerNumber: '',
    callerImage: '',

    callStartTime: null,
    callType: null,
    callHistory: [],

    localStream: null,
    remoteStream: null,
    permissionError: null,
    autoAnswer: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('auto_answer') === '1' : false,

    setStatus: (status) => set({ status }),

    toggleMinimize: () => set((state) => ({ isMinimized: !state.isMinimized })),

    setMinimized: (isMinimized) => set({ isMinimized }),



    toggleMute: async () => {
        const state = useCallStore.getState();

        // If unmuting and no local stream, check permission first (Google Meet style!)
        if (state.isMuted && !state.localStream) {
            console.log("🎤 Checking microphone permission...");

            try {
                // Check permission status WITHOUT triggering prompt
                const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

                if (permissionStatus.state === 'denied') {
                    // Show modal with "Allow this time" button
                    console.log("⚠️ Permission denied - showing modal");
                    window.dispatchEvent(new CustomEvent('cluaiz:show-mic-permission-modal'));
                } else {
                    // Try to get stream
                    const stream = await webRTCService.startLocalStream();
                    if (stream) {
                        console.log("✅ Microphone enabled!");
                        set({ isMuted: false, localStream: stream });
                    }
                }
            } catch (err: any) {
                console.error("❌ Microphone access failed:", err);

                // Show modal if getUserMedia failed
                if (err.name === 'NotAllowedError') {
                    window.dispatchEvent(new CustomEvent('cluaiz:show-mic-permission-modal'));
                }
            }
        } else {
            // Normal toggle (stream already exists)
            set((state) => ({ isMuted: !state.isMuted }));
        }
    },

    toggleSpeaker: () => set((state) => ({ isSpeakerOn: !state.isSpeakerOn })),

    startCall: (name, number, image) => set({
        status: 'calling',
        isMinimized: false,
        callerName: name,
        callerNumber: number,
        callerImage: image,
        callStartTime: new Date(),
        callType: 'outgoing',
        permissionError: null // Clear previous errors on new attempt
    }),

    incomingCall: (name, number, image) => set({
        status: 'ringing',
        isMinimized: false,
        callerName: name,
        callerNumber: number,
        callerImage: image,
        callStartTime: new Date(),
        callType: 'incoming',
        permissionError: null // Clear previous errors
    }),

    endCall: () => {
        const state = useCallStore.getState();

        // Determine call status based on current state
        let callRecordStatus: CallRecordStatus = 'missed';
        if (state.status === 'connected') {
            callRecordStatus = 'answered';
        } else if (state.status === 'ringing') {
            callRecordStatus = 'declined'; // User declined incoming call
        } else if (state.status === 'calling') {
            callRecordStatus = 'missed'; // Outgoing call not answered
        }

        // Create call record if we have tracking data
        if (state.callStartTime && state.callType) {
            const endTime = new Date();
            const duration = Math.floor((endTime.getTime() - state.callStartTime.getTime()) / 1000);

            const callRecord: CallRecord = {
                id: `call-${Date.now()}`,
                type: state.callType,
                status: callRecordStatus,
                callerName: state.callerName,
                callerNumber: state.callerNumber,
                callerImage: state.callerImage,
                startTime: state.callStartTime,
                endTime: endTime,
                duration: duration
            };

            // Add to history
            state.addCallRecord(callRecord);

            // TODO: Send to chat as message
            console.log('📞 Call Record Created:', callRecord);

            // 🛑 Prevent Double Logging
            set({ callStartTime: null, callType: null });
        }

        set({
            status: 'ended',
            isMinimized: false
        });

        // Auto-reset to idle after 2 seconds
        setTimeout(() => {
            set({
                status: 'idle',
                callerName: '',
                callerNumber: '',
                callerImage: ''
                // removed callStartTime/Type reset as it's done above
            });
        }, 2000);
    },

    toggleRingerMute: () => set((state) => {
        console.log("🔊 toggleRingerMute CALLED! Changing from", state.isRingerMuted, "to", !state.isRingerMuted);
        return { isRingerMuted: !state.isRingerMuted };
    }),

    addCallRecord: (record) => set((state) => ({
        callHistory: [...state.callHistory, record]
    })),

    setStreams: (local, remote) => set({ localStream: local, remoteStream: remote }),

    setRemoteStream: (remote) => set({ remoteStream: remote }),

    setLocalStream: (local) => set({ localStream: local }),

    setPermissionError: (error) => set({ permissionError: error }),

    clearPermissionError: () => set((state) => ({
        permissionError: null,
        status: state.status === 'ended' ? 'idle' : state.status
    }))
}));
