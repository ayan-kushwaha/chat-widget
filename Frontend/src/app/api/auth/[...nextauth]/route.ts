import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { login as loginApi } from "@/api/auth.api";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    console.log("🔹 NextAuth Authorize: Attempting login for", credentials?.email);
                    const data = await loginApi(credentials?.email || "", credentials?.password || "");
                    console.log("🔹 NextAuth Authorize: Backend Response success:", data.success);
                    if (data.success) {
                        console.log("🔹 NextAuth Authorize: Token received length:", data.token?.length);
                        return {
                            id: data.user.userId || data.user._id || data.user.id,
                            email: data.user.email,
                            name: data.user.name,
                            token: data.token,
                            orgId: data.orgId,
                            is_deleted: data.is_deleted,
                            role: data.user.role,
                        };
                    }
                    console.error("🔹 NextAuth Authorize: Login failed", data);
                    return null;
                } catch (error) {
                    console.error("🔹 NextAuth Authorize: Error", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account, profile }) {
            if (user) {
                token.accessToken = (user as any).token;
                token.userId = user.id;
                token.userName = user.name;
                token.userEmail = user.email;
                token.orgId = (user as any).orgId;
                token.is_deleted = (user as any).is_deleted;
                token.role = (user as any).role;
            }
            if (account?.provider === "google" && profile) {
                try {
                    // Internal Docker Network Optimization
                    const backendUrl = process.env.NODE_ENV === 'production'
                        ? 'http://backend:4000/v1'
                        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1');

                    const response = await fetch(`${backendUrl}/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: profile.email,
                            name: profile.name,
                            googleId: profile.sub,
                            picture: (profile as any).picture,
                        }),
                    });
                    let data;
                    const text = await response.text();
                    try {
                        data = text ? JSON.parse(text) : {};
                    } catch (e) {
                        console.error('Failed to parse backend response:', text);
                        data = { success: false };
                    }

                    console.log('Google auth backend response:', data);
                    if (data.success) {
                        token.accessToken = data.token;
                        token.userId = data.user.id;
                        token.orgId = data.orgId;
                        token.userName = data.user.name;
                        token.userEmail = data.user.email;
                        token.is_deleted = data.is_deleted;
                        token.userImage = data.user.image;
                        token.role = data.user.role;
                    }
                } catch (error) {
                    console.error('Google auth backend error:', error);
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.userId as string;
                session.user.name = token.userName as string || session.user.name;
                session.user.email = token.userEmail as string || session.user.email;
                session.user.image = token.userImage as string || session.user.image;
                (session.user as any).role = token.role as string;
            }
            (session as any).accessToken = token.accessToken;
            (session as any).orgId = token.orgId;
            (session as any).is_deleted = token.is_deleted;
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev_only",
});

export { handler as GET, handler as POST };
