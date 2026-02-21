import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await prisma.retailCategory.findMany({
      where: { businessId: session.user.businessId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name } = body;

    const category = await prisma.retailCategory.create({
      data: {
        name,
        businessId: session.user.businessId,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
