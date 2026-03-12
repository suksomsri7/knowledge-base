import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

if (process.env.AUTH_SECRET) process.env.AUTH_SECRET = process.env.AUTH_SECRET.trim();
if (process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL.trim();

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // authorize is defined in auth.ts (needs Node.js runtime for DB access)
      authorize: () => null,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isSuperAdmin = (user as Record<string, unknown>).isSuperAdmin as boolean;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).isSuperAdmin = token.isSuperAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
