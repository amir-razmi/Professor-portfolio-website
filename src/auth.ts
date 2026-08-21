import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

import { getAuthSecret } from "@/lib/env";
import { authenticateAdmin } from "@/server/auth/admin-login";
import { safeAuthRedirect } from "@/server/auth/redirect";

const authConfig = (): NextAuthConfig => ({
  secret: getAuthSecret(),
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 8 * 60 * 60,
    updateAge: 15 * 60,
  },
  providers: [
    Credentials({
      name: "Administrator credentials",
      credentials: {
        email: {
          label: "Email address",
          type: "email",
          autoComplete: "email",
        },
        password: {
          label: "گذرواژه",
          type: "password",
          autoComplete: "current-password",
        },
      },
      async authorize(credentials) {
        return authenticateAdmin(credentials);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      return safeAuthRedirect(url, baseUrl);
    },
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
