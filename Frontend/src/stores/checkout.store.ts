import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CheckoutState {
    billingCycle: 'monthly' | 'yearly';
    couponCode: string | null;
    termsAccepted: boolean;
    setBillingCycle: (cycle: 'monthly' | 'yearly') => void;
    setCouponCode: (code: string | null) => void;
    setTermsAccepted: (accepted: boolean) => void;
    reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
    persist(
        (set) => ({
            billingCycle: 'monthly',
            couponCode: null,
            termsAccepted: false,
            setBillingCycle: (cycle) => set({ billingCycle: cycle }),
            setCouponCode: (code) => set({ couponCode: code }),
            setTermsAccepted: (accepted) => set({ termsAccepted: accepted }),
            reset: () => set({ billingCycle: 'monthly', couponCode: null, termsAccepted: false }),
        }),
        {
            name: 'checkout-storage', // name of the item in the storage (must be unique)
        },
    ),
);
