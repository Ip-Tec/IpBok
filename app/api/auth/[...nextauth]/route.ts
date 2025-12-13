import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
  businessId?: string;
}

const handler = NextAuth({
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
          // Call your Python backend API for login
          const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const user = await res.json();

          if (res.ok && user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role, // e.g., 'Owner', 'Admin'
              businessId: user.businessId, // if applicable
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
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user) {
        // For Google, call backend to get or create user
        try {
          const res = await fetch(`${process.env.BACKEND_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              googleId: account.providerAccountId,
            }),
          });
          const backendUser = await res.json();
          if (res.ok) {
            token.role = backendUser.role || "Owner";
            token.businessId = backendUser.businessId;
          }
        } catch (error) {
          console.error("Google auth backend error:", error);
        }
      } else if (user) {
        const customUser = user as CustomUser;
        token.role = customUser.role;
        token.businessId = customUser.businessId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.businessId = token.businessId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };