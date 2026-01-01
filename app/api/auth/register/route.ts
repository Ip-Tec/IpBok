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
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();
    const expires = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Create verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    let user;
    const { sendVerificationEmail } = require('@/lib/email');

    // Send email (non-blocking or blocking depending on preference, blocking for safety)
    try {
        await sendVerificationEmail(email, token);
    } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
    }

    if (role === "OWNER") {
      // Use a transaction to ensure atomicity
      [user] = await prisma.$transaction([
        prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "OWNER",
            // emailVerified: null, // Explicitly unverified
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

    return NextResponse.json({ 
        message: "Registration successful. Please check your email to verify your account.", 
        userId: user.id 
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}