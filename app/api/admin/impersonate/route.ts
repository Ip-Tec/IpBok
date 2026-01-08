import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // 1. Authorization Check
  if (
    !session ||
    (session.user.role !== "SUPERADMIN" && session.user.role !== "SUPPORT")
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 },
      );
    }

    // 2. Fetch Target User
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { include: { business: true } } },
    });

    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 3. Construct JWT Token
    // We mimic the structure created in lib/auth.ts `jwt` callback
    const tokenPayload = {
      name: targetUser.name,
      email: targetUser.email,
      picture: targetUser.image,
      sub: targetUser.id,
      id: targetUser.id, // Some setups use id, match CustomUser interface if needed
      role: targetUser.role,
      transactionsPerPage: targetUser.transactionsPerPage,
      businessId: targetUser.memberships[0]?.businessId,
      businessType: targetUser.memberships[0]?.business?.type,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      jti: crypto.randomUUID(),
    };

    // 4. Sign Token
    const encodedToken = await encode({
      token: tokenPayload,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    // 5. Set Cookie directly
    // Look for secure cookie name if in production/secure env
    const isSecure = process.env.NEXTAUTH_URL?.startsWith("https://");
    const cookieName = isSecure
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    const response = NextResponse.json({ message: "Impersonation successful" });

    response.cookies.set(cookieName, encodedToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Impersonation error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
