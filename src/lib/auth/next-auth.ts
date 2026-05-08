import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { resolveRoleFromEmail } from "@/lib/auth/access-control";
import { upsertUserByEmail } from "@/lib/db/repository";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email;
      if (!email) return false;

      const role = resolveRoleFromEmail(email);
      if (!role) return false;

      await upsertUserByEmail(email, profile.name ?? email, role === "admin" ? "ADMIN" : "STUDENT");
      return true;
    },
    async jwt({ token, profile }) {
      const email = (profile?.email ?? token.email) as string | undefined;
      if (!email) return token;

      const role = resolveRoleFromEmail(email);
      if (!role) return token;

      const user = await upsertUserByEmail(email, (profile?.name as string | undefined) ?? token.name ?? email, role === "admin" ? "ADMIN" : "STUDENT");
      token.userId = user.id;
      token.role = role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = Number(token.userId);
        session.user.role = token.role === "admin" ? "admin" : "student";
      }

      return session;
    }
  },
  pages: {
    signIn: "/"
  }
};
