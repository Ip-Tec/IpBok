import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Permission, hasPermission } from "@/lib/permissions";
import { User } from "@/lib/types";
import { RequestStatus } from "@/src/generated/enums";
import { createNotification } from "@/lib/notifications";

export async function PATCH(req: NextRequest, { params }: { params: { requestId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = params;
  const user = session.user as User;

  try {
    const request = await prisma.request.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    if (request.status !== RequestStatus.PENDING) {
      return NextResponse.json({ message: "Request already processed" }, { status: 400 });
    }

    const canReject = hasPermission(user, Permission.APPROVE_REQUESTS_SMALL) || hasPermission(user, Permission.APPROVE_REQUESTS_LARGE);
    
    if (!canReject) {
         return NextResponse.json({ message: "Insufficient permissions" }, { status: 403 });
    }

    await prisma.request.update({
        where: { id: requestId },
        data: {
            status: RequestStatus.REJECTED,
            approverId: user.id
        }
    });

    // Notify Requester
    await createNotification(
        request.requesterId,
        `Your request for ₦${request.amount} was rejected.`,
        `/dashboard`
    );

    return NextResponse.json({ message: "Rejected successfully" });

  } catch (error) {
    console.error("Error rejecting request:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
