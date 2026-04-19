import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

export const MicPermissionHelpModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleShowHelp = () => {
            setIsOpen(true);
        };

        window.addEventListener('cluaiz:show-mic-help', handleShowHelp);
        return () => window.removeEventListener('cluaiz:show-mic-help', handleShowHelp);
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-destructive" />
                        Microphone Access Blocked
                    </DialogTitle>
                    <DialogDescription>
                        To use your microphone, you need to allow access in your browser.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-2 text-sm">
                            <p className="font-medium">How to enable microphone:</p>
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                <li>Click the <strong>🔒 lock icon</strong> in your browser's address bar</li>
                                <li>Find <strong>"Microphone"</strong> in the dropdown menu</li>
                                <li>Change the setting to <strong>"Allow"</strong></li>
                                <li>Click <strong>"Unmute"</strong> again to enable your mic</li>
                            </ol>
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground px-3">
                        <strong>Note:</strong> You only need to do this once. After allowing access, your microphone will work automatically in future calls.
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button onClick={() => setIsOpen(false)}>
                        Got it
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
