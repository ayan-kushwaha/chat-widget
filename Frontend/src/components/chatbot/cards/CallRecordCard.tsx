import { motion } from 'framer-motion';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { CallRecord } from '@/store/useCallStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CallRecordCardProps {
    record: CallRecord;
}

export const CallRecordCard = ({ record }: CallRecordCardProps) => {
    const isAnswered = record.status === 'answered';
    const isIncoming = record.type === 'incoming';

    // Format duration from seconds to MM:SS
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Format time
    const formatTime = (date: Date) => {
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Get status text
    const getStatusText = () => {
        if (record.status === 'answered') {
            return isIncoming ? 'Incoming call' : 'Outgoing call';
        } else if (record.status === 'declined') {
            return 'Declined';
        } else {
            return 'Missed call';
        }
    };

    // Get icon
    const getIcon = () => {
        if (record.status === 'answered') {
            return isIncoming ? (
                <PhoneIncoming size={16} />
            ) : (
                <PhoneOutgoing size={16} />
            );
        } else {
            return <PhoneMissed size={16} />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative max-w-sm rounded-2xl backdrop-blur-xl p-4 border transition-all duration-300",
                isAnswered
                    ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20 hover:border-emerald-500/40"
                    : "bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20 hover:border-red-500/40"
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10 ring-2 ring-white/10">
                    <AvatarImage src={record.callerImage} alt={record.callerName} />
                    <AvatarFallback className="bg-neutral-800 text-white text-sm">
                        {record.callerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "inline-flex transition-colors",
                            isAnswered ? "text-emerald-400" : "text-red-400"
                        )}>
                            {getIcon()}
                        </span>
                        <h3 className="text-sm font-semibold text-white truncate">
                            {record.callerName}
                        </h3>
                    </div>
                    <p className="text-xs text-zinc-400">
                        {record.callerNumber}
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div className={cn(
                "h-px mb-3",
                isAnswered ? "bg-emerald-500/20" : "bg-red-500/20"
            )} />

            {/* Call Details */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">{getStatusText()}</span>
                    <span className={cn(
                        "font-medium",
                        isAnswered ? "text-emerald-400" : "text-red-400"
                    )}>
                        {record.status === 'answered' ? formatDuration(record.duration) : '0:00'}
                    </span>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{formatTime(record.startTime)}</span>
                    {record.status === 'answered' && (
                        <span>→ {formatTime(record.endTime)}</span>
                    )}
                </div>
            </div>

            {/* Glow effect */}
            <div className={cn(
                "absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm -z-10",
                isAnswered
                    ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/20"
                    : "bg-gradient-to-br from-red-500/20 to-red-600/20"
            )} />
        </motion.div>
    );
};
