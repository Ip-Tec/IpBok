import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Role } from '@/src/generated/enums';

export async function POST(req: Request, { params }: { params: { cashAdvanceId: string } }) {
  const session = await getServerSession(authOptions);

  // 1. Authenticate and authorize the user as an AGENT
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  if (session.user.role !== Role.AGENT) {
    return NextResponse.json({ message: 'Unauthorized: Only agents can confirm receipt.' }, { status: 403 });
  }

  try {
    const { cashAdvanceId } = params;

    // 2. Find the cash advance and verify the agent is the recipient
    const cashAdvance = await prisma.cashAdvance.findFirst({
        where: {
            id: cashAdvanceId,
            receivedById: session.user.id
        },
        include: {
            givenBy: {
                select: {
                    name: true,
                }
            }
        }
    });

    if (!cashAdvance) {
        return NextResponse.json({ message: 'Cash advance not found or you are not the recipient' }, { status: 404 });
    }

    // 3. Ensure cash advance is PENDING
    if(cashAdvance.status !== "PENDING") {
        return NextResponse.json({ message: `Cash advance is already ${cashAdvance.status}` }, { status: 400 });
    }

    // 4. Update the cash advance status to CONFIRMED
    const updatedCashAdvance = await prisma.cashAdvance.update({
        where: {
            id: cashAdvanceId,
        },
        data: {
            status: "CONFIRMED",
            confirmedAt: new Date(),
        },
    });

    // 5. Create a notification for the owner who sent the cash
    try {
        if (cashAdvance.givenById) {
            const formattedAmount = new Intl.NumberFormat('en-NG', { 
              style: 'currency', 
              currency: 'NGN' 
            }).format(cashAdvance.amount);
            const agentName = session.user.name || 'Your agent';
            const message = `${agentName} has confirmed receipt of ${formattedAmount}. Cash advance is now confirmed.`;
            await prisma.notification.create({
                data: {
                    userId: cashAdvance.givenById,
                    message: message,
                    link: `/dashboard`,
                }
            });
        }
    } catch (notificationError) {
        console.error('Failed to create receipt notification:', notificationError);
    }

    return NextResponse.json(updatedCashAdvance, { status: 200 });

  } catch (error) {
    console.error('Error confirming cash advance:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Internal Server Error', error: errorMessage },
      { status: 500 }
    );
  }
}

