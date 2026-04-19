import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Mail, ChevronLeft, Zap } from 'lucide-react';
import { useGatekeeperStore } from '@/store/gatekeeperStore';

export const SecurityGatekeeperModal: React.FC = () => {
    const { isOpen, context, verify, close } = useGatekeeperStore();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);

        // Simulate "Establish Secure Uplink"
        setTimeout(() => {
            setIsLoading(false);

            // Save to session
            sessionStorage.setItem('cluaiz_gatekeeper_verified', 'true');
            sessionStorage.setItem('cluaiz_user_details', JSON.stringify({ name, email }));

            verify({ name, email });
            setName('');
            setEmail('');
        }, 800);
    };

    const handleGoogleLogin = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            sessionStorage.setItem('cluaiz_gatekeeper_verified', 'true');
            sessionStorage.setItem('cluaiz_user_details', JSON.stringify({
                name: "Google User",
                email: "user@gmail.com"
            }));
            verify({ name: "Google User", email: "user@gmail.com" });
        }, 1000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={close}>
            <DialogContent
                className="p-0 border-none bg-black text-white max-w-[400px] overflow-hidden rounded-[24px] shadow-2xl"
                style={{ zIndex: 9999999 }}
            >
                <div className="relative w-full h-full flex flex-col p-6 sm:p-8 bg-[#050505]">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={close}
                            className="w-10 h-10 rounded-2xl bg-[#111] flex items-center justify-center text-white/50 hover:text-white hover:bg-[#222] transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <h2 className="text-xl font-black italic tracking-wider text-white uppercase">
                            Identification
                        </h2>

                        <button
                            onClick={handleGoogleLogin}
                            className="px-4 py-2 rounded-xl bg-[#111] text-[10px] font-bold tracking-widest text-[#4f8eff] hover:bg-[#1a1a1a] transition-all border border-[#1a1a1a]"
                        >
                            LOGIN
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Context Label */}
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase whitespace-nowrap">
                                {context || "Enter your details"}
                            </span>
                            <div className="h-[1px] w-full bg-white/10"></div>
                        </div>

                        {/* Name Input */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black tracking-widest text-[#4f8eff] uppercase ml-1">
                                Full Name
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <User size={18} className="text-white/30 group-focus-within:text-[#4f8eff] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter name..."
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-[20px] py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-[#4f8eff]/50 focus:ring-1 focus:ring-[#4f8eff]/50 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black tracking-widest text-[#4f8eff] uppercase ml-1">
                                Email Sync
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-white/30 group-focus-within:text-[#4f8eff] transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email..."
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-[20px] py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-[#4f8eff]/50 focus:ring-1 focus:ring-[#4f8eff]/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 rounded-[28px] bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white font-black tracking-[0.15em] uppercase text-xs shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Zap size={18} fill="currentColor" />
                                        Establish Secure Uplink
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};
