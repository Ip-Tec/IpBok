import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Role } from '@/src/generated/enums';

export async function POST(req: NextRequest, context: { params: Promise<{ transactionId: string }> }) {
  const session = await getServerSession(authOptions);

  // 1. Authenticate and authorize the user as an OWNER
  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: 'Not authenticated or not part of a business' }, { status: 401 });
  }

  if (session.user.role !== Role.OWNER) {
    return NextResponse.json({ message: 'Unauthorized: Only owners can approve transactions.' }, { status: 403 });
  }

  try {
    const { transactionId } = await context.params;

    // 2. Find the transaction and verify it belongs to the owner's business
    const transaction = await prisma.transaction.findFirst({
        where: {
            id: transactionId,
            businessId: session.user.businessId,
        }
    });

    if (!transaction) {
        return NextResponse.json({ message: 'Transaction not found in your business' }, { status: 404 });
    }

    if(transaction.status !== "PENDING") {
        return NextResponse.json({ message: `Transaction is already ${transaction.status}` }, { status: 400 });
    }

    // 3. Update the transaction status to CONFIRMED
    const updatedTransaction = await prisma.transaction.update({
        where: {
            id: transactionId,
        },
        data: {
            status: "CONFIRMED",
        },
    });

    // 4. Create a notification for the agent who recorded the transaction
    try {
        if (transaction.recordedById) {
            const message = `Your transaction of ${updatedTransaction.amount} has been approved by ${session.user.name || 'the owner'}.`;
            await prisma.notification.create({
                data: {
                    userId: transaction.recordedById,
                    message: message,
                    link: `/dashboard/transactions`,
                }
            });
        }
    } catch (notificationError) {
        console.error('Failed to create approval notification:', notificationError);
    }

    return NextResponse.json(updatedTransaction, { status: 200 });

  } catch (error) {
    console.error('Error approving transaction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Internal Server Error', error: errorMessage },
      { status: 500 }
    );
  }
}
