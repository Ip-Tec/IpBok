export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Permission, hasPermission } from "@/lib/permissions";
import { User } from "@/lib/types";
import { RequestStatus, RequestType, TransactionStatus, PaymentMethod } from "@/src/generated/enums";
import { createNotification } from "@/lib/notifications";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;
  const user = session.user as User;

  try {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { requester: true }
    });

    if (!request) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    if (request.status !== RequestStatus.PENDING) {
      return NextResponse.json({ message: "Request already processed" }, { status: 400 });
    }

    // Check Permissions
    const requiredPermission = request.amount > 50000 
        ? Permission.APPROVE_REQUESTS_LARGE 
        : Permission.APPROVE_REQUESTS_SMALL;

    if (!hasPermission(user, requiredPermission)) {
        return NextResponse.json({ message: "Insufficient permissions" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
        // Update request
        await tx.request.update({
            where: { id: requestId },
            data: {
                status: RequestStatus.APPROVED,
                approverId: user.id
            }
        });

        if (request.type === RequestType.CASH_ADVANCE) {
            await tx.cashAdvance.create({
                data: {
                    amount: request.amount,
                    description: request.description || "Approved Request",
                    status: "CONFIRMED", 
                    businessId: request.businessId,
                    givenById: user.id,
                    receivedById: request.requesterId,
                    date: new Date()
                }
            });
        } else if (request.type === RequestType.EXPENSE_REIMBURSEMENT) {
             const expenseType = await tx.transactionType.findUnique({ where: { name: "Expense" } });
             if (expenseType) {
                 await tx.transaction.create({
                     data: {
                         amount: request.amount,
                         description: `Reimbursement: ${request.description}`,
                         typeId: expenseType.id,
                         paymentMethod: PaymentMethod.CASH, 
                         status: TransactionStatus.CONFIRMED,
                         businessId: request.businessId,
                         recordedById: user.id,
                         recipientId: request.requesterId,
                         date: new Date()
                     }
                 });
             }
        }
    });

    // Notify Requester
    await createNotification(
        request.requesterId,
        `Your request for ₦${request.amount} has been approved.`,
        `/dashboard`
    );

    return NextResponse.json({ message: "Approved successfully" });

  } catch (error) {
    console.error("Error approving request:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
