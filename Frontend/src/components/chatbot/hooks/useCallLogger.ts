
import { useEffect, useRef } from 'react';
import { useCallStore } from '@/store/useCallStore';

interface UseCallLoggerProps {
    logCall: (data: {
        duration: number;
        status: 'answered' | 'missed' | 'declined';
        callerName: string;
        type: 'incoming' | 'outgoing';
    }) => void;
}

export const useCallLogger = ({ logCall }: UseCallLoggerProps) => {
    const { callHistory } = useCallStore();
    const prevCallRef = useRef<string | null>(null);

    useEffect(() => {
        const latestCall = callHistory[callHistory.length - 1];

        if (latestCall && latestCall.id !== prevCallRef.current) {
            prevCallRef.current = latestCall.id;

            // 🛑 DEDUPLICATION RULE:
            // Only the CALLER logs the call to the database.
            // This prevents double logs (one from caller, one from receiver).
            if (latestCall.type === 'outgoing') {
                console.log("📝 [useCallLogger] Logging OUTGOING call:", latestCall);
                logCall({
                    callerName: latestCall.callerName,
                    duration: latestCall.duration,
                    status: latestCall.status,
                    type: latestCall.type
                });
            } else {
                console.log("🛑 [useCallLogger] Skipping INCOMING call log (Caller will handle it):", latestCall);
            }
        }
    }, [callHistory, logCall]);
};
