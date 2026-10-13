import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export function isAdminRole(role?: string | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "Verification Code", type: "text" },
        portal: { label: "Portal", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        const trimmedEmail = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        const portal = credentials.portal?.trim()?.toUpperCase();
        const isUserAdmin = isAdminRole(user.role);

        // Strict Separation: Do not allow admin login through the customer interface
        if (portal === "STORE" && isUserAdmin) {
          throw new Error(
            "Administrator accounts are not permitted to sign in through the customer interface. Please access the Admin Portal directly."
          );
        }

        // Strict Separation: Do not allow customer login through the admin portal
        if (portal === "ADMIN" && !isUserAdmin) {
          throw new Error(
            "Access Denied: Only authorized administrators may sign in to the Admin Portal."
          );
        }

        // Two-factor authentication verification
        const code = credentials.code?.trim();
        if (!code) {
          throw new Error("A 6-digit verification code is required to sign in.");
        }

        if (!user.twoFactorCode || !user.twoFactorExpires) {
          throw new Error("No active verification code found. Please request a new code.");
        }

        const now = new Date();
        if (new Date(user.twoFactorExpires) <= now) {
          throw new Error("Verification code has expired. Please request a new code.");
        }

        if (user.twoFactorCode !== code) {
          throw new Error("Invalid verification code. Please check your email and try again.");
        }

        // Consume/wipe verification code to prevent replay attacks
        await prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorCode: null,
            twoFactorExpires: null,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
