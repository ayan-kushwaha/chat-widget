import React from 'react';

interface DebugPanelProps {
    orgId: string;
    isEditing: boolean;
    initialConfig: any;
    widgetConfig: any;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ orgId, isEditing, initialConfig, widgetConfig }) => {
    return (
        <div className="fixed bottom-4 right-4 bg-black/90 text-xs text-green-400 p-4 rounded-lg border border-green-500/30 font-mono shadow-2xl z-50 max-w-sm max-h-96 overflow-auto">
            <h4 className="font-bold border-b border-green-500/30 mb-2 pb-1">DEBUG INFO</h4>
            <div className="space-y-2">
                <div>
                    <span className="text-white">Org ID:</span> {orgId || 'missing'}
                </div>
                <div>
                    <span className="text-white">Is Editing:</span> {isEditing ? 'YES' : 'NO'}
                </div>
                <div>
                    <span className="text-white">Last Render:</span> {new Date().toLocaleTimeString()}
                </div>
                <div>
                    <span className="text-white">Theme Config (Live):</span>
                    <pre className="mt-1 text-[10px] text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {JSON.stringify(widgetConfig.theme, null, 2)}
                    </pre>
                </div>
                <div>
                    <span className="text-white">Initial Config (Backend):</span>
                    <pre className="mt-1 text-[10px] text-slate-400 whitespace-pre-wrap max-h-20 overflow-hidden hover:overflow-auto transition-all">
                        {JSON.stringify(initialConfig || {}, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};
