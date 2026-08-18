import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/modules/auth/types";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // 1. Cek apakah ini Super Admin di tabel database super_admins
        const superAdmin = await prisma.superAdmin.findUnique({
          where: { email: normalizedEmail },
        });

        if (superAdmin) {
          const isSuperAdminPasswordValid = await bcrypt.compare(
            credentials.password,
            superAdmin.passwordHash
          );

          if (!isSuperAdminPasswordValid) {
            throw new Error("Email atau password Super Admin salah");
          }

          return {
            id: superAdmin.id,
            name: superAdmin.name,
            email: superAdmin.email,
            role: "SUPER_ADMIN" as any,
            tenantId: "",
            businessName: "Platform Super Admin",
            outletId: null,
            outletName: null,
          };
        }

        // 2. Jika bukan Super Admin, cek User Tenant biasa
        const user = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            isActive: true,
          },
          include: {
            tenant: true,
            outlet: true,
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Email atau password salah");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error("Email atau password salah");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          businessName: user.tenant?.businessName || "",
          outletId: user.outletId,
          outletName: user.outlet?.name || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.businessName = (user as any).businessName;
        token.outletId = (user as any).outletId;
        token.outletName = (user as any).outletName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as any;
        (session.user as any).tenantId = token.tenantId as string;
        (session.user as any).businessName = token.businessName as string;
        (session.user as any).outletId = token.outletId as string | null;
        (session.user as any).outletName = token.outletName as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "pos-universal-secret-key-change-this-in-production-2026",
};
