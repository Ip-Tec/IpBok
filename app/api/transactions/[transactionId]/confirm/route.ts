export const dynamic = "force-dynamic";
import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Role } from '@/src/generated/enums';
import { TransactionStatus } from '@/src/generated/client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) {
  const session = await getServerSession(authOptions);

  // 1. Authenticate and authorize the user as an AGENT
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  if (session.user.role !== Role.AGENT) {
    return NextResponse.json({ message: 'Unauthorized: Only agents can confirm receipt.' }, { status: 403 });
  }

  try {
    const { transactionId } = await params;

    // 2. Find the transaction and verify the agent is the recipient
    const transaction = await prisma.transaction.findFirst({
        where: {
            id: transactionId,
            recipientId: session.user.id
        }
    });

    if (!transaction) {
        return NextResponse.json({ message: 'Transaction not found or you are not the recipient' }, { status: 404 });
    }

    // 3. Ensure transaction is PENDING
    if(transaction.status !== "PENDING") {
        return NextResponse.json({ message: `Transaction is already ${transaction.status}` }, { status: 400 });
    }

    // 4. Update the transaction status to CONFIRMED
    const updatedTransaction = await prisma.transaction.update({
        where: {
            id: transactionId,
        },
        data: {
            status: "CONFIRMED",
        },
    });

    // 5. Create a notification for the owner who sent the cash
    try {
        if (transaction.recordedById) {
            const formattedAmount = new Intl.NumberFormat('en-NG', { 
              style: 'currency', 
              currency: 'NGN' 
            }).format(transaction.amount);
            const agentName = session.user.name || 'Your agent';
            const message = `${agentName} has confirmed receipt of ${formattedAmount}. Transaction is now successful.`;
            await prisma.notification.create({
                data: {
                    userId: transaction.recordedById,
                    message: message,
                    link: `/dashboard/transactions`,
                }
            });
        }
    } catch (notificationError) {
        console.error('Failed to create receipt notification:', notificationError);
    }

    return NextResponse.json(updatedTransaction, { status: 200 });

  } catch (error) {
    console.error('Error confirming transaction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Internal Server Error', error: errorMessage },
      { status: 500 }
    );
  }
}
