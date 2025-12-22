import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/src/generated/enums";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json(
      { message: "Business ID is required" },
      { status: 400 }
    );
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        businessId: businessId,
      },
      include: {
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        type: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  // Only Agents and Owners can create transactions
  if (session.user.role !== Role.AGENT && session.user.role !== Role.OWNER) {
    return NextResponse.json({ message: "Unauthorized role" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      type,
      amount,
      paymentMethod,
      description,
      businessId,
      userId,
      date,
    } = body;

    // Basic validation
    if (!type || !amount || !paymentMethod || !businessId || !userId || !date) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure the transaction is for the user's own business or for an agent within an owner's business
    if (
      session.user.role === Role.AGENT &&
      session.user.businessId !== businessId
    ) {
      return NextResponse.json(
        { message: "Cannot add transaction for another business" },
        { status: 403 }
      );
    }
    // For owner, we need to verify the agent (userId) belongs to their business
    if (session.user.role === Role.OWNER) {
      const agent = await prisma.user.findFirst({
        where: {
          id: userId,
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
          { message: "Agent not found in your business" },
          { status: 403 }
        );
      }
    }

    // Find the transaction type ID
    const transactionType = await prisma.transactionType.findFirst({
      where: { name: type },
    });

    if (!transactionType) {
      return NextResponse.json(
        { message: `Transaction type '${type}' not found` },
        { status: 400 }
      );
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        paymentMethod: paymentMethod,
        description: description,
        date: new Date(date),
        recordedById: session.user.id, // The user performing the action
        businessId: businessId,
        typeId: transactionType.id,
        // status: "pending", // Default status for new transactions
      },
    });

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Internal Server Error", error: errorMessage },
      { status: 500 }
    );
  }
}
