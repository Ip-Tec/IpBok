import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

    const product = await prisma.retailProduct.update({
      where: { 
        id: id,
        businessId: session.user.businessId 
      },
      data: {
        name,
        description,
        sku,
        costPrice: costPrice !== undefined ? Number(costPrice) : undefined,
        sellingPrice: sellingPrice !== undefined ? (sellingPrice ? Number(sellingPrice) : null) : undefined,
        minPrice: minPrice !== undefined ? (minPrice ? Number(minPrice) : null) : undefined,
        maxPrice: maxPrice !== undefined ? (maxPrice ? Number(maxPrice) : null) : undefined,
        stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
        categoryId: categoryId || undefined,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.retailProduct.delete({
      where: { 
        id: id,
        businessId: session.user.businessId 
      },
    });
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
