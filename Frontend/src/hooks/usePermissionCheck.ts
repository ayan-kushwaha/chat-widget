import { useEffect } from 'react';
import { webRTCService } from '@/services/WebRTC.service';
import { useCallStore } from '@/store/useCallStore';

export const usePermissionCheck = () => {
    useEffect(() => {
        // Check microphone permission status on mount
        checkMicrophonePermission();
    }, []);

    const checkMicrophonePermission = async () => {
        try {
            // Use Permissions API to check status WITHOUT triggering prompt
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

            console.log(`🎤 Microphone permission state: ${permissionStatus.state}`);

            // Listen for permission changes
            permissionStatus.onchange = () => {
                console.log(`🔄 Permission changed to: ${permissionStatus.state}`);
            };

            return permissionStatus.state;
        } catch (error) {
            console.error('❌ Error querying microphone permission:', error);
            return 'unknown';
        }
    };

    const requestMicrophoneWithCheck = async () => {
        const permissionState = await checkMicrophonePermission();

        if (permissionState === 'denied') {
            // Show Google Meet-style modal
            console.log('⚠️ Permission denied - showing modal');
            window.dispatchEvent(new CustomEvent('cluaiz:show-mic-permission-modal'));
        } else if (permissionState === 'prompt' || permissionState === 'granted') {
            // Direct getUserMedia call
            try {
                const stream = await webRTCService.startLocalStream();
                if (stream) {
                    console.log('✅ Microphone enabled!');
                    useCallStore.setState({
                        localStream: stream,
                        isMuted: false
                    });
                }
            } catch (err: any) {
                console.error('❌ getUserMedia failed:', err);
                if (err.name === 'NotAllowedError') {
                    // User denied - next time it will be 'denied' state
                    window.dispatchEvent(new CustomEvent('cluaiz:show-mic-permission-modal'));
                }
            }
        }
    };

    return { requestMicrophoneWithCheck };
};
