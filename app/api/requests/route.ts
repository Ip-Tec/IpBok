export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { RequestStatus, RequestType, Role } from "@/src/generated/enums";

// GET: List requests (filtered by role)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { role } = session.user;
  const businessId = session.user.businessId;

  try {
    let where: any = { businessId };

    // Agents only see their own requests
    if (role === Role.AGENT) {
      where.requesterId = session.user.id;
    } 
    // Managers/Owners see all "PENDING" by default or all history
    // For now, let's return all for non-agents to simplify
    
    const requests = await prisma.request.findMany({
      where,
      include: {
        requester: { select: { name: true, email: true } },
        approver: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

// POST: Create a new request
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount, type, description } = await req.json();

    if (!amount || !type) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const request = await prisma.request.create({
      data: {
        amount: parseFloat(amount),
        type: type as RequestType,
        description,
        status: RequestStatus.PENDING,
        requesterId: session.user.id,
        businessId: session.user.businessId,
      }
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
