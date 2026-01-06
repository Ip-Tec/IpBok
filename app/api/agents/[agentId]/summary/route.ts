export const dynamic = "force-dynamic";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/src/generated";
import { TransactionStatus } from "@/src/generated";

// A helper function to get the start and end of the current day
const getTodayDateRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getYesterdayDateRange = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date();
  endOfYesterday.setDate(endOfYesterday.getDate() - 1);
  endOfYesterday.setHours(23, 59, 59, 999);

  return { start: yesterday, end: endOfYesterday };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;

  if (!agentId) {
    console.error("Agent Summary API Error: agentId is undefined.");
    return NextResponse.json(
      { message: "Agent ID is required" },
      { status: 400 },
    );
  }

  console.log(
    `Attempting to fetch agent-specific summary data for agentId: ${agentId}`,
  );

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.error("Agent Summary API Error: No user session found.");
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  // Authorization: An agent can only view their own summary data.
  // An owner can view any agent's summary data within their business.
  if (session.user.role === Role.AGENT && session.user.id !== agentId) {
    console.error(
      `Agent Summary API Error: Agent ${session.user.id} tried to access summary data for another agent ${agentId}.`,
    );
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 403 },
    );
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
        `Agent Summary API Error: Owner ${session.user.id} tried to access summary data for agent ${agentId} not in their business.`,
      );
      return NextResponse.json(
        { message: "Agent not found in your business" },
        { status: 403 },
      );
    }
  } else if (session.user.role === Role.OWNER && !session.user.businessId) {
    console.error("Agent Summary API Error: Owner session missing businessId.");
    return NextResponse.json(
      { message: "Owner session missing business ID" },
      { status: 400 },
    );
  }

  // For both AGENT and OWNER roles, we need a businessId for the agent.
  let targetBusinessId: string | undefined;
  if (session.user.role === Role.AGENT) {
    targetBusinessId = session.user.businessId;
  } else {
    // Role.OWNER
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { memberships: { select: { businessId: true } } },
    });
    targetBusinessId = agent?.memberships[0]?.businessId;
  }

  if (!targetBusinessId) {
    console.error(
      `Agent Summary API Error: Could not determine businessId for agent ${agentId}.`,
    );
    return NextResponse.json(
      { message: "Business ID not found for agent" },
      { status: 400 },
    );
  }

  console.log(
    `Fetching summary data for agent ${agentId} in business ${targetBusinessId}`,
  );
  const { start: todayStart, end: todayEnd } = getTodayDateRange();
  const { start: yesterdayStart, end: yesterdayEnd } = getYesterdayDateRange();

  try {
    // Today's transactions
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        businessId: targetBusinessId,
        recordedById: agentId,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        type: {
          select: { name: true },
        },
      },
    });

    // Yesterday's transactions for balance calculation
    const yesterdayTransactions = await prisma.transaction.findMany({
      where: {
        businessId: targetBusinessId,
        recordedById: agentId,
        date: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
      include: {
        type: {
          select: { name: true },
        },
      },
    });

    let todayTotalCollected = 0;
    let cashCollectedToday = 0;
    let bankCollectedToday = 0;
    let yesterdayBalance = 0;

    for (const tx of todayTransactions) {
      if (tx.type?.name?.toLowerCase() === "deposit") {
        todayTotalCollected += tx.amount;
        if (tx.paymentMethod?.toLowerCase() === "cash") {
          cashCollectedToday += tx.amount;
        } else if (tx.paymentMethod?.toLowerCase() === "bank") {
          bankCollectedToday += tx.amount;
        }
      }
    }

    // Calculate yesterday's balance (simplified: sum of all deposits for yesterday)
    for (const tx of yesterdayTransactions) {
      if (tx.type?.name?.toLowerCase() === "deposit") {
        yesterdayBalance += tx.amount;
      }
    }

    // Fetch current balances from Financial Accounts
    const accounts = await prisma.financialAccount.findMany({
      where: {
        holderId: agentId,
        businessId: targetBusinessId,
      },
    });

    // Fallback to 0 if no account found (though they should exist now for new agents)
    const currentCashBalance =
      accounts.find((a: any) => a.type === "CASH")?.balance || 0;
    const currentBankBalance =
      accounts.find((a: any) => a.type === "BANK")?.balance || 0;

    // Determine pending reconciliation status (simplified for now, based on if there are any transactions today)
    const pendingReconciliationStatus =
      todayTransactions.length > 0 ? "Pending" : "Reconciled";

    const pendingCashAdvance = await prisma.cashAdvance.findFirst({
      where: {
        receivedById: agentId,
        status: "PENDING",
      },
      include: {
        givenBy: {
          select: {
            name: true,
          },
        },
      },
    });

    const business = await prisma.business.findUnique({
      where: {
        id: targetBusinessId,
      },
      select: {
        phone: true,
      },
    });

    const summaryData = {
      todayTotalCollected,
      cashCollectedToday,
      bankCollectedToday,
      pendingReconciliationStatus,
      yesterdayBalance,
      pendingCashAdvance,
      businessPhone: business?.phone,
      currentCashBalance,
      currentBankBalance,
    };

    console.log(`Successfully processed summary data for agent ${agentId}.`);
    return NextResponse.json(summaryData);
  } catch (error) {
    console.error("Agent Summary API - Internal Server Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Internal Server Error", error: errorMessage },
      { status: 500 },
    );
  }
}
