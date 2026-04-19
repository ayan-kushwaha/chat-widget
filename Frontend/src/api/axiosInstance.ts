import axios from 'axios';
import { store } from '../store/store'; // We will create this next
import { logout } from '../store/slices/authSlice'; // We will create this next

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/v1';
console.log("Axios Base URL:", API_URL);

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    transformResponse: [
        (data) => {
            if (typeof data === 'string') {
                try {
                    // Check for empty string to avoid JSON.parse error
                    if (!data.trim()) return {};
                    return JSON.parse(data);
                } catch (e) {
                    // Return raw data if parsing fails (though likely not JSON)
                    return data;
                }
            }
            return data;
        },
    ],
});

// Request Interceptor: Attach Token
axiosInstance.interceptors.request.use(
    async (config) => {
        // Try to get token from Redux first
        const state = store.getState();
        let token = state.auth.token;

        // If not in Redux, try to get from NextAuth session
        if (!token && typeof window !== 'undefined') {
            try {
                const { getSession } = await import('next-auth/react');
                const session = await getSession();
                console.log("🔹 Axios Interceptor: Session retrieved in interceptor:", session ? "Yes" : "No");
                token = (session as any)?.accessToken;
                console.log("🔹 Axios Interceptor: Token from session:", token ? "Found" : "Missing");
            } catch (error) {
                console.error('Failed to get session token:', error);
            }
        } else {
            console.log("🔹 Axios Interceptor: Token found in Redux");
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // CRITICAL: Inject Active Org ID
        if (typeof window !== 'undefined') {
            const activeOrgId = localStorage.getItem('activeOrgId');
            if (activeOrgId) {
                config.headers['x-org-id'] = activeOrgId;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Errors
axiosInstance.interceptors.response.use(
    (response) => {
        // Handle empty responses to prevent JSON parse errors
        if (response.data === "" || response.data === null || response.data === undefined) {
            response.data = {};
        }
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Unauthorized: Logout user
            store.dispatch(logout());
            if (typeof window !== 'undefined') {
                import('next-auth/react').then(({ signOut }) => {
                    signOut({ redirect: true, callbackUrl: '/login' });
                });
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
