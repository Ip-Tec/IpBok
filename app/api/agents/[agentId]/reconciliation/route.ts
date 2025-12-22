import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role } from "@/src/generated/enums";

// A helper function to get the start and end of the current day
const getTodayDateRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export async function GET(
  request: Request,
  { params }: { params: { agentId: string } }
) {
  const awaitedParams = await Promise.resolve(params); // Explicitly resolve the promise

  const { agentId } = awaitedParams;

  if (!agentId) {
    console.error("Agent Reconciliation API Error: agentId is undefined.");
    return NextResponse.json({ message: "Agent ID is required" }, { status: 400 });
  }

  console.log(`Attempting to fetch agent-specific reconciliation data for agentId: ${agentId}`);

  const session = await getServerSession(authOptions);


  if (!session?.user?.id) {
    console.error("Agent Reconciliation API Error: No user session found.");
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  // Authorization: An agent can only view their own reconciliation data.
  // An owner can view any agent's reconciliation data within their business.
  if (session.user.role === Role.AGENT && session.user.id !== agentId) {
    console.error(
      `Agent Reconciliation API Error: Agent ${session.user.id} tried to access reconciliation data for another agent ${agentId}.`
    );
    return NextResponse.json({ message: "Unauthorized access" }, { status: 403 });
  }

  // If the user is an owner, ensure the agent belongs to their business
  if (session.user.role === Role.OWNER && session.user.businessId) {
    const agentInBusiness = await prisma.user.findFirst({
      where: {
        id: agentId,
        role: Role.AGENT,
        memberships: {
          some: {
            businessId: session.user.businessId,
          },
        },
      },
    });
    if (!agentInBusiness) {
      console.error(
        `Agent Reconciliation API Error: Owner ${session.user.id} tried to access reconciliation data for agent ${agentId} not in their business.`
      );
      return NextResponse.json({ message: "Agent not found in your business" }, { status: 403 });
    }
  } else if (session.user.role === Role.OWNER && !session.user.businessId) {
    console.error("Agent Reconciliation API Error: Owner session missing businessId.");
    return NextResponse.json({ message: "Owner session missing business ID" }, { status: 400 });
  }
  
  // For both AGENT and OWNER roles, we need a businessId for the agent.
  let targetBusinessId: string | undefined;
  if (session.user.role === Role.AGENT) {
      targetBusinessId = session.user.businessId;
  } else { // Role.OWNER
      const agent = await prisma.user.findUnique({
          where: { id: agentId },
          select: { memberships: { select: { businessId: true } } }
      });
      targetBusinessId = agent?.memberships[0]?.businessId;
  }

  if (!targetBusinessId) {
      console.error(`Agent Reconciliation API Error: Could not determine businessId for agent ${agentId}.`);
      return NextResponse.json({ message: "Business ID not found for agent" }, { status: 400 });
  }

  console.log(`Fetching reconciliation data for agent ${agentId} in business ${targetBusinessId}`);
  const { start, end } = getTodayDateRange();

  try {
    // 1. Get all relevant transactions for the agent for the day
    const transactions = await prisma.transaction.findMany({
      where: {
        businessId: targetBusinessId,
        recordedById: agentId,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        type: {
          select: { name: true },
        },
      },
    });
    console.log(`Found ${transactions.length} transactions for agent ${agentId}.`);

    // 2. Process data for the specific agent
    let expected = 0;
    let submitted = 0;

    for (const transaction of transactions) {
        if (transaction.type?.name) {
            const transactionTypeName = transaction.type.name.toLowerCase();
            // ASSUMPTION: 'Charge' transactions contribute to the expected amount.
            if (transactionTypeName === 'charge') {
                expected += transaction.amount;
            }
            // ASSUMPTION: 'Deposit' transactions with 'CASH' payment method count as submitted.
            if (transactionTypeName === 'deposit' && transaction.paymentMethod === 'CASH') {
                submitted += transaction.amount;
            }
        }
    }
    
    // 3. Format the response
    const difference = submitted - expected;
    const status = difference === 0 ? "Reconciled" : "Pending";

    const agentReconciliationData = {
      agentId,
      expected,
      submitted,
      difference,
      status,
      // You might also want to return the raw transactions or a summary of them
    };

    console.log(`Successfully processed reconciliation data for agent ${agentId}.`);
    return NextResponse.json(agentReconciliationData);

  } catch (error) {
    console.error("Agent Reconciliation API - Internal Server Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Internal Server Error", error: errorMessage }, { status: 500 });
  }
}
