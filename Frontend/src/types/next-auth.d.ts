import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
        } & DefaultSession["user"];
        accessToken?: string;
    }

    interface User {
        token?: string;
        role?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId?: string;
        accessToken?: string;
        role?: string;
    }
}
