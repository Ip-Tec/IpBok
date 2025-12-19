import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { Role } from "@/src/generated/enums";
import bcrypt from "bcryptjs";

interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
  businessId?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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

          if (user && user.password && await bcrypt.compare(credentials.password, user.password)) {
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
    async signIn({ user, account: _account }) {
      // For Google OAuth, create user if they don't exist
      if (_account?.provider === "google") {
        const userExists = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!userExists) {
          // Use a nested write to create user, business, and membership atomically
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              role: Role.OWNER,
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
        }
      }
      return true; // Continue with the sign-in process
    },
    async jwt({ token, user, account }) {
      // On initial sign-in, the user object is passed in
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
          // For simplicity, we'll add the first business found.
          // This can be expanded later for multi-business support.
          if (dbUser.memberships && dbUser.memberships.length > 0) {
            token.businessId = dbUser.memberships[0].businessId;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Persist the data from the token to the session
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        if (token.businessId) {
          session.user.businessId = token.businessId as string;
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