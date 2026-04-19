'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for existing token (client-side only)
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                // TODO: Verify token and get user data
                setLoading(false);
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const { data } = await authAPI.login(email, password);
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', data.token);
        }
        setUser(data.user);
        router.push('/dashboard');
    };

    const register = async (email: string, password: string, name: string) => {
        const { data } = await authAPI.register(email, password, name);
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', data.token);
        }
        setUser(data.user);
        router.push('/dashboard');
    };

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
