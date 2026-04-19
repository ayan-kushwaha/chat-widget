import { create } from 'zustand';

interface UserData {
    name: string;
    email: string;
}

interface GatekeeperStore {
    isOpen: boolean;
    context: string;
    onVerified: ((userData: UserData) => void) | null;

    open: (context: string, onVerified: (userData: UserData) => void) => void;
    close: () => void;
    verify: (userData: UserData) => void;
}

export const useGatekeeperStore = create<GatekeeperStore>((set, get) => ({
    isOpen: false,
    context: '',
    onVerified: null,

    open: (context, onVerified) => {
        set({ isOpen: true, context, onVerified });
    },

    close: () => {
        set({ isOpen: false, context: '', onVerified: null });
    },

    verify: (userData) => {
        const { onVerified } = get();
        if (onVerified) {
            onVerified(userData);
        }
        get().close();
    }
}));
