import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function PUT(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ userId: string }> }
) {
  const params = await paramsPromise;
  const session = await getServerSession(authOptions);

  if (!session || session.user.id !== params.userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { firstName, lastName, email } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const name = `${firstName} ${lastName}`;

    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: {
        name,
        email,
      },
    });

    // Exclude password from the returned user object
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
