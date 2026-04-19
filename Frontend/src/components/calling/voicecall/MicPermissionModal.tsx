import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { webRTCService } from '@/services/WebRTC.service';
import { useCallStore } from '@/store/useCallStore';

export const MicPermissionModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleShowModal = () => {
            setIsOpen(true);
        };

        window.addEventListener('cluaiz:show-mic-permission-modal', handleShowModal);
        return () => window.removeEventListener('cluaiz:show-mic-permission-modal', handleShowModal);
    }, []);

    const handleAllowThisTime = async () => {
        console.log('🎤 User clicked "Allow this time" - triggering getUserMedia...');

        try {
            // This will trigger the browser's NATIVE purple permission popup!
            const stream = await webRTCService.startLocalStream();

            if (stream) {
                console.log('✅ Permission granted! Mic enabled!');
                useCallStore.setState({
                    localStream: stream,
                    isMuted: false
                });
                setIsOpen(false);
            }
        } catch (err: any) {
            console.error('❌ User denied permission again:', err);
            // Keep modal open, user can try again
        }
    };

    const handleContinueWithout = () => {
        console.log('User chose to continue without microphone');
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
           
            <DialogContent
                className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] sm:max-w-md p-6 bg-background border shadow-2xl rounded-xl gap-4 duration-200"
                style={{ zIndex: 9999999999 }}
            >
                <DialogHeader className="space-y-3">
                    <DialogTitle className="flex items-start gap-3.5 text-lg leading-6 font-semibold">
                        <div className="bg-primary/10 p-2 rounded-full shrink-0">
                            <Mic className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span>Microphone Access Needed</span>
                            <span className="text-sm font-normal text-muted-foreground leading-snug">
                                You previously blocked microphone access for this site.
                            </span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                    {/* Buttons - Mobile: Col-reverse (Action on top), Desktop: Row */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button
                            onClick={handleContinueWithout}
                            variant="ghost"
                            className="flex-1 sm:flex-none justify-center"
                        >
                            No thanks
                        </Button>
                        <Button
                            onClick={handleAllowThisTime}
                            className="flex-1 sm:flex-none relative overflow-hidden"
                        >
                            <span className="relative z-10">Allow Access</span>
                        </Button>
                    </div>

                    {/* Helpful Tip */}
                    <div className="flex gap-3 p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground border border-border/50">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
                        <p className="leading-relaxed">
                            Click <strong>"Allow Access"</strong>, then authorize the browser request that appears at the top of your screen.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
