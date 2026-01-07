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
    const { name, role, emailVerified } = await req.json();

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

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    await logAction("USER_UPDATE", session.user.id, {
      targetUserId: id,
      name,
      role,
      emailVerified: !!emailVerified,
      updatedByRole: session.user.role,
    });

    return NextResponse.json(updatedUser);
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
