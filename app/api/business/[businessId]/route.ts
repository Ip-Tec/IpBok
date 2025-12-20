import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role } from "@/src/generated/enums";

export async function GET(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { businessId } = params;

    if (!session || session.user.role !== Role.OWNER) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (session.user.businessId !== businessId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
    });

    if (!business) {
      return NextResponse.json(
        { message: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("Error fetching business:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { businessId } = params;

    if (!session || session.user.role !== Role.OWNER) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (session.user.businessId !== businessId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, address, phone } = body;

    const updatedBusiness = await prisma.business.update({
      where: {
        id: businessId,
      },
      data: {
        name,
        address,
        phone,
      },
    });

    return NextResponse.json(updatedBusiness);
  } catch (error) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
