import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json(
      { message: "Business ID is required" },
      { status: 400 }
    );
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        businessId: businessId,
      },
      include: {
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        type: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
