import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    if (role === "OWNER") {
      // Use a transaction to ensure atomicity
      [user] = await prisma.$transaction([
        prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "OWNER",
            memberships: {
              create: {
                role: "OWNER",
                business: { create: { name: `${name}'s Business` } },
              },
            },
          },
        }),
      ]);
    } else {
      user = await prisma.user.create({
        data: { name, email, password: hashedPassword, role: "AGENT" },
      });
    }

    return NextResponse.json({ message: "User created successfully", userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}