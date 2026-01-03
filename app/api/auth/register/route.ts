export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '@/lib/email';

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
    const token = uuidv4();
    const expires = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Create verification token
    try {
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });
    } catch (dbError) {
      console.error("Database error creating token:", dbError);
      return NextResponse.json({ error: "Failed to initialize verification. Database connection may be down." }, { status: 500 });
    }

    // Send email
    try {
      await sendVerificationEmail(email, token);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      return NextResponse.json({ error: "Failed to send verification email. Please check your email configuration." }, { status: 500 });
    }

    let user;
    if (role === "OWNER") {
      // Use a transaction for consistency
      try {
        const result = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
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
          });
          return newUser;
        });
        user = result;
      } catch (txError) {
        console.error("Transaction error:", txError);
        return NextResponse.json({ error: "Failed to create account in database." }, { status: 500 });
      }
    } else {
      try {
        user = await prisma.user.create({
          data: { name, email, password: hashedPassword, role: "AGENT" },
        });
      } catch (userError) {
        console.error("User creation error:", userError);
        return NextResponse.json({ error: "Failed to create user account." }, { status: 500 });
      }
    }

    return NextResponse.json({ 
        message: "Registration successful. Please check your email to verify your account.", 
        userId: user.id 
    }, { status: 201 });
  } catch (error) {
    console.error("Registration overall error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during registration." }, { status: 500 });
  }
}
