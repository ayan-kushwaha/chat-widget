import { AliveChatWidget } from '../widgets/AliveChatWidget';
// ❌ REMOVED: ChatWindow (deprecated for widget use)
interface ChatViewProps {
    orgId?: string | null;
    initialMessage?: string;
    commandId?: number;
    onNavigate?: (view: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
    orgId = null,
    initialMessage,
    commandId,
    onNavigate
}) => {
    if (!orgId) return null;

    return (
        <div className="h-full">
            {/* ✅ FIXED: Using AliveChatWidget instead of deprecated ChatWindow */}
            <AliveChatWidget
                orgId={orgId}
                initialMessage={initialMessage}
                commandId={commandId}
            />
        </div>
    );
};
