import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { Role } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    (session.user.role !== "SUPERADMIN" && session.user.role !== "SUPPORT")
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { name, role, emailVerified, businessType } = await req.json();

    // Restriction: SUPPORT role cannot change user roles
    if (session.user.role === "SUPPORT" && role) {
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });

      if (currentUser?.role !== role) {
        return NextResponse.json(
          { message: "Support agents cannot change user roles." },
          { status: 403 },
        );
      }
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (role !== undefined && session.user.role === "SUPERADMIN")
      data.role = role as Role;
    if (emailVerified !== undefined)
      data.emailVerified = emailVerified ? new Date() : null;

    // Transaction to update user and optionally business type
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data,
      });

      if (businessType && session.user.role === "SUPERADMIN") {
        // Find primary business for this user (where they are OWNER)
        // Adjust logic if "primary" means something else in your schema
        const membership = await tx.membership.findFirst({
          where: { userId: id, role: "OWNER" },
          select: { businessId: true },
        });

        if (membership) {
          await tx.business.update({
            where: { id: membership.businessId },
            data: { type: businessType },
          });

          // Also update PricingPlan or subscription status if needed?
          // For now, we assume changing the type is enough, and subscription logic relies on business.type
        }
      }
      return updatedUser;
    });

    await logAction("USER_UPDATE", session.user.id, {
      targetUserId: id,
      name,
      role,
      emailVerified: !!emailVerified,
      businessType,
      updatedByRole: session.user.role,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // DELETION remains restricted to SUPERADMIN only
  if (!session || !session.user || session.user.role !== "SUPERADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    await logAction("USER_DELETE", session.user.id, {
      targetUserId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
