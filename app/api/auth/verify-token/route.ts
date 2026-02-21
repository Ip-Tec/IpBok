import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ message: "Token is required" }, { status: 400 });
  }

  try {
    const vToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!vToken) {
      return NextResponse.json({ message: "Invalid token" }, { status: 404 });
    }

    if (vToken.expires < new Date()) {
      return NextResponse.json({ message: "Token expired" }, { status: 410 });
    }

    if (vToken.identifier.startsWith("INVITE:")) {
      const [, email, role, businessId] = vToken.identifier.split(":");
      return NextResponse.json({
        type: "INVITE",
        email,
        role,
        businessId
      });
    }

    return NextResponse.json({
      type: "VERIFY",
      email: vToken.identifier
    });

  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
