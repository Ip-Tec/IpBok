import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { Role, BusinessType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
  businessId?: string;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      httpOptions: {
        timeout: 10000,
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) return null;

          if (!user.password) {
            throw new Error("SocialAccountOnly");
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password,
          );
          if (!passwordMatch) return null;

          if (!user.emailVerified) {
            throw new Error("Email not verified");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          } as CustomUser;
        } catch (error: any) {
          if (
            error.message === "Email not verified" ||
            error.message === "SocialAccountOnly"
          ) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const userWithBusiness = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { memberships: true },
          });

          if (!userWithBusiness || userWithBusiness.memberships.length === 0) {
            if (!userWithBusiness) {
              await prisma.user.create({
                data: {
                  email: user.email!,
                  name: user.name,
                  role: Role.OWNER,
                  emailVerified: new Date(),
                  memberships: {
                    create: {
                      role: Role.OWNER,
                      business: {
                        create: { name: `${user.name}'s Business` },
                      },
                    },
                  },
                },
              });
            } else {
              await prisma.$transaction([
                prisma.user.update({
                  where: { id: userWithBusiness.id },
                  data: {
                    role: Role.OWNER,
                    emailVerified: new Date(),
                  },
                }),
                prisma.membership.create({
                  data: {
                    role: Role.OWNER,
                    user: { connect: { id: userWithBusiness.id } },
                    business: {
                      create: { name: `${user.name}'s Business` },
                    },
                  },
                }),
              ]);
            }
          } else {
            await prisma.user.update({
              where: { id: userWithBusiness.id },
              data: { emailVerified: new Date() },
            });
          }
          return true;
        } catch (error: any) {
          console.error("CRITICAL: Error in Google signIn callback:", {
            error,
            message: error.message,
            stack: error.stack,
            user: { email: user.email, name: user.name }
          });
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          include: { memberships: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.transactionsPerPage = dbUser.transactionsPerPage;
          if (dbUser.memberships && dbUser.memberships.length > 0) {
            token.businessId = dbUser.memberships[0].businessId;
            const business = await prisma.business.findUnique({
              where: { id: dbUser.memberships[0].businessId },
              select: { type: true },
            });
            token.businessType = business?.type;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.transactionsPerPage = token.transactionsPerPage as number;
        if (token.businessId) {
          session.user.businessId = token.businessId as string;
        }
        if (token.businessType) {
          (session.user as any).businessType = token.businessType;
        }
        if (token.impersonatorId) {
          (session.user as any).impersonatorId = token.impersonatorId;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
};
