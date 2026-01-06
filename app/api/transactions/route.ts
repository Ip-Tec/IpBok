export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@/src/generated";
import { logAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchQuery = searchParams.get("searchQuery");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const paymentMethod = searchParams.get("paymentMethod");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!businessId) {
    return NextResponse.json(
      { message: "Business ID is required" },
      { status: 400 },
    );
  }

  // Verify that the user is part of the business
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      businessId: businessId,
    },
  });

  if (!membership) {
    return NextResponse.json(
      { message: "You are not a member of this business" },
      { status: 403 },
    );
  }

  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    businessId: businessId,
    AND: [],
  };

  if (searchQuery) {
    where.AND.push({
      OR: [
        {
          recordedBy: {
            name: { contains: searchQuery },
          },
        },
        {
          recordedBy: {
            email: { contains: searchQuery },
          },
        },
      ],
    });
  }

  if (status && status !== "all") {
    where.AND.push({ status: status });
  }

  if (type && type !== "all") {
    where.AND.push({ type: { name: type } });
  }

  if (paymentMethod && paymentMethod !== "all") {
    where.AND.push({ paymentMethod: paymentMethod });
  }

  if (startDate) {
    const from = new Date(startDate);
    from.setHours(0, 0, 0, 0);
    const to = endDate ? new Date(endDate) : new Date(from);
    to.setHours(23, 59, 59, 999);
    where.AND.push({ date: { gte: from, lte: to } });
  }

  if (where.AND.length === 0) {
    delete where.AND;
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where,
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
      skip: skip,
      take: limit,
    });

    const totalTransactions = await prisma.transaction.count({
      where,
    });

    return NextResponse.json({
      transactions,
      totalPages: Math.ceil(totalTransactions / limit),
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
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
    if (
      !type ||
      amount === undefined ||
      amount === null ||
      !paymentMethod ||
      !businessId ||
      !userId ||
      !date
    ) {
      return NextResponse.json(
        {
          message: "Missing required fields",
          details: { type, amount, paymentMethod, businessId, userId, date },
        },
        { status: 400 },
      );
    }

    // Validate payment method enum
    const validPaymentMethods = [
      "CASH",
      "ATM_CARD",
      "BANK_TRANSFER",
      "MOBILE_MONEY",
      "BANK",
    ];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        {
          message: `Invalid payment method: ${paymentMethod}. Must be one of: ${validPaymentMethods.join(
            ", ",
          )}`,
        },
        { status: 400 },
      );
    }

    // Ensure the transaction is for the user's own business or for an agent within an owner's business
    if (
      session.user.role === Role.AGENT &&
      session.user.businessId !== businessId
    ) {
      return NextResponse.json(
        { message: "Cannot add transaction for another business" },
        { status: 403 },
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
          { status: 403 },
        );
      }
    }

    // Find or create the transaction type
    let transactionType = await prisma.transactionType.findFirst({
      where: { name: type },
    });

    // If transaction type doesn't exist, create it
    if (!transactionType) {
      try {
        transactionType = await prisma.transactionType.create({
          data: { name: type },
        });
        console.log(`Created missing transaction type: ${type}`);
      } catch (error) {
        console.error(`Failed to create transaction type ${type}:`, error);
        return NextResponse.json(
          {
            message: `Transaction type '${type}' not found and could not be created`,
          },
          { status: 500 },
        );
      }
    }

    // Validate amount is a positive number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { message: "Amount must be a positive number" },
        { status: 400 },
      );
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        amount: parsedAmount,
        paymentMethod: paymentMethod as any, // Type assertion for enum
        description: description || null,
        date: new Date(date),
        recordedById: session.user.id, // The user performing the action
        businessId: businessId,
        typeId: transactionType.id,
        // status defaults to PENDING from schema
      },
    });

    // Create a notification for the business owner if an agent creates a transaction
    if (session.user.role === Role.AGENT) {
      try {
        const owners = await prisma.user.findMany({
          where: {
            role: Role.OWNER,
            memberships: {
              some: {
                businessId: businessId,
              },
            },
          },
        });

        const message = `${session.user.name || "An agent"} recorded a new ${
          transactionType.name
        } of ${amount}.`;

        for (const owner of owners) {
          await prisma.notification.create({
            data: {
              userId: owner.id,
              message: message,
              link: "/dashboard/transactions",
            },
          });
        }
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
        // Do not block the response for a notification failure
      }
    }

    await logAction("TRANSACTION_CREATE", session.user.id, {
      transactionId: newTransaction.id,
      amount: parsedAmount,
      type: transactionType.name,
      businessId: businessId,
    });

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Internal Server Error", error: errorMessage },
      { status: 500 },
    );
  }
}
