import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Role, PaymentMethod } from '@/src/generated/enums';
// import { TransactionStatus } from '@/src/generated/client';

export async function POST(req: Request, context: { params: { agentId:string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  if (session.user.role !== Role.OWNER) {
    return NextResponse.json({ message: 'Unauthorized role' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { amount, description } = body;
    
    // Workaround for a bug where agentId may not be available in context.params
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const agentId = pathSegments[3] || context.params.agentId;

    if (!amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const businessId = session.user.businessId;

    if (!businessId) {
        return NextResponse.json(
            { message: "User is not associated with a business" },
            { status: 403 }
        );
    }

    // Verify the agent belongs to the owner's business
    const agent = await prisma.user.findFirst({
      where: {
        id: agentId,
        role: Role.AGENT,
        memberships: {
          some: {
            businessId: businessId,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { message: 'Agent not found in your business' },
        { status: 403 }
      );
    }

    // Get business name for notification
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    });

    // Create cash advance in the new CashAdvance table
    const cashAdvance = await prisma.cashAdvance.create({
      data: {
        amount: parseFloat(amount),
        description: description || 'Cash advance to agent',
        businessId: businessId,
        givenById: session.user.id, // The Owner giving the cash
        receivedById: agentId, // The Agent receiving the cash
        status: "PENDING", // Cash advances must be confirmed by the agent
      },
    });

    // Create a notification for the agent receiving the cash
    try {
        const businessName = business?.name || 'Your company';
        const formattedAmount = new Intl.NumberFormat('en-NG', { 
          style: 'currency', 
          currency: 'NGN' 
        }).format(parseFloat(amount));
        const formattedTime = new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        const message = `${businessName} gave you ${formattedAmount} at ${formattedTime}. Please confirm receipt.`;
        await prisma.notification.create({
            data: {
                userId: agentId,
                message: message,
                link: '/dashboard/transactions',
            }
        });
    } catch (notificationError) {
        console.error('Failed to create cash advance notification:', notificationError);
    }

    return NextResponse.json(cashAdvance, { status: 201 });
  } catch (error) {
    console.error('Error creating cash advance:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Internal Server Error', error: errorMessage },
      { status: 500 }
    );
  }
}
