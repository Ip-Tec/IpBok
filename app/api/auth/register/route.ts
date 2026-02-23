export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@/src/generated";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email";
import { logAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const { name, email: reqEmail, password, role: reqRole, businessId: reqBusinessId, token: inviteToken } = await request.json();
    let email = reqEmail;
    let role = reqRole;
    let businessId = reqBusinessId;

    if (inviteToken) {
      const vToken = await prisma.verificationToken.findUnique({
        where: { token: inviteToken }
      });

      if (!vToken || vToken.expires < new Date()) {
        return NextResponse.json({ error: "Invalid or expired invitation token" }, { status: 400 });
      }

      if (vToken.identifier.startsWith("INVITE:")) {
        const [, inviteEmail, inviteRole, inviteBusinessId] = vToken.identifier.split(":");
        email = inviteEmail;
        role = inviteRole;
        businessId = inviteBusinessId;
      }
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
      });
    } catch (checkError) {
      console.error(
        "Database connectivity error during registration check:",
        checkError,
      );
      return NextResponse.json(
        {
          error:
            "Cannot connect to the database. Please ensure your database is running and whitelisted.",
        },
        { status: 503 },
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerifiedDate = inviteToken ? new Date() : null;

    if (!inviteToken) {
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
        return NextResponse.json(
          {
            error:
              "Failed to initialize verification. Database connection may be down.",
          },
          { status: 500 },
        );
      }

      // Send email
      try {
        const protocol = request.nextUrl.protocol;
        const host = request.headers.get("host");
        const baseUrl = `${protocol}//${host}`;
        await sendVerificationEmail(email, token, baseUrl);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return NextResponse.json(
          {
            error:
              "Failed to send verification email. Please check your email configuration.",
          },
          { status: 500 },
        );
      }
    }

    let user;
    if (role === "OWNER") {
      // Use a transaction for consistency
      try {
        const result = await prisma.$transaction(async (tx: any) => {
          const newUser = await tx.user.create({
            data: {
              name,
              email,
              emailVerified: emailVerifiedDate,
              password: hashedPassword,
              role: "OWNER",
              memberships: {
                create: {
                  role: "OWNER",
                  business: {
                    create: {
                      name: `${name}'s Business`,
                      type: "PERSONAL",
                    },
                  },
                },
              },
            },
          });
          return newUser;
        });
        user = result;
      } catch (txError) {
        console.error("Transaction error:", txError);
        return NextResponse.json(
          { error: "Failed to create account in database." },
          { status: 500 },
        );
      }
    } else {
      try {
        if (businessId) {
          user = await prisma.$transaction(async (tx: any) => {
            const newUser = await tx.user.create({
              data: { name, email, emailVerified: emailVerifiedDate, password: hashedPassword, role: role as Role },
            });
            await tx.membership.create({
              data: {
                userId: newUser.id,
                businessId: businessId,
                role: role as Role,
              },
            });
            return newUser;
          });
        } else {
          user = await prisma.user.create({
            data: { name, email, emailVerified: emailVerifiedDate, password: hashedPassword, role: "AGENT" },
          });
        }
      } catch (userError) {
        console.error("User creation error:", userError);
        return NextResponse.json(
          { error: "Failed to create user account." },
          { status: 500 },
        );
      }
    }

    await logAction("USER_REGISTER", user.id, {
      email: user.email,
      role: user.role,
      name: user.name,
    });

    if (inviteToken) {
      await prisma.verificationToken.delete({ where: { token: inviteToken } }).catch(e => console.error("Failed to delete token", e));
    }

    return NextResponse.json(
      {
        message: inviteToken 
          ? "Account created and invitation accepted successfully!"
          : "Registration successful. Please check your email to verify your account.",
        userId: user.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration overall error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 },
    );
  }
}
