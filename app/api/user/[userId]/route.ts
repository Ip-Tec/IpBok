export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ userId: string }> },
) {
  const params = await paramsPromise;
  const session = await getServerSession(authOptions);

  if (!session || session.user.id !== params.userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { firstName, lastName, email, transactionsPerPage } = body;

    const dataToUpdate: {
      name?: string;
      email?: string;
      transactionsPerPage?: number;
    } = {};

    if (firstName && lastName) {
      dataToUpdate.name = `${firstName} ${lastName}`;
    }
    if (email) {
      dataToUpdate.email = email;
    }
    if (transactionsPerPage) {
      dataToUpdate.transactionsPerPage = transactionsPerPage;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: dataToUpdate,
    });

    // Exclude password from the returned user object
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
