export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { TransactionStatus } from "@/src/generated";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount, description, type, paymentMethod } = await req.json(); // type is "Income" or "Expense"

    if (!amount || !type || !paymentMethod) {
        return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Find the transaction type ID
    const txType = await prisma.transactionType.findUnique({
        where: { name: type }
    });

    if (!txType) {
        return NextResponse.json({ message: `Invalid transaction type: ${type}` }, { status: 400 });
    }

    await prisma.transaction.create({
        data: {
            amount: parseFloat(amount),
            description,
            typeId: txType.id,
            paymentMethod,
            status: TransactionStatus.CONFIRMED,
            businessId: session.user.businessId,
            recordedById: session.user.id,
            date: new Date(),
        }
    });

    return NextResponse.json({ message: "Transaction recorded successfully" });

  } catch (error) {
    console.error("Error recording transaction:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
