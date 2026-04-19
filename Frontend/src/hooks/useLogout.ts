'use client';

import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { toast } from 'sonner';

export function useLogout() {
    const dispatch = useDispatch();
    const router = useRouter();

    const logout = async () => {
        try {
            // Clear Redux state
            dispatch(logoutAction());

            // Dynamic Redirect: app.cluaiz.com -> cluaiz.com/login
            const protocol = window.location.protocol;
            const host = window.location.host;
            const rootDomain = host.replace(/^app\./, ''); // Remove 'app.' prefix
            const targetUrl = `${protocol}//${rootDomain}/login`;

            // Sign out from NextAuth
            await signOut({ callbackUrl: targetUrl });
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    return logout;
}
