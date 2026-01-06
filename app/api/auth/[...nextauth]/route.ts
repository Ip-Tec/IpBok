export const dynamic = "force-dynamic";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { Role } from "@/src/generated";
import bcrypt from "bcryptjs";

interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
  businessId?: string;
}

import { PrismaAdapter } from "@next-auth/prisma-adapter";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
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

          if (
            user &&
            user.password &&
            (await bcrypt.compare(credentials.password, user.password))
          ) {
            if (!user.emailVerified) {
              // Return null or throw error depending on how you want to handle it.
              // NextAuth default error page might be shown if we throw.
              // For now, let's return null which is safest, or we could customize the error handler.
              // Ideally, we throw an error "Email not verified" but NextAuth behavior varies.
              // Let's rely on the user knowing they need to verify if login fails right after signup.
              throw new Error("Email not verified");
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            } as CustomUser;
          }
        } catch (error) {
          console.error("Auth error:", error);
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const userWithBusiness = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { memberships: true },
          });

          // If the user doesn't exist yet, or exists but has no business
          if (!userWithBusiness || userWithBusiness.memberships.length === 0) {
            if (!userWithBusiness) {
              // New user from Google: Create user, business, and membership atomically
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
              // Existing user (could be from Credentials or Adapter created them first)
              // Promote to OWNER, verify email, and create business
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
            // User exists and has a business, just ensure email is verified
            await prisma.user.update({
              where: { id: userWithBusiness.id },
              data: { emailVerified: new Date() },
            });
          }
        } catch (error) {
          console.error("Error in Google signIn callback:", error);
        }
      }
      return true;
    },
    async jwt({ token, user, account: _account }) {
      // On initial sign-in, the user object is passed in.
      if (user) {
        token.sub = user.id;
      }

      // On subsequent requests, token.sub will exist.
      // We use this to refresh the user data on the token.
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { memberships: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.transactionsPerPage = dbUser.transactionsPerPage;
          // For simplicity, we'll add the first business found.
          if (dbUser.memberships && dbUser.memberships.length > 0) {
            token.businessId = dbUser.memberships[0].businessId;
            // Fetch the business type
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
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
