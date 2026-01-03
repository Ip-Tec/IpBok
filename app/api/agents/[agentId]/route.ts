export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await req.json();
    const { name, email } = body;

    if (!name && !email) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    const data: { name?: string; email?: string } = {};
    if (name) data.name = name;
    if (email) data.email = email;

    const updatedUser = await prisma.user.update({
      where: { id: agentId },
      data,
    });

    return NextResponse.json(
      { message: "Agent updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    // First, delete the membership associated with the agent
    await prisma.membership.deleteMany({
      where: { userId: agentId },
    });

    // Then, delete the user itself
    await prisma.user.delete({
      where: { id: agentId },
    });

    return NextResponse.json(
      { message: "Agent deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting agent:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}