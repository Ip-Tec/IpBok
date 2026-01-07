import { DefaultSession } from "next-auth";
import { BusinessType } from "@prisma/client";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: string;
      businessId: string;
      transactionsPerPage: number;
      businessType?: BusinessType | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    businessId: string;
    transactionsPerPage: number;
    businessType?: BusinessType | null;
  }
}
