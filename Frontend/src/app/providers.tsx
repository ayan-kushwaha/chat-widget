'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SessionProvider, useSession } from 'next-auth/react';
import { store, persistor } from '@/store/store';
import { useEffect } from 'react';
import { OrgProvider } from '@/context/OrgContext';

function TokenSync() {
    const { data: session, status } = useSession();
    useEffect(() => {
        if (status === 'authenticated' && session && (session as any).accessToken) {
            localStorage.setItem('token', (session as any).accessToken);
        } else if (status === 'unauthenticated') {
            localStorage.removeItem('token');
        }
    }, [session, status]);
    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((reg) => console.log('✅ Service Worker Registered:', reg.scope))
                .catch((err) => console.error('❌ Service Worker Error:', err));
        }
    }, []);

    return (
        <SessionProvider>
            <TokenSync />
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <OrgProvider>
                        {children}
                    </OrgProvider>
                </PersistGate>
            </Provider>
        </SessionProvider>
    );
}
