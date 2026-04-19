import { useCallback, useEffect } from 'react';
import { useCallStore } from '@/store/useCallStore';
import { webRTCService } from '@/services/WebRTC.service';
import { toast } from 'sonner';

export const usePermissionPopup = () => {
    // Simplified: Just request permission directly
    // localhost is treated as secure context by browsers!
    const openPermissionPopup = useCallback(async () => {
        console.log('🎤 Requesting microphone permission...');

        try {
            // Direct call - browser shows native permission popup on localhost!
            const stream = await webRTCService.startLocalStream();

            if (stream) {
                console.log('✅ Microphone permission granted!');
                toast.success('Microphone enabled!');

                // Update store
                useCallStore.setState({
                    localStream: stream,
                    isMuted: false
                });
            }
        } catch (err: any) {
            console.error('❌ Microphone permission denied:', err);

            if (err.name === 'NotAllowedError') {
                // Show user-friendly message
                toast.error('Microphone access denied', {
                    description: 'Click the lock icon 🔒 in address bar to allow access',
                    duration: 5000
                });
            } else if (err.name === 'NotFoundError') {
                toast.error('No microphone found');
            } else {
                toast.error('Failed to access microphone');
            }
        }
    }, []);

    return { openPermissionPopup };
};
