export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId } = await request.json();
    if (!businessId) {
      return NextResponse.json(
        { error: "Missing businessId" },
        { status: 400 },
      );
    }

    // Check if user is already linked to a business
    const existingMembership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
    });

    if (existingMembership) {
      return NextResponse.json(
        { message: "User already has a business" },
        { status: 200 },
      );
    }

    // Link user to business as AGENT
    await prisma.membership.create({
      data: {
        userId: session.user.id,
        businessId: businessId,
        role: "AGENT",
      },
    });

    // Also update the role on the user record to AGENT if it's not already
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "AGENT" },
    });

    return NextResponse.json(
      { message: "Linked successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
