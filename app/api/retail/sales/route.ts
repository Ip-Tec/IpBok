import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const whereClause: any = { businessId: session.user.businessId };
    
    // Cashiers only see their own sales
    if (session.user.role === "CASHIER") {
      whereClause.recordedById = session.user.id;
    }

    const sales = await prisma.retailSale.findMany({
      where: whereClause,
      include: { product: true },
      orderBy: { date: "desc" },
    });

    // Strip profit for Cashiers
    if (session.user.role === "CASHIER") {
      return NextResponse.json(sales.map(({ profit, ...rest }) => rest));
    }

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, quantity, price } = body;

    const product = await prisma.retailProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    if (product.stockQuantity < quantity) {
      return NextResponse.json({ message: "Insufficient stock" }, { status: 400 });
    }

    const totalAmount = Number(price) * Number(quantity);
    const profit = (Number(price) - product.costPrice) * Number(quantity);

    // Transactional update: Record sale and update stock
    const sale = await prisma.$transaction([
      prisma.retailSale.create({
        data: {
          productId,
          quantity: Number(quantity),
          price: Number(price),
          totalAmount,
          profit,
          businessId: session.user.businessId,
          recordedById: session.user.id,
        },
      }),
      prisma.retailProduct.update({
        where: { id: productId },
        data: {
          stockQuantity: {
            decrement: Number(quantity),
          },
        },
      }),
    ]);

    return NextResponse.json(sale[0]);
  } catch (error) {
    console.error("Error recording sale:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
