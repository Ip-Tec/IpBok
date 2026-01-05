export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@/src/generated";

// Create a new agent
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      businessId,
      initialCash = 0,
      initialBank = 0,
      role = Role.AGENT,
    } = body;

    if (!name || !email || !password || !businessId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate role
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role, // Use selected role
          emailVerified: new Date(),
        },
      });

      // 2. Create Membership
      await tx.membership.create({
        data: {
          userId: user.id,
          businessId: businessId,
          role: role, // Use selected role
        },
      });

      // 3. Create Accounts ONLY for AGENT role
      if (role === Role.AGENT) {
        // Create Cash Account
        await tx.financialAccount.create({
          data: {
            name: `${name}'s Cash Float`,
            type: "CASH",
            balance: initialCash,
            businessId: businessId,
            holderId: user.id,
          },
        });

        // Create Bank Account
        await tx.financialAccount.create({
          data: {
            name: `${name}'s Bank Float`,
            type: "BANK",
            balance: initialBank,
            businessId: businessId,
            holderId: user.id,
          },
        });
      }

      return user;
    });

    return NextResponse.json(
      { message: "Agent created successfully", user: result },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json(
      { message: "Business ID is required" },
      { status: 400 },
    );
  }

  try {
    const memberships = await prisma.membership.findMany({
      where: {
        businessId: businessId,
        role: Role.AGENT,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const agents = await Promise.all(
      memberships.map(async (m: any) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dailyTransactionCount = await prisma.transaction.count({
          where: {
            recordedById: m.userId,
            businessId: businessId,
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        });

        return {
          ...m.user,
          status: "Active", // this is hardcoded for now
          dailyTransactionCount,
        };
      }),
    );

    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
