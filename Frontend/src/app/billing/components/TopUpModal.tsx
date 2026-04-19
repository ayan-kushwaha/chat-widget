
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Coins, Zap, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGeo } from "@/hooks/useGeo";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { calculatePrice } from "@/lib/priceUtils";

interface TopUpModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

import { useOrg } from "@/context/OrgContext";

// ... existing imports

export function TopUpModal({ open, onClose, onSuccess }: TopUpModalProps) {
    const geo = useGeo();
    const { data: session } = useSession();
    const { activeOrg: organization } = useOrg(); // 🟢 Get Org Context

    // Default: 50,000 Tokens
    const [tokens, setTokens] = useState<number>(50000);
    const [loading, setLoading] = useState(false);

    const multiplier = (geo.currency.costMultiplier || 0) * 1.5; // 🟢 Adjusted multiplier
    const price = calculatePrice(tokens, multiplier, geo.currency.code);
    const currencySymbol = geo.currency.symbol;

    const handlePayment = async () => {
        setLoading(true);
        try {
            const isLoaded = await loadRazorpay();
            if (!isLoaded) throw new Error("Razorpay SDK failed to load");

            const token = (session as any)?.accessToken || (session as any)?.user?.token;
            if (!token) throw new Error("Authentication missing");

            const orgId = (organization as any)?.id || (organization as any)?._id;
            if (!orgId) throw new Error("Organization context missing");

            // 1. Create Top-up Order
            const res = await fetch('/api/payment/create-topup-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-org-id': orgId // 🟢 Explicitly send Org ID
                },
                body: JSON.stringify({
                    tokens,
                    currency: geo.currency.code
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            // 🧪 Mock Mode Handling
            if (data.order.id.startsWith('order_mock_')) {
                await verifyPayment(data.order.id, 'pay_mock_' + Date.now(), 'mock_sig');
                return;
            }

            // 2. Open Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Cluaiz AI",
                description: `Top-up: ${tokens.toLocaleString()} Tokens`,
                order_id: data.order.id,
                handler: async (response: any) => {
                    await verifyPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
                },
                prefill: {
                    email: session?.user?.email
                },
                theme: {
                    color: "#6366f1"
                },
                notes: data.order.notes
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error: any) {
            console.error("Topup Error:", error);
            toast.error("Top-up Failed", { description: error.message });
            setLoading(false);
        }
    };

    const verifyPayment = async (orderId: string, paymentId: string, signature: string) => {
        try {
            const token = (session as any)?.accessToken || (session as any)?.user?.token;
            const res = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    razorpay_order_id: orderId,
                    razorpay_payment_id: paymentId,
                    razorpay_signature: signature
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Wallet Funded! 🚀", { description: `${tokens.toLocaleString()} tokens added.` });
                onSuccess?.();
                onClose();
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast.error("Verification Failed", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-slate-950 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        Top-up Wallet
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Add tokens instantly. Valid until used.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-8">
                    {/* Display */}
                    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                        <div className="text-3xl font-bold font-mono text-indigo-400">
                            {tokens.toLocaleString()}
                        </div>
                        <div className="text-xs font-medium text-indigo-300/60 mt-1 uppercase tracking-wider">
                            Tokens to Add
                        </div>
                    </div>

                    {/* Slider */}
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Tokens</span>
                            <span className="font-bold text-white">{tokens.toLocaleString()}</span>
                        </div>
                        <Slider
                            value={[tokens]}
                            onValueChange={(v) => setTokens(v[0])}
                            min={5000}
                            max={1000000}
                            step={1000}
                            className="bg-slate-800"
                        />
                        <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                            <span>50K</span>
                            <span>1M</span>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs text-slate-400">Secure Checkout</span>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">
                                {currencySymbol}{price.toLocaleString()}
                            </div>

                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700 hover:bg-slate-900">
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePayment}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Pay Now
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
