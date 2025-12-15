

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      businessId?: string;
    };
  }

  interface JWT {
    role: string;
    businessId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    businessId?: string;
  }
}