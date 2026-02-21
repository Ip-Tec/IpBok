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
    const products = await prisma.retailProduct.findMany({
      where: { businessId: session.user.businessId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    // Strip costPrice for Cashiers
    if (session.user.role === "CASHIER") {
      return NextResponse.json(products.map(({ costPrice, ...rest }) => ({
        ...rest,
        sellingPrice: rest.sellingPrice || rest.minPrice || 0, // Fallback for UI convenience
      })));
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Only Owners and Managers can create products
  if (!["OWNER", "MANAGER"].includes(session.user.role.toUpperCase())) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      description,
      sku,
      costPrice,
      sellingPrice,
      minPrice,
      maxPrice,
      stockQuantity,
      categoryId,
    } = body;

    const product = await prisma.retailProduct.create({
      data: {
        name,
        description,
        sku,
        costPrice: Number(costPrice),
        sellingPrice: sellingPrice ? Number(sellingPrice) : null,
        minPrice: minPrice ? Number(minPrice) : null,
        maxPrice: maxPrice ? Number(maxPrice) : null,
        stockQuantity: Number(stockQuantity),
        businessId: session.user.businessId,
        categoryId: categoryId || null,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
