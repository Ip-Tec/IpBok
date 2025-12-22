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
    console.error("Agent Task Status API Error: agentId is undefined.");
    return NextResponse.json({ message: "Agent ID is required" }, { status: 400 });
  }

  console.log(`Attempting to fetch agent-specific task status for agentId: ${agentId}`);

  const session = await getServerSession(authOptions);


  if (!session?.user?.id) {
    console.error("Agent Task Status API Error: No user session found.");
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  // Authorization: An agent can only view their own task status.
  // An owner can view any agent's task status within their business.
  if (session.user.role === Role.AGENT && session.user.id !== agentId) {
    console.error(
      `Agent Task Status API Error: Agent ${session.user.id} tried to access task status for another agent ${agentId}.`
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
        `Agent Task Status API Error: Owner ${session.user.id} tried to access task status for agent ${agentId} not in their business.`
      );
      return NextResponse.json({ message: "Agent not found in your business" }, { status: 403 });
    }
  } else if (session.user.role === Role.OWNER && !session.user.businessId) {
    console.error("Agent Task Status API Error: Owner session missing businessId.");
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
      console.error(`Agent Task Status API Error: Could not determine businessId for agent ${agentId}.`);
      return NextResponse.json({ message: "Business ID not found for agent" }, { status: 400 });
  }

  console.log(`Fetching task status data for agent ${agentId} in business ${targetBusinessId}`);
  const { start: todayStart, end: todayEnd } = getTodayDateRange();

  try {
    // Check for today's transactions
    const todayTransactionsCount = await prisma.transaction.count({
      where: {
        businessId: targetBusinessId,
        recordedById: agentId,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Check for pending reconciliation status (simplified: if there are any transactions today)
    const reconciliationPending = todayTransactionsCount > 0;

    // Check if user is logged in (always true if session exists here)
    const loggedIn = !!session.user.id;

    // Reconciliation status (this is simplified, a proper reconciliation status would come from a reconciliation record)
    // For now, let's assume reconciled is false if there are transactions and no explicit reconciliation record
    const reconciled = false; // Placeholder, needs actual reconciliation logic

    const taskStatusData = {
      loggedIn: loggedIn,
      transactionsRecorded: todayTransactionsCount > 0,
      reconciliationPending: reconciliationPending,
      reconciled: reconciled,
    };

    console.log(`Successfully processed task status data for agent ${agentId}.`);
    return NextResponse.json(taskStatusData);

  } catch (error) {
    console.error("Agent Task Status API - Internal Server Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Internal Server Error", error: errorMessage }, { status: 500 });
  }
}
