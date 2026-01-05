export const dynamic = "force-dynamic";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role } from "@/src/generated";

// A helper function to get the start and end of the current day
const getTodayDateRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export async function GET(req: NextRequest) {
  console.log("Attempting to fetch reconciliation data...");

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.error("Reconciliation API Error: No user session found.");
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  if (session.user.role !== Role.OWNER) {
    console.error(`Reconciliation API Error: User role is not OWNER. Role: ${session.user.role}`);
    return NextResponse.json({ message: "User is not an owner" }, { status: 403 });
  }
  
  if (!session.user.businessId) {
    console.error("Reconciliation API Error: businessId missing from session.");
    return NextResponse.json({ message: "Business ID is missing from session" }, { status: 400 });
  }

  const { businessId } = session.user;
  console.log(`Fetching data for businessId: ${businessId}`);
  const { start, end } = getTodayDateRange();

  try {
    // 1. Get all agents for the business
    const agents = await prisma.user.findMany({
      where: {
        role: Role.AGENT,
        memberships: {
          some: {
            businessId: businessId,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
    console.log(`Found ${agents.length} agents.`);

    // 2. Get all relevant transactions for the day
    const transactions = await prisma.transaction.findMany({
      where: {
        businessId: businessId,
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
    console.log(`Found ${transactions.length} transactions.`);

    // 3. Process data
    const agentReconciliation = new Map();

    for (const agent of agents) {
      agentReconciliation.set(agent.id, {
        name: agent.name || "Unnamed Agent",
        expected: 0,
        submitted: 0,
      });
    }

    for (const transaction of transactions) {
      const agentData = agentReconciliation.get(transaction.recordedById);
      if (agentData) {
        // Defensive check to prevent crash if type info is missing
        if (transaction.type?.name) {
          const transactionTypeName = transaction.type.name.toLowerCase();
          // ASSUMPTION: 'Charge' transactions contribute to the expected amount.
          if (transactionTypeName === 'charge') {
            agentData.expected += transaction.amount;
          }
          // ASSUMPTION: 'Deposit' transactions with 'CASH' payment method count as submitted.
          if (transactionTypeName === 'deposit' && transaction.paymentMethod === 'CASH') {
            agentData.submitted += transaction.amount;
          }
        }
      }
    }
    
    // 4. Format the response
    let totalExpectedCash = 0;
    let totalSubmittedCash = 0;

    const agentDetails = Array.from(agentReconciliation.values()).map(data => {
      const difference = data.submitted - data.expected;
      totalExpectedCash += data.expected;
      totalSubmittedCash += data.submitted;
      return {
        ...data,
        difference,
        status: difference === 0 ? "Reconciled" : "Pending",
      };
    });

    const dailyReconciliation = {
      totalExpectedCash,
      totalSubmittedCash,
      difference: totalSubmittedCash - totalExpectedCash,
      agents: agentDetails,
    };

    console.log("Successfully processed reconciliation data.");
    return NextResponse.json(dailyReconciliation);

  } catch (error) {
    console.error("Reconciliation API - Internal Server Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Internal Server Error", error: errorMessage }, { status: 500 });
  }
}
