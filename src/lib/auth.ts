import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function secureCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        email: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const email = credentials.email.trim();
        const password = credentials.password;

        const envEmail = process.env.ADMIN_EMAIL?.trim();
        const envPassword = process.env.ADMIN_PASSWORD;
        if (envEmail && envPassword && email === envEmail && secureCompare(password, envPassword)) {
          return { id: "env-admin", email: envEmail, name: "Admin" };
        }

        try {
          const admin = await prisma.admin.findUnique({ where: { email } });
          if (admin && await bcrypt.compare(password, admin.password)) {
            return { id: admin.id, email: admin.email, name: admin.name };
          }
        } catch (error) {
          console.warn("Database admin login unavailable.", error);
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = "ADMIN";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = String(token.role ?? "ADMIN");
      }
      return session;
    }
  }
};
